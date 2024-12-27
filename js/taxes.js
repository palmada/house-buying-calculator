/* © Copyright 2024, Pedro Almada
Licensed under the GPL-3.0-or-later

This file is part of the House buying calculator and is distributed WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with the house buying calculator software.
If not, see <https://www.gnu.org/licenses/>.
*/

/**
 * Calculates the taxes and fees of buying a house in spain
 * @param house_price The house price
 * @returns The sum of taxes and other estimated fees of purchasing a house
 */
function taxes_spain(house_price) {
    return house_price * 0.1 + 1100 + 530 + 300 + 600
}