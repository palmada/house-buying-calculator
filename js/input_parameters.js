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
    let value = default_value

    if (url_params.has(id)) {
        value = url_params.get(id)
    }

    if (value < min || value > max) value = default_value

    document.getElementById(id).value = value
}

