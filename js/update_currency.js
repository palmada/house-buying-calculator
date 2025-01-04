/* © Copyright 2024-2025, Pedro Almada
Licensed under the GPL-3.0-or-later

This file is part of the House buying calculator and is distributed WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with the house buying calculator software.
If not, see <https://www.gnu.org/licenses/>.
*/


/**
 * List of currency symbols extracted from UTF-8
 *
 * @type {string[]}
 */
const CURRENCIES = [
    '€',
    '£',
    '$',
    '¢',
    '¤',
    '¥',
    '֏',
    '؋',
    '߾',
    '߿',
    '৲',
    '৳',
    '৻',
    '૱',
    '௹',
    '฿',
    '៛',
    '₠',
    '₡',
    '₢',
    '₣',
    '₤',
    '₥',
    '₦',
    '₧',
    '₨',
    '₩',
    '₪',
    '₫',
    '₭',
    '₮',
    '₯',
    '₰',
    '₱',
    '₲',
    '₳',
    '₴',
    '₵',
    '₶',
    '₷',
    '₸',
    '₹',
    '₺',
    '₻',
    '₼',
    '₽',
    '₾',
    '₿',
    '⃀',
    '꠸',
    '﷼',
    '﹩',
    '＄',
    '￠',
    '￡',
    '￥',
    '￦'
];

/**
 * Updates the currency symbols in the inputs section.
 */
function updateCurrency() {
    let currency = document.getElementById("currency").value;
    const currencyElements = document.querySelectorAll('.currency-symbol');

    currencyElements.forEach(element => {
        element.innerHTML = currency
    });
}