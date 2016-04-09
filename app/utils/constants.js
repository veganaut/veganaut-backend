/**
 * Defining various constants configuring Veganaut
 */

'use strict';

var _ = require('lodash');
var constants = {};

/**
 * List of possible account types
 * @type {{PLAYER: string, NPC: string}}
 */
constants.ACCOUNT_TYPES = {
    PLAYER: 'player',
    NPC: 'npc'
};

/**
 * List of tags that can be given to locations
 * The prefixes stand for:
 *   - g: gastronomy
 *   - rf: retail food
 *   - rn: retail non-food
 * @type {string[]}
 */
constants.LOCATION_TAGS = [
    'gBreakfast',
    'gLunch',
    'gDinner',
    'gBrunch',
    'gSweets',
    'gSnacks',
    'gMilk',
    'rfDairy',
    'rfBread',
    'rfSweets',
    'rfMeat',
    'rfCheese',
    'rfSupplements',
    'rnClothes',
    'rnShoes',
    'rnHygiene',
    'rnCleaning',
    'rnBooks',
    'rnPets'
];

// TODO: should all this availability stuff be here?
/**
 * List of product availability string
 * @type {string[]}
 */
constants.PRODUCT_AVAILABILITY_STRINGS = ['unavailable', 'temporarilyUnavailable', 'available'];

/**
 * List of product availability values
 * @type {number[]}
 */
constants.PRODUCT_AVAILABILITY_VALUES = [0, 50, 100];

/**
 * Mapping of product availability text to their numerical representation
 * @type {{}}
 */
constants.PRODUCT_AVAILABILITIES_STRING_TO_VALUE = _.zipObject(
    constants.PRODUCT_AVAILABILITY_STRINGS,
    constants.PRODUCT_AVAILABILITY_VALUES
);

/**
 * Mapping of product availability values to their textual representation
 * @type {{}}
 */
constants.PRODUCT_AVAILABILITIES_VALUE_TO_STRING = _.zipObject(
    constants.PRODUCT_AVAILABILITY_VALUES,
    constants.PRODUCT_AVAILABILITY_STRINGS
);

module.exports = constants;
