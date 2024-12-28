/* © Copyright 2024, Pedro Almada
Licensed under the GPL-3.0-or-later

This file is part of the House buying calculator and is distributed WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with the house buying calculator software.
If not, see <https://www.gnu.org/licenses/>.
*/

/**
 * This is the main calculation function that updates the outputs based on the inputs.
 */
function calculate() {
    let birth_date = moment(document.getElementById("birth_date").value);
    let retirement_age = parseInt(document.getElementById("retirement_age").value);
    let retirement_date = moment(birth_date).add(retirement_age, 'years');

    document.getElementById("date_retirement").innerHTML = retirement_date.format('ll');

    let months_until_retirement = retirement_date.diff(moment(), 'months');

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

    document.getElementById('tax_amount').innerHTML = tax_amount.toString();

    let interest_rate = parseFloat(document.getElementById("interest_rate").value);
    let min_deposit_percentage = parseFloat(document.getElementById("min_deposit").value);
    let monthly_interest_rate = interest_rate / 1200;
    let current_savings = parseFloat(document.getElementById("savings").value);
    let monthly_savings =  parseFloat(document.getElementById("monthly_savings").value);
    let rent = parseFloat(document.getElementById("rent").value);

    let simulations = [];
    let loss_to_rent = rent;
    let dates = []
    let total_costs = []
    let min_cost = Number.MAX_VALUE;
    let min_deposit;
    let min_cost_simulation;

    let oldest_possible_date = new Date(birth_date);
    // We doubt anyone will live past 120 years of age and least of all be looking to buy a house
    oldest_possible_date.setFullYear(oldest_possible_date.getFullYear() + 120);

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
            monthly_savings
        )

        if (typeof min_deposit == 'undefined' && simulation.deposit_percentage >= min_deposit_percentage) {
            min_deposit = simulation;
        }

        simulations.push(simulation);
        dates.push(simulation.date.format('ll'));
        let total_cost = simulation.total_interest_on_mortgage + loss_to_rent + tax_amount;
        total_costs.push(total_cost.toFixed(0));
        if (typeof min_deposit != 'undefined' && total_cost < min_cost) {
            min_cost = total_cost;
            min_cost_simulation = simulation;
        }

        if (simulation.savings < house_price + tax_amount) {
            loss_to_rent += rent;
        }
        else {
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
    buildTable(simulations, total_costs, currency);

    document.getElementById('min_cost').innerHTML = min_cost.toFixed(2);
    document.getElementById('min_cost_date').innerHTML = min_cost_simulation.date.format('ll');
    document.getElementById('min_cost_deposit').innerHTML = min_cost_simulation.deposit_percentage.toFixed(2);

    chart.data.labels = [];
    chart.data.datasets.forEach((dataset) => {
        dataset.data = [];
    });

    chart.data.labels = dates;
    chart.data.datasets[0].data = total_costs;
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

const NUMBER_FORMAT = new Intl.NumberFormat();

function buildTable(simulations, total_costs, currency) {
    let simulationsTable = document.getElementById('simulationsTable');
    simulationsTable.innerHTML = '';
    simulationsTable.innerHTML += TABLE_HEADER;

    for (let s = 0; s < simulations.length; s++) {
        let simulation = simulations[s];
        let total_cost = total_costs[s];

        let row = "<tr>";
        row += "<td>" + simulation.date.format('ll'); + "</td>";
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
    savings;
    deposit;
    deposit_percentage;
    mortgage_payment;
    total_interest_on_mortgage;
    mortgage_duration;
    mortgage_principal_amount;

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
     */
    constructor(months, retirement_date, house_price, tax_amount, monthly_interest_rate,
                starting_savings, monthly_savings) {
        this.date = moment();
        this.date.add(months, 'months');

        this.savings = starting_savings + (months * monthly_savings)

        this.deposit = this.savings - tax_amount;

        this.mortgage_duration = retirement_date.diff(this.date, 'months');

        if (this.savings >= house_price + tax_amount || this.mortgage_duration <= 0) {
            this.mortgage_principal_amount = 0;
            this.deposit_percentage = 100;
            this.mortgage_duration = 0;
            this.mortgage_payment = 0;
            this.total_interest_on_mortgage = 0;
        }
        else {
            this.mortgage_principal_amount = this.mortgage_principal_amount = house_price - this.deposit;

            this.deposit_percentage = (this.deposit / house_price) * 100;

            this.mortgage_payment = payment(monthly_interest_rate,
                this.mortgage_duration,
                this.mortgage_principal_amount
            );

            this.total_interest_on_mortgage = total_mortgage_interest(monthly_interest_rate,
                this.mortgage_duration,
                this.mortgage_principal_amount,
                this.mortgage_payment
            );
        }
    }
}