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
 * Calculate the total amount due in a progressive tax calculation.
 *
 * @param {number} taxable_amount
 * @param {TaxBracket[]} brackets Tax brackets, sorted from lowest to highest.
 */
function calculate_progressive_tax(taxable_amount, brackets) {
    let total_tax = 0;
    for (let bracket of brackets) {
        if (taxable_amount > bracket.upper_threshold) {
            total_tax += bracket.total_tax;
        }
        else {
            total_tax += (taxable_amount - bracket.lower_threshold) * bracket.tax_rate;
            return total_tax;
        }
    }

    return total_tax;
}

/**
 * For progressive tax calculations, different brackets of the total to tax will have different tax amounts.
 * This represents the various thresholds for the brackets and allows simple calculation.
 */
class TaxBracket {
    /**
     * The lower threshold for the tax margin; exclusive
     * @type {number}
     */
    lower_threshold;
    /**
     * The upper threshold for the tax margin; inclusive
     * @type {number}
     */
    upper_threshold;
    /**
     * The tax rate for this margin
     * @type {number}
     */
    tax_rate;
    /**
     * The total amount of tax payable on this bracket (i.e. [upper - lower thresholds] * rate)
     * @type {number}
     */
    total_tax;

    /**
     * @param {number} lower_threshold
     * @param {number} upper_threshold
     * @param {number} tax_rate
     */
    constructor(lower_threshold, upper_threshold, tax_rate) {
        this.lower_threshold = lower_threshold;
        this.upper_threshold = upper_threshold;
        this.tax_rate = tax_rate;
        this.total_tax = (upper_threshold - lower_threshold) * tax_rate;
    }
}

/**
 * List of spanish regions that are keys for SPAIN_TAXES.
 *
 * @type {string[]}
 */
const SPANISH_REGIONS = Array.from(SPAIN_TAXES.keys()).sort();

/**
 * List of UK regions that are valid for taxes_and_fees_uk(...).
 *
 * @type {string[]}
 */
const UK_REGIONS = ['England and N.I.', 'Scotland', 'Wales'];

/**
 * Portuguese IMT tax brackets
 * @type {TaxBracket[]}
 */
const PORTUGAL_IMT_BRACKETS = [
    new TaxBracket(0, 101_917, 0),
    new TaxBracket(101_917, 139_412, 0.02),
    new TaxBracket(139_412, 190_086, 0.05),
    new TaxBracket(190_086, 316_772, 0.07),
    new TaxBracket(316_772, 633_453, 0.08),
];

/**
 * England and Northern Ireland Stamp Duty and Land Tax brackets
 * @type {TaxBracket[]}
 */
const ENGLAND_SDLT_BRACKETS = [
    new TaxBracket(0, 125_000, 0),
    new TaxBracket(125_000, 250_001, 0.02),
    new TaxBracket(250_000, 925_001, 0.05),
    new TaxBracket(925_001, 1_500_001, 0.1),
    new TaxBracket(1_500_000, Number.MAX_SAFE_INTEGER, 0.12),
];

/**
 * England and Northern Ireland Stamp Duty and Land Tax brackets for first time buyers
 * @type {TaxBracket[]}
 */
const ENGLAND_SDLT_FIRST_TIME_BUYERS_BRACKETS = [
    new TaxBracket(0, 425_000, 0),
    new TaxBracket(425_000, 625_000, 0.05),
];

/**
 * Scottish Land and Buildings Transaction Tax brackets
 * @type {TaxBracket[]}
 */
const SCOTLAND_LBTT_BRACKETS = [
    new TaxBracket(0, 145_000, 0),
    new TaxBracket(145_000, 250_000, 0.02),
    new TaxBracket(250_000, 325_000, 0.05),
    new TaxBracket(325_000, 750_000, 0.1),
    new TaxBracket(750_000, Number.MAX_SAFE_INTEGER, 0.12),
];

/**
 * Scottish Land and Buildings Transaction Tax brackets for first time buyers
 * @type {TaxBracket[]}
 */
const SCOTLAND_LBTT_FIRST_TIME_BUYERS_BRACKETS = [
    new TaxBracket(0, 175_000, 0),
    new TaxBracket(145_000, 250_000, 0.02),
    new TaxBracket(250_000, 325_000, 0.05),
    new TaxBracket(325_000, 750_000, 0.1),
    new TaxBracket(750_000, Number.MAX_SAFE_INTEGER, 0.12),
];

/**
 * Wales Land Transaction Tax brackets
 * @type {TaxBracket[]}
 */
const WALES_LTT_BRACKETS = [
    new TaxBracket(0, 225_000, 0),
    new TaxBracket(225_000, 400_000, 0.06),
    new TaxBracket(400_000, 750_000, 0.075),
    new TaxBracket(750_000, 1_500_000, 0.1),
    new TaxBracket(1_500_000, Number.MAX_SAFE_INTEGER, 0.12),
];

/**
 * Calculates the taxes and fees of buying a house in Spain.
 *
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

/**
 * Calculates the taxes and fees of buying a house in Portugal.
 * Assumptions are that this is am urban building for primary residence.
 *
 * @param {number} house_price The house price
 * @param {number} mortgage_principal The amount the bank will loan to help buy the house
 * @returns The sum of taxes and other estimated fees of purchasing a house
 */
function taxes_and_fees_portugal(house_price, mortgage_principal) {
    let stamp_duty_deed = house_price * 0.008;
    let stamp_duty_mortgage = mortgage_principal > 0? mortgage_principal * 0.006 : 0 ;
    let imt;

    if (house_price > 1_102_920) {
        imt = house_price * 0.075;
    }
    else if (house_price > 633_453) {
        imt = house_price * 0.06;
    }
    else {
        imt = calculate_progressive_tax(house_price, PORTUGAL_IMT_BRACKETS);
    }

    // IMI - This is a yearly tax so won't consider it part of the purchase.

    return stamp_duty_deed + stamp_duty_mortgage + imt;
}

function taxes_and_fees_uk(region, house_price, first_home, mortgage) {
    let total = 0;

    if (mortgage) {
        /*
        This is hard to estimate, so I've used the following values:
        booking fee: 200
        product fee: 1000
        account fee: 200
        surveyor: 900
        conveyancing fee: 2000
         */
        total += 4300;
    }

    switch (region) {
        case UK_REGIONS[1]:
            if (first_home) {
                return total + calculate_progressive_tax(house_price, SCOTLAND_LBTT_FIRST_TIME_BUYERS_BRACKETS);
            }
            return total + calculate_progressive_tax(house_price, SCOTLAND_LBTT_BRACKETS);
        case UK_REGIONS[2]:
            return total + calculate_progressive_tax(house_price, WALES_LTT_BRACKETS);
        default:
        case UK_REGIONS[0]:
            if (first_home && house_price < 625_000) {
                return total + calculate_progressive_tax(house_price, ENGLAND_SDLT_FIRST_TIME_BUYERS_BRACKETS);
            }
            else return total + calculate_progressive_tax(house_price, ENGLAND_SDLT_BRACKETS);
    }
}