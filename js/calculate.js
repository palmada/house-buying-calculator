/* © Copyright 2024, Pedro Almada
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
 * This is the main calculation function that updates the outputs based on the inputs.
 */
function calculate() {
    let birth_date = DateTime.fromISO(document.getElementById("birth_date").value);
    let retirement_age = parseInt(document.getElementById("retirement_age").value);
    let retirement_date = birth_date.plus({years: retirement_age});

    document.getElementById("date_retirement").innerHTML = retirement_date.toLocaleString(DATE_MED);

    let months_until_retirement = Math.round(retirement_date.diff(DateTime.now(), 'months').months);

    document.getElementById('months_retirement').innerHTML = months_until_retirement.toString();

    let house_price = parseFloat(document.getElementById("house_price").value);
    let tax_selection = document.getElementById("taxes").selectedIndex;
    let tax_amount;

    switch (tax_selection) {
        case 0:
            tax_amount = taxes_spain(house_price);
            break
        default:
            tax_amount = parseFloat(document.getElementById("custom_tax_amount").value);
            if (tax_amount < 0 || isNaN(tax_amount) ) {
                tax_amount = 0;
            }
    }

    document.getElementById('tax_amount').innerHTML = tax_amount.toFixed(2).toString();

    let interest_rate = parseFloat(document.getElementById("interest_rate").value);
    let min_deposit_percentage = parseFloat(document.getElementById("min_deposit").value);
    let monthly_interest_rate = interest_rate / 1200;
    let current_savings = parseFloat(document.getElementById("savings").value);
    let monthly_savings =  parseFloat(document.getElementById("monthly_savings").value);
    let rent = parseFloat(document.getElementById("rent").value);
    let max_mortgage_length = parseFloat(document.getElementById("max_mortgage_length").value);
    max_mortgage_length *= 12; // Convert to months

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

    // We doubt anyone will live past 120 years of age and least of all be looking to buy a house
    let oldest_possible_date = birth_date.plus({years: 120});

    let stop_condition_found = false;
    let month_index = 1;

    while ( ! stop_condition_found) {

        let simulation = new MortgageSimulation(
            month_index,
            retirement_date,
            house_price,
            tax_amount,
            monthly_interest_rate,
            current_savings,
            monthly_savings,
            max_mortgage_length
        )

        if (typeof min_deposit_simulation == 'undefined' && simulation.deposit_percentage >= min_deposit_percentage) {
            min_deposit_simulation = simulation;
        }

        dates.push(simulation.date.toLocaleString(DATE_MED));
        let total_cost = simulation.total_interest + loss_to_rent + tax_amount;
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
            // We have enough savings to buy a house, can stop
            stop_condition_found = true;
        }

        if (simulation.date >= oldest_possible_date) {
            // We're likely dead now...
            stop_condition_found = true;
        }

        month_index++
    }

    let currency = document.getElementById("currency").value;
    //buildTable(simulations, total_costs, currency);

    let can_get_mortgage = typeof min_deposit_simulation != 'undefined'
        && min_deposit_simulation.date < retirement_date;
    
    scenario_1.innerHTML = "<b>Time to min. deposit mortgage</b><br>";

    if (can_get_mortgage) {
        if (min_deposit_simulation.date <= total_costs.keys().next().value) {
            scenario_1.innerHTML +=
                "You have enough to get a mortgage already.<br>The calculations are for";
        }
        else {
            scenario_1.innerHTML +=
                "You will be able to afford the minimum deposit on";
        }

        scenario_1.innerHTML +=
            " <b>" + min_deposit_simulation.date.toLocaleString(DATE_MED) + "</b><br>" +
            " with a deposit of " + min_deposit_simulation.deposit_percentage.toFixed(2) + "%" +
            " (" + NUMBER_FORMAT.format(Math.round(min_deposit_simulation.deposit)) + currency + "),<br>" +
            " a monthly payment of "
            + NUMBER_FORMAT.format(Math.round(min_deposit_simulation.monthly_payment)) + currency + ",<br>" +
            " over a " + NUMBER_FORMAT.format((min_deposit_simulation.duration/ 12).toFixed(1)) +
            " year term, ending " + min_deposit_simulation.end_date.toLocaleString(DATE_MED) +
            ".<br>" +
            "Your total cost (rent until the date, mortgage interest and taxes) will be " +
            NUMBER_FORMAT.format(total_costs.get(min_deposit_simulation.date)) + currency + "."
    }
    else {
        scenario_1.innerHTML +=
            "Will not be able to save enough for the deposit of a mortgage before retirement.<br>" +
            "Most banks do not lend into retirement."
    }

    scenario_2.innerHTML = "<b>Lowest cost mortgage</b><br>";

    if (min_cost_simulation.principal_amount <= monthly_savings) {
        scenario_2.innerHTML += "You'll be able to save quickly enough that it's best to rent until you buy.";
    }
    else if (can_get_mortgage) {
        if (min_cost_simulation.date <= min_deposit_simulation.date) {
            scenario_2.innerHTML +=
                "You will save the most by buying a house as soon as you can afford it.<br>" +
                "See the calculations for the minimum deposit.";
        }
        else {
            scenario_2.innerHTML +=
                "You will save the most by waiting a bit before buying a house.<br> This will be on" +
                " <b>" + min_cost_simulation.date.toLocaleString(DATE_MED) + "</b><br>" +
                " with a deposit of " + min_cost_simulation.deposit_percentage.toFixed(2) + "%" +
                " (" + NUMBER_FORMAT.format(Math.round(min_cost_simulation.deposit)) + currency + "),<br>" +
                " a monthly payment of "
                + NUMBER_FORMAT.format(Math.round(min_cost_simulation.monthly_payment)) + currency + ",<br>" +
                " over a " + NUMBER_FORMAT.format((min_cost_simulation.duration / 12).toFixed(1)) +
                " year term, ending " + min_cost_simulation.end_date.toLocaleString(DATE_MED) +
                ".<br>" +
                "Your total cost (rent until the date, mortgage interest and taxes) will be " +
                NUMBER_FORMAT.format(total_costs.get(min_cost_simulation.date)) + currency + "."
        }
    }
    else {
        scenario_2.innerHTML = ""; // This is covered by the min deposit scenario.
    }

    if (typeof buy_outright_date != 'undefined'  ) {
        let rent_paid = Math.round(buy_outright_date.diff(DateTime.now(), 'months').months) * rent;
        scenario_3.innerHTML = "<b>Buying outright</b><br>" +
            "You'll be able to buy a house just by saving (i.e. no mortgage) on " +
            buy_outright_date.toLocaleString(DATE_MED) + " which is <b>" +
            buy_outright_date.toRelative() + "</b>.<br>You will be " +
            Math.round(buy_outright_date.diff(birth_date, 'years').years) +
            " years old and have spent " + NUMBER_FORMAT.format(rent_paid + tax_amount) + currency +
            " on rent and taxes. <br>";
    }
    else {
        scenario_3.innerHTML =  "<b>Buying outright</b><br>" +
            "Your savings per month are not enough to pay outright " +
            "for a house of that cost before you are 120 years old. You will have spent " +
            NUMBER_FORMAT.format(Math.round(loss_to_rent)) + currency + " on rent.";
    }

    chart.data.labels = [];
    chart.data.datasets.forEach((dataset) => {
        dataset.data = [];
    });

    chart.data.labels = dates;
    chart.data.datasets[0].data = Array.from(total_costs.values());
    chart.update();
}

const TABLE_HEADER = '<tr>' +
    '<th>Date</th>' +
    '<th>Savings</th>' +
    '<th>Deposit</th>' +
    '<th>Mortgage</th>' +
    '<th>Deposit %</th>' +
    '<th>Monthly payment</th>' +
    '<th>Mortgage length</th>' +
    '<th>Total interest</th>' +
    '<th>Total cost</th>' +
    '</tr>'

function buildTable(simulations, total_costs, currency) {
    let simulationsTable = document.getElementById('simulationsTable');
    simulationsTable.innerHTML = '';
    simulationsTable.innerHTML += TABLE_HEADER;

    for (let s = 0; s < simulations.length; s++) {
        let simulation = simulations[s];
        let total_cost = total_costs[s];

        let row = "<tr>";
        row += "<td>" + simulation.date.toLocaleString(DATE_MED); + "</td>";
        row += "<td>" + NUMBER_FORMAT.format(simulation.savings) + currency + "</td>";
        row += "<td>" + NUMBER_FORMAT.format(simulation.deposit)  + currency + "</td>";
        row += "<td>" + NUMBER_FORMAT.format(simulation.mortgage_principal_amount)  + currency + "</td>";
        row += "<td>" + simulation.deposit_percentage.toFixed(2)   + "%</td>";
        row += "<td>" + NUMBER_FORMAT.format(simulation.mortgage_payment.toFixed(2))  + currency + "</td>";
        row += "<td>" + NUMBER_FORMAT.format((simulation.mortgage_duration / 12).toFixed(1)) + " years</td>";
        row += "<td>" + NUMBER_FORMAT.format(simulation.total_interest_on_mortgage.toFixed(0))  + currency + "</td>";
        row += "<td>" + NUMBER_FORMAT.format(total_cost) + currency + "</td>";
        row += "</tr>";
        simulationsTable.innerHTML += row;
    }
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
    if (interest_rate <= 0) {
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
    if (interest_rate <= 0) {
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
 * Represents the calculation result for a given month in the time series.
 */
class MortgageSimulation {
    date;
    end_date;
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
     * @param monthly_interest_rate The monthly interest rate (annual interest rate / 12, as rate, not percentage)
     * @param starting_savings The current savings as of today
     * @param monthly_savings The monthly amount you can save
     * @param max_duration Maximum length the bank will give a mortgage for
     */
    constructor(months, retirement_date, house_price, tax_amount, monthly_interest_rate,
                starting_savings, monthly_savings, max_duration) {
        this.date = DateTime.now().plus({months: months});

        this.savings = starting_savings + (months * monthly_savings)

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

            this.monthly_payment = payment(monthly_interest_rate,
                this.duration,
                this.principal_amount
            );

            this.total_interest = total_mortgage_interest(monthly_interest_rate,
                this.duration,
                this.principal_amount,
                this.monthly_payment
            );
        }
    }
}