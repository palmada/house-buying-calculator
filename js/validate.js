/* © Copyright 2024, Pedro Almada
Licensed under the GPL-3.0-or-later

This file is part of the House buying calculator and is distributed WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with the house buying calculator software.
If not, see <https://www.gnu.org/licenses/>.
*/


/**
 * Validates the input boxes, setting a default value if they are not correct.
 *
 * @param id The ID of the input to validate as this only validates one element at a time.
 * @param defaultValue The default value to set if validation fails.
 * @param min If we're validating a number, the minimum value it should be set to.
 * @param max If we're validating a number, the maximum value it should be set to.
 */
function validate(id, defaultValue = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
    let element = document.getElementById(id);
    switch(id) {
        case 'birth_date':
            if (DateTime.fromISO(element.value) >= DateTime.now()) {
                element.value = defaultValue;
            }
            break;
        case 'taxes':
            break;
        default:
            if (element.value < min) {
                element.value = defaultValue;
            }
            else if (element.value > max) {
                element.value = defaultValue;
            }
    }
}