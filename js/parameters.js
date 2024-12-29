/* © Copyright 2024, Pedro Almada
Licensed under the GPL-3.0-or-later

This file is part of the House buying calculator and is distributed WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with the house buying calculator software.
If not, see <https://www.gnu.org/licenses/>.
*/

/**
 * Reads a URL parameter to be used to set the input values in the main form.
 *
 * @param id Element ID whose value will be set
 * @param url_params The URL parameters provided by the user, as found by URLSearchParams
 * @param default_value The default value, if not found
 * @param min The minimum acceptable value
 * @param max The maximum acceptable value
 */
function readParameter(id, url_params, default_value, min = 0, max = Number. MAX_VALUE) {
    let value = default_value;

    if (url_params.has(id)) {
        value = url_params.get(id);
    }

    if (value < min || value > max) value = default_value;

    document.getElementById(id).value = value;
}

function readSelection(id, url_params) {
    let value = 0;

    if (url_params.has(id)) {
        value = url_params.get(id);
    }

    document.getElementById(id).value = value;
}

/**
 * Exports the input values provided by the user as URL parameters.
 *
 * @returns A URL string with the input values stored as URL parameters.
 */
function exportAsURL() {
    let parameters = new URLSearchParams()

    let appendParameter = (id) =>  parameters.append(id, document.getElementById(id).value)

    appendParameter('house_price');
    appendParameter('savings');
    appendParameter('monthly_savings');
    appendParameter('interest_rate');
    appendParameter('min_deposit');
    appendParameter('rent');
    appendParameter('birth_date');
    appendParameter('retirement_age');
    appendParameter('max_mortgage_length');
    appendParameter('taxes');
    appendParameter('custom_tax_amount');

    return window.location.href.split("?")[0] + "?" + parameters.toString()
}

