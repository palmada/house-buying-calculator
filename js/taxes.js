/* © Copyright 2024-2025, Pedro Almada
Licensed under the GPL-3.0-or-later

This file is part of the House buying calculator and is distributed WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with the house buying calculator software.
If not, see <https://www.gnu.org/licenses/>.
*/

// Spanish taxes last updated January 2025
const SPAIN_TAXES = new Map();

/**
 * Describes the taxes application to a given Spanish Autonomous region.
 */
class SpanishRegionalTax {
    /**
     * The identifier for the Spanish Autonomous region
     * @type {string}
     */
    region;
    /**
     * The Impuesto de Actos Jurídicos Documentados, applies to new builds.
     * @type {number}
     */
    ajd;
    /**
     * The Impuesto sobre Transmisiones Patrimoniales y Actos Jurídicos Documentales, applies to resales.
     * @type {number}
     */
    itp;
    /**
     * The Value Added Tax, applies to all purchases.
     * @type {number}
     */
    vat = 0.1;

    constructor(region, ajd, itp, vat = 0.1) {
        this.region = region;
        this.ajd = ajd;
        this.itp = itp;
        this.vat = vat;
    }

    getTax(house_price, new_build) {
        if (new_build) {
            return (house_price * this.ajd)  +  (house_price * this.vat);
        }
        else {
            return house_price * this.itp;
        }
    }

    static RegisterRegion(region, ajd, ipt) {
        SPAIN_TAXES.set(region, new SpanishRegionalTax(region, ajd, ipt));
    }
}

SpanishRegionalTax.RegisterRegion('Andalucía', 0.012, 0.07);
SpanishRegionalTax.RegisterRegion('Aragón', 0.015, 0.08);
SpanishRegionalTax.RegisterRegion('Asturias', 0.012, 0.08);
SpanishRegionalTax.RegisterRegion('Baleares', 0.012, 0.08);
SpanishRegionalTax.RegisterRegion('Canarias', 0.012, 0.065, 0.065);
SpanishRegionalTax.RegisterRegion('Cantabria', 0.015, 0.09);
SpanishRegionalTax.RegisterRegion('Castilla-La Mancha', 0.015, 0.09);
SpanishRegionalTax.RegisterRegion('Castilla y Leon', 0.015, 0.08);
SpanishRegionalTax.RegisterRegion('Catalunya', 0.015, 0.1);
SpanishRegionalTax.RegisterRegion('Ceuta', 0.005, 0.06);
SpanishRegionalTax.RegisterRegion('Madrid', 0.006, 0.06);
SpanishRegionalTax.RegisterRegion('Valencia', 0.015, 0.1);
SpanishRegionalTax.RegisterRegion('Extremadura', 0.015, 0.08);
SpanishRegionalTax.RegisterRegion('Galicia', 0.015, 0.1);
SpanishRegionalTax.RegisterRegion('La Rioja', 0.01, 0.07);
SpanishRegionalTax.RegisterRegion('Melilla', 0.005, 0.06);
SpanishRegionalTax.RegisterRegion('Murcia', 0.02, 0.08);
SpanishRegionalTax.RegisterRegion('Navarre', 0.005, 0.04);
SpanishRegionalTax.RegisterRegion('Euskadi', 0.0, 0.04);

/**
 * List of spanish regions that are keys for SPAIN_TAXES.
 *
 * @type {string[]}
 */
const SPANISH_REGIONS = Array.from(SPAIN_TAXES.keys()).sort();

/**
 * Calculates the taxes and fees of buying a house in spain
 * @param {String} region The region of Spain where we are buying a house. Must match a key in @link SPAIN_TAXES
 * @param {Number} house_price The house price
 * @param {Boolean} new_build Whether this is for a new build or a used home
 * @param {Boolean} mortgage Whether the purchase will be with a mortgage
 * @returns The sum of taxes and other estimated fees of purchasing a house
 */
function taxes_and_fees_spain(region, house_price, new_build, mortgage) {
    // Values from https://www.idealista.com/en/news/financial-advice-in-spain/2024/02/15/7875-the-costs-and-taxes-associated-with-buying-a-home-in-spain
    let notary = house_price * 0.004;
    let land_registry = 600;
    let taxes = SPAIN_TAXES.get(region).getTax(house_price, new_build);

    let taxes_and_fees = notary + land_registry + taxes;

    if (mortgage) {
        let valuation = 450;
        taxes_and_fees += valuation;
    }

    return taxes_and_fees;
}