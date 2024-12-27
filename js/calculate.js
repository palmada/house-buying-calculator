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
    let birth_date = document.getElementById("birth_date").value;
    let retirement_age = parseInt(document.getElementById("retirement_age").value);
    let retirement_date = new Date(birth_date);
    retirement_date.setFullYear(retirement_date.getFullYear() + retirement_age);

    document.getElementById("date_retirement").innerHTML = retirement_date.toLocaleDateString("en-GB");

    let today = new Date();

    let months_until_retirement = (retirement_date.getFullYear() - today.getFullYear()) * 12;
    months_until_retirement -= today.getMonth();
    months_until_retirement += retirement_date.getMonth();
    months_until_retirement -= 1;
    if (months_until_retirement <= 0) {
        months_until_retirement = 0
    }

    document.getElementById('months_retirement').innerHTML = months_until_retirement.toString();
}