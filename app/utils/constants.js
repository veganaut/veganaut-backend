/**
 * Defining various constants configuring Veganaut
 */

'use strict';

var _ = require('lodash');
var constants = {};

/**
 * List of all teams that a normal player can be in
 * @type {string[]}
 */
constants.PLAYER_TEAMS = [
    'team1',
    'team2',
    'team3',
    'team4',
    'team5'
];

/**
 * Team name of the NPC (Non-Player Character) team.
 * @type {string}
 */
constants.NPC_TEAM = 'npc';

// TODO: should all this availability stuff be here?

/**
 * List of all possible team names
 * @type {string[]}
 */
constants.ALL_TEAMS = constants.PLAYER_TEAMS.slice(); // Create a copy of the player teams
constants.ALL_TEAMS.push(constants.NPC_TEAM);

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
