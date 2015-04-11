/**
 * Defining various constants configuring Veganaut
 */

'use strict';

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

/**
 * List of all possible team names
 * @type {string[]}
 */
constants.ALL_TEAMS = constants.PLAYER_TEAMS.slice(); // Create a copy of the player teams
constants.ALL_TEAMS.push(constants.NPC_TEAM);

module.exports = constants;
