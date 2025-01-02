/* © Copyright 2024, Pedro Almada
Licensed under the GPL-3.0-or-later

This file is part of the House buying calculator and is distributed WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with the house buying calculator software.
If not, see <https://www.gnu.org/licenses/>.
*/

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
    appendParameter('mortgage_rate');
    appendParameter('savings_rate');
    appendParameter('min_deposit');
    appendParameter('rent');
    appendParameter('birth_date');
    appendParameter('retirement_age');
    appendParameter('max_mortgage_length');
    appendParameter('taxes');
    appendParameter('custom_tax_amount');

    return window.location.href.split("?")[0] + "?" + parameters.toString()
}

