/**
 * Defining various constants configuring Veganaut
 */

'use strict';

var constants = {};

/**
 * List of supported languages
 * Note: when this is modified, then the db has to be updated
 * @type {[string,string,string]}
 */
constants.LANGUAGES = ['en', 'de', 'fr'];

/**
 * Default locale
 * @type {string}
 */
constants.DEFAULT_LANGUAGE = 'en';

/**
 * List of possible account types
 * Note: when this is modified, then the db has to be updated
 * @type {{player: string, npc: string}}
 */
constants.ACCOUNT_TYPES = {
    player: 'player',
    npc: 'npc'
};

/**
 * List of possible location types.
 * @type {string[]}
 */
constants.LOCATION_TYPES = [
    'gastronomy',
    'retail'
];

/**
 * List of all task types
 * TODO NEXT: get rid of this and use taskDefinitions instead
 * @type {{}}
 */
constants.TASK_TYPES = {
    AddLocation: 'AddLocation',
    AddProduct: 'AddProduct',
    SetLocationName: 'SetLocationName',
    SetLocationType: 'SetLocationType',
    SetLocationDescription: 'SetLocationDescription',
    SetLocationCoordinates: 'SetLocationCoordinates',
    // SetLocationAddress: 'SetLocationAddress',
    SetLocationWebsite: 'SetLocationWebsite',
    // SetLocationFacebook: 'SetLocationFacebook',
    // SetLocationTwitter: 'SetLocationTwitter',
    // SetLocationOpeningHours: 'SetLocationOpeningHours',
    SetLocationProductListComplete: 'SetLocationProductListComplete',
    // SetLocationCarnistLevel: 'SetLocationCarnistLevel',
    // SetLocationLabellingLevel: 'SetLocationLabellingLevel',
    // SetLocationPriceLevel: 'SetLocationPriceLevel',
    SetLocationExistence: 'SetLocationExistence',
    SetProductName: 'SetProductName',
    SetProductAvailability: 'SetProductAvailability',
    HowWellDoYouKnowThisLocation: 'HowWellDoYouKnowThisLocation',
    // RateLocationStaffVeganKnowledge: 'RateLocationStaffVeganKnowledge',
    RateLocationQuality: 'RateLocationQuality',
    TagLocation: 'TagLocation',
    RateProduct: 'RateProduct',
    HaveYouBeenHereRecently: 'HaveYouBeenHereRecently',
    GiveFeedback: 'GiveFeedback',
    MentionVegan: 'MentionVegan',
    BuyProduct: 'BuyProduct',
    // ExplainVegan: 'ExplainVegan',
    // AskForLabelling: 'AskForLabelling',
    // SuggestProducts: 'SuggestProducts',
    // ReserveExplicitVegan: 'ReserveExplicitVegan',
    // MarkForFutureVisit: 'MarkForFutureVisit',
    // DeclareVeganizeFocus: 'DeclareVeganizeFocus'

    // Tasks imported from pre-1.0.0 release, that are currently not used at all (and maybe never will be)
    LegacyEffortValueTask: 'LegacyEffortValueTask',
    LegacyHasOptionsTask: 'LegacyHasOptionsTask',
    LegacyWantVeganTask: 'LegacyWantVeganTask'
};

/**
 * List of task types that are no longer active and cannot be created.
 * Only used to keep data from old times around.
 * @type {string[]}
 */
constants.LEGACY_TASK_TYPES = [
    constants.TASK_TYPES.LegacyEffortValueTask,
    constants.TASK_TYPES.LegacyHasOptionsTask,
    constants.TASK_TYPES.LegacyWantVeganTask
];

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

/**
 * List of availabilities a product can have
 * Note: when this is modified, then the db has to be updated
 * @type {{}}
 */
constants.PRODUCT_AVAILABILITIES = {
    unknown: 'unknown',
    always: 'always',
    sometimes: 'sometimes',
    not: 'not'
};

/**
 * List of possible states the product list of a location can have
 * Note: when this is modified, then the db has to be updated
 * @type {{}}
 */
constants.PRODUCT_LIST_STATES = {
    complete: 'complete',
    incompleteGoodSummary: 'incompleteGoodSummary',
    incomplete: 'incomplete'
};


/**
 * List of existence states a location can have
 * Note: when this is modified, then the db has to be updated
 * @type {{}}
 */
constants.LOCATION_EXISTENCE_STATES = {
    existing: 'existing',
    closedDown: 'closedDown',
    wronglyEntered: 'wronglyEntered'
};

module.exports = constants;
