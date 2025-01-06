/* © Copyright 2024-2025, Pedro Almada
Licensed under the GPL-3.0-or-later

This file is part of the House buying calculator and is distributed WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with the house buying calculator software.
If not, see <https://www.gnu.org/licenses/>.
*/

const NUMBER_FORMAT = new Intl.NumberFormat();

const DateTime = luxon.DateTime;
const DATE_MED = luxon.DateTime.DATE_MED;

/**
 * Calculates the total tax required to pay to buy the house.
 *
 * Note: because of portuguese tax law, we have a circular dependency:
 * - Our main algorithm calculates how much we can put in for a deposit by subtracting the taxes from our savings
 * - To calculate our taxes, we need to pass the amount we want to get loaned from the bank
 * - To get the loan amount we need to know how much we can put in for a deposit...
 *
 *
 * @param {string} tax_region The country or region where the house will be bought, as provided by main page selector.
 * @param {number} house_price The price of the house
 * @param {number} mortgage_principal How much we will borrow from the bank; 0 or less if not being used.
 *                                    A rough estimate is fine as this will be a relatively low impact on the total tax.
 * @param {boolean} new_build Whether this is a new house. Affects Spanish tax.
 * @param {boolean} first_home Whether this is the first home being bought. Affects UK tax.
 * @returns {number}
 */
function get_tax_amount(tax_region, house_price, mortgage_principal, new_build = false, first_home = true) {
    let tax_amount = 0;
    let mortgage = mortgage_principal > 0;
    if (tax_region.startsWith('portugal')) {
        // This is inaccurate...
        tax_amount = taxes_and_fees_portugal(house_price, mortgage_principal);
    }
    else if (tax_region.startsWith('spain')) {
        tax_region = tax_region.replace("spain-", "");
        tax_amount = taxes_and_fees_spain(tax_region, house_price, new_build, mortgage);
    }
    else if (tax_region.startsWith('uk')) {
        tax_region = tax_region.replace("uk-", "");
        tax_amount = taxes_and_fees_uk(tax_region, house_price, first_home, mortgage);
    }

    return tax_amount;
}

/**
 * This is the main calculation function that updates the outputs based on the inputs.
 */
function calculate() {
    let birth_date = DateTime.fromISO(document.getElementById("birth_date").value);
    let retirement_age = parseInt(document.getElementById("retirement_age").value);
    let retirement_date = birth_date.plus({years: retirement_age});

    document.getElementById("date_retirement").innerHTML = retirement_date.toLocaleString(DATE_MED);

    let house_price = parseFloat(document.getElementById("house_price").value);
    let new_build = document.getElementById("new_build").checked;
    let first_home = document.getElementById("first_home").checked;
    let tax_region = document.getElementById("tax_region").value;
    let current_savings = parseFloat(document.getElementById("savings").value);
    let custom_tax = false;
    let tax_amount;

    if (tax_region.startsWith('custom')) {
        custom_tax = true;
        tax_amount = parseFloat(document.getElementById("custom_tax_amount").value);
        if (tax_amount < 0 || isNaN(tax_amount) ) {
            tax_amount = 0;
        }
    }
    else {
        // get_tax_amount has a circular dependency as it needs to know the mortgage principal for the Portuguese tax
        // calculation.
        // We therefore fudge an initial calculation to have a more accurate starting point.
        // First we get a rough idea of a deposit assuming a 0% down-payment mortgage
        let deposit = current_savings - get_tax_amount(tax_region, house_price, house_price, new_build, first_home);
        // We now have a rough tax estimate we can use to calculate a non-0% down-payment.
        let mortgage_principal = house_price - deposit;
        tax_amount = get_tax_amount(tax_region, house_price, mortgage_principal, new_build, first_home);
    }

    let mortgage_interest_rate = parseFloat(document.getElementById("mortgage_rate").value);
    let savings_interest_rate = parseFloat(document.getElementById("savings_rate").value);
    let house_price_inflation = parseFloat(document.getElementById("house_price_inflation").value);
    let monthly_mortgage_rate = mortgage_interest_rate / 1200;
    let monthly_savings_rate = savings_interest_rate / 1200;
    let house_price_growth_factor = 1 + (house_price_inflation / 1200); // Simple monthly multiplier
    let min_deposit_percentage = parseFloat(document.getElementById("min_deposit").value);
    let monthly_savings =  parseFloat(document.getElementById("monthly_savings").value);
    let monthly_contribution_growth_factor = parseFloat(document.getElementById("monthly_contribution_growth").value);
    monthly_contribution_growth_factor = 1 + (monthly_contribution_growth_factor / 100);
    let rent = parseFloat(document.getElementById("rent").value);
    let rent_inflation_factor = parseFloat(document.getElementById("rent_inflation").value);
    rent_inflation_factor = 1 + (rent_inflation_factor / 100);
    let max_mortgage_length = parseFloat(document.getElementById("max_mortgage_length").value);
    max_mortgage_length *= 12; // Convert to months
    let max_simulation_length = parseFloat(document.getElementById("max_simulation_length").value);

    let scenario_1 =  document.getElementById('scenario_1');
    let scenario_2 =  document.getElementById('scenario_2');
    let scenario_3 =  document.getElementById('scenario_3');

    if (current_savings >= house_price + tax_amount) {
        scenario_1.innerHTML = "You can already afford the house you want! Congratulations!"
        scenario_2.innerHTML = "";
        scenario_3.innerHTML = "";
        return
    }

    let loss_to_rent = rent;
    let dates = []
    let total_costs = new Map()
    let min_cost = Number.MAX_VALUE;
    let min_deposit_simulation;
    let min_cost_simulation;
    let buy_outright_date;
    let buy_outright_price;

    let oldest_possible_date = birth_date.plus({years: max_simulation_length});

    let stop_condition_found = false;
    let month_index = 1;
    let total_monthly_savings = monthly_savings;

    while ( ! stop_condition_found) {
        let simulation = new MortgageSimulation(
            month_index,
            retirement_date,
            house_price,
            tax_amount,
            monthly_mortgage_rate,
            monthly_savings_rate,
            current_savings,
            //The compound interest formula uses a single average value across all contributions
            total_monthly_savings / month_index,
            max_mortgage_length
        )

        if (typeof min_deposit_simulation == 'undefined' && simulation.deposit_percentage >= min_deposit_percentage) {
            min_deposit_simulation = simulation;
        }

        dates.push(simulation.date.toLocaleString(DATE_MED));
        let total_cost = simulation.total_interest + loss_to_rent + tax_amount + house_price;
        total_costs.set(simulation.date, total_cost.toFixed(0));

        // We only start checkin what is the minimum cost after checking whether we've met the minimum deposit already
        if (typeof min_deposit_simulation != 'undefined' && total_cost < min_cost) {
            min_cost = total_cost;
            min_cost_simulation = simulation;
        }

        if (simulation.savings < house_price + tax_amount) {
            loss_to_rent += rent;
        }
        else {
            buy_outright_date = simulation.date;
            buy_outright_price = house_price;
            // We have enough savings to buy a house, can stop
            stop_condition_found = true;
        }

        if (simulation.date >= oldest_possible_date) {
            // We're likely dead now...
            stop_condition_found = true;
        }

        // Update house price
        house_price *= house_price_growth_factor;

        if ( ! custom_tax) {
            // The tax amount will grow with the growth of the house price
            // Note we use the principal amount for the previous month, this is because get_tax_amount has a circular
            // dependency...
            tax_amount = get_tax_amount(tax_region, house_price, simulation.principal_amount, new_build, first_home);
        }

        month_index++;

        // Rent and salary only increases yearly
        if (month_index % 12 === 0) {
            rent = Math.round(rent * rent_inflation_factor);
            // We assume that as salaries improve, users can potentially increase their monthly contributions
            monthly_savings = Math.round(monthly_savings * monthly_contribution_growth_factor);
        }

        total_monthly_savings += monthly_savings;
    }

    let currency = document.getElementById("currency").value;
    //buildTable(simulations, total_costs, currency);

    let can_get_mortgage = typeof min_deposit_simulation != 'undefined'
        && min_deposit_simulation.date < retirement_date;
    
    scenario_1.innerHTML = "<b>Time to min. deposit mortgage</b><br>";

    if (can_get_mortgage) {
        if (min_deposit_simulation.date <= total_costs.keys().next().value) {
            scenario_1.innerHTML +=
                "You have enough to get a mortgage already.<br>This will be ";
        }
        else {
            scenario_1.innerHTML +=
                "You will be able to afford the minimum deposit ";
        }

        scenario_1.innerHTML += "<b>" + min_deposit_simulation.date.toRelative() + "</b>. Details: <br>" +
            min_deposit_simulation.generate_output(currency, total_costs.get(min_deposit_simulation.date));
    }
    else {
        scenario_1.innerHTML +=
            "Will not be able to save enough for the deposit of a mortgage before retirement.<br>" +
            "Most banks do not lend into retirement."
    }

    scenario_2.innerHTML = "<b>Lowest cost scenario</b><br>";

    if (can_get_mortgage) {
        if (min_cost_simulation.date <= min_deposit_simulation.date) {
            scenario_2.innerHTML +=
                "You will save the most by buying a house as soon as you can afford it.<br>" +
                "See the calculations for the minimum deposit.";
        }
        else {
            scenario_2.innerHTML +=
                "You will save the most by waiting a bit before buying a house, which will be " +
                " <b>" + min_cost_simulation.date.toRelative()+ "</b>. Details:<br>" +
                min_cost_simulation.generate_output(currency, total_costs.get(this.date));
        }
    }
    else {
        scenario_2.innerHTML = ""; // This is covered by the min deposit scenario.
    }

    if (typeof buy_outright_date != 'undefined') {
        let rent_paid = Math.round(buy_outright_date.diff(DateTime.now(), 'months').months) * rent;

        if ( ! custom_tax) {
            tax_amount = Math.round(get_tax_amount(tax_region, buy_outright_price, 0, new_build, first_home));
        }

        scenario_3.innerHTML = "<b>Buying outright</b><br>" +
            "You'll be able to buy a house just by saving (i.e. no mortgage) on " +
            buy_outright_date.toLocaleString(DATE_MED) + " which is <b>" +
            buy_outright_date.toRelative() + "</b>.<br>You will be " +
            Math.round(buy_outright_date.diff(birth_date, 'years').years) +
            " years old and have spent " + NUMBER_FORMAT.format(rent_paid) + currency +
            " on rent and " + NUMBER_FORMAT.format(tax_amount) + currency + " on taxes. <br>" +
            "By then, the house will be valued at " +
            NUMBER_FORMAT.format(Math.round(buy_outright_price)) + currency + ", and you'll therefore spend " +
            NUMBER_FORMAT.format(Math.round(buy_outright_price + tax_amount + rent_paid)) + currency + " in total.";
    }
    else {
        scenario_3.innerHTML =  "<b>Buying outright</b><br>" +
            "Your savings per month are not enough to pay outright " +
            " before you are " + Math.round(max_simulation_length) +" years old.<br>You will have spent " +
            NUMBER_FORMAT.format(Math.round(loss_to_rent)) + currency +
            " on rent, and by then the house will be valued at " +
            NUMBER_FORMAT.format(Math.round(house_price)) + currency + ".";
    }

    chart.data.labels = [];
    chart.data.datasets.forEach((dataset) => {
        dataset.data = [];
    });

    chart.data.labels = dates;
    chart.data.datasets[0].data = Array.from(total_costs.values());
    chart.update();
}

/**
 * Calculates the monthly payment amount on a mortgage. Assumes payments are monthly and paid at the end of the month.
 *
 * @param interest_rate Monthly interest rate
 * @param n_months Number of months for the mortgage duration
 * @param loan_value The total amount to be loaned
 * @returns {number}
 */
function payment(interest_rate, n_months, loan_value) {
    if (Math.abs(interest_rate) <= 0.000001) {
        // Avoids division by 0 and subnormal values
        return loan_value/n_months;
    }

    let interest_factor = Math.pow(1 + interest_rate, n_months);
    return interest_rate * (loan_value * interest_factor) / (interest_factor - 1);
}

/**
 * Calculates the cumulative interested paid over the total duration of a mortgage.
 *
 * @param interest_rate Monthly interest rate
 * @param n_months Number of months for the mortgage duration
 * @param loan_value The total amount to be loaned
 * @param monthly_payment The monthly payments (calculate with payment())
 * @returns {number}
 */
function total_mortgage_interest(interest_rate, n_months, loan_value, monthly_payment) {
    if (Math.abs(interest_rate) <= 0.000001) {
        // The compound interest formula would cause a division by 0 otherwise
        // Subnormal values would also give incorrect results (decreasing savings).
        return 0;
    }

    let total_interest = loan_value;

    for (let month = 2; month <= n_months; month++) {
        let term = Math.pow(1 + interest_rate, month - 1);
        total_interest += loan_value * term - monthly_payment * (term - 1) / interest_rate;
    }

    return total_interest * interest_rate;
}

/**
 * Calculates the savings growth for a given starting value that also has monthly contributions (i.e. calculates the
 * total earned through a compound interest savings account).
 * This is based on the geometric derivation in the Wikipedia article on compound interest.
 *
 * @param starting_value The initial value in the savings/investment account.
 * @param interest The monthly interest.
 * @param n_months The number of mounts we'll calculate for.
 * @param monthly_contribution The monthly contribution to the account.
 * @returns {number}
 */
function compound_interest(starting_value, interest, n_months, monthly_contribution = 0) {
    if (Math.abs(interest) <= 0.000001) {
        // The compound interest formula would cause a division by 0 otherwise
        // Subnormal values would also give incorrect results (decreasing savings).
        return starting_value + (n_months * monthly_contribution)
    }

    let T1 = ((1 + interest) ** n_months) - 1;
    let T2 = starting_value * ((1 + interest) ** n_months);
    return monthly_contribution * (T1 / interest) + T2;
}

/**
 * Represents the calculation result for a given month in the time series.
 */
class MortgageSimulation {
    date;
    end_date;
    house_price;
    savings;
    deposit;
    deposit_percentage;
    monthly_payment;
    total_interest;
    duration;
    principal_amount;

    /**
     * Simulates a mortgage taken on X months into the future.
     *
     * @param months The number of months between today and this calculation
     * @param retirement_date The date for the retirement
     * @param house_price The target house price
     * @param tax_amount The amount of tax and fees needed to pay for the target house price
     * @param monthly_mortgage_rate The monthly interest rate on the mortgage (monthly rate = annual % / 1200)
     * @param monthly_savings_rate The monthly interest rate on your savings and investments (monthly rate = annual % / 1200)
     * @param starting_savings The current savings as of today
     * @param monthly_savings The monthly amount you can save
     * @param max_duration Maximum length the bank will give a mortgage for
     */
    constructor(months, retirement_date, house_price, tax_amount,
                monthly_mortgage_rate, monthly_savings_rate,
                starting_savings, monthly_savings, max_duration) {
        this.date = DateTime.now().plus({months: months});
        this.house_price = house_price;

        this.savings = compound_interest(starting_savings, monthly_savings_rate, months, monthly_savings);

        this.deposit = this.savings - tax_amount;

        this.duration = Math.min(max_duration, retirement_date.diff(this.date, 'months').months);

        this.end_date = this.date.plus({months: this.duration});

        if (this.savings >= house_price + tax_amount || this.duration <= 0) {
            this.principal_amount = 0;
            this.deposit_percentage = -1;
            this.duration = 0;
            this.monthly_payment = 0;
            this.total_interest = 0;
        }
        else {
            this.principal_amount = this.principal_amount = house_price - this.deposit;

            this.deposit_percentage = (this.deposit / house_price) * 100;

            this.monthly_payment = payment(monthly_mortgage_rate,
                this.duration,
                this.principal_amount
            );

            this.total_interest = total_mortgage_interest(monthly_mortgage_rate,
                this.duration,
                this.principal_amount,
                this.monthly_payment
            );
        }
    }

    generate_output(currency, total_cost) {
        let output = "<ul>";

        let add_line = (title, value) => {
            output += '<li>' + title + " - " + value + "</li>";
        }

        add_line('Date', this.date.toLocaleString(DATE_MED));
        add_line('Deposit', this.deposit_percentage.toFixed(2)  + '% ('
        + (this.deposit.toFixed(2)  + currency + ')'));
        add_line('Monthly payment', NUMBER_FORMAT.format(Math.round(this.monthly_payment)) + currency);
        add_line('Duration', NUMBER_FORMAT.format((this.duration/ 12).toFixed(1)) + ' years');
        add_line('End date', this.end_date.toLocaleString(DATE_MED))
        add_line('Total cost',NUMBER_FORMAT.format(total_cost) + currency);
        add_line('House will be valued at', NUMBER_FORMAT.format(Math.round(this.house_price)) + currency);

        return output + '</ul>';
    }
}