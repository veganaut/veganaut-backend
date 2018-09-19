'use strict';

module.exports = {
    AddLocation: {
        category: 'special',  // TODO: is the category property even needed?
        mainSubject: 'global',  // otherSubjects are optional (as in depend on what the user did if it has this subject)
        otherSubjects: [
            'location'
        ],
        outcomes: [
            {
                name: 'locationAdded',
                type: 'boolean'
            }
        ],
        importance: 100, // This importance is not used yet as the context for this task only has one possible task
        daysUntilStale: 0,
        requiredFamiliarity: 0,
        triggerExistence: false,
        // Note: this task triggers SetLocationName, SetLocationType and SetLocationCoordinates (done in code)
        changeProperties: []
    },
    AddProduct: {
        category: 'special',
        mainSubject: 'location',
        otherSubjects: [
            'product'
        ],
        outcomes: [
            {
                name: 'productAdded',
                type: 'boolean'
            },
            {
                name: 'name',
                type: 'string'
            }
        ],
        importance: 90,
        daysUntilStale: 0,
        requiredFamiliarity: 0,
        triggerExistence: false,
        // TODO NEXT: Automatically trigger SetProductName and SetProductAvailability
        changeProperties: [
            {
                targetTask: 'SetLocationProductListComplete',
                targetProperty: 'daysUntilStale',
                scope: 'location',
                byOutcome: {
                    productAdded: {
                        true: 0
                    }
                }
            }
        ]
    },
    SetLocationName: {
        category: 'info',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'name',
                type: 'string'
            }
        ],
        importance: 100,
        daysUntilStale: 180,
        requiredFamiliarity: 0,
        triggerExistence: false,
        changeProperties: []
    },
    SetLocationType: {
        category: 'info',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'locationType',
                type: 'selectOne',
                values: [
                    'gastronomy',
                    'retail'
                ]
            }
        ],
        importance: 100,
        daysUntilStale: 180,
        requiredFamiliarity: 0,
        triggerExistence: false,
        changeProperties: []
    },
    SetLocationDescription: {
        category: 'info',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'description',
                type: 'multiline'
            }
        ],
        importance: 90,
        daysUntilStale: 90,
        requiredFamiliarity: 0,
        triggerExistence: false,
        changeProperties: []
    },
    SetLocationCoordinates: {
        category: 'info',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'latitude',
                type: 'number'
            },
            {
                name: 'longitude',
                type: 'number'
            }
        ],
        importance: 100,
        daysUntilStale: 165,
        requiredFamiliarity: 0,
        triggerExistence: false,
        changeProperties: []
    },
    // SetLocationAddress: {
    //     category: 'info',
    //     mainSubject: 'location',
    //     otherSubjects: [],
    //     outcomes: [
    //         {
    //             name: 'address',
    //             type: 'multiline'
    //         }
    //     ],
    //     importance: 70,
    //     daysUntilStale: 165,
    //     requiredFamiliarity: 0,
    //     triggerExistence: false,
    //     changeProperties: []
    // },
    SetLocationWebsite: {
        category: 'info',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'website',
                type: 'url'
            },
            {
                // Whether or not this info exists
                name: 'isAvailable',
                type: 'boolean'
            }
        ],
        importance: 70,
        daysUntilStale: 150,
        requiredFamiliarity: 0,
        triggerExistence: false,
        changeProperties: []
    },
    // SetLocationFacebook: {
    //     category: 'info',
    //     mainSubject: 'location',
    //     otherSubjects: [],
    //     outcomes: [
    //         {
    //             name: 'facebook',
    //             type: 'url'
    //         },
    //         {
    //             // Whether or not this info exists
    //             name: 'isAvailable',
    //             type: 'boolean'
    //         }
    //     ],
    //     importance: 1,
    //     daysUntilStale: 150,
    //     requiredFamiliarity: 0,
    //     changeProperties: []
    // },
    // SetLocationTwitter: {
    //     category: 'info',
    //     mainSubject: 'location',
    //     otherSubjects: [],
    //     outcomes: [
    //         {
    //             name: 'twitter',
    //             type: 'url'
    //         },
    //         {
    //             // Whether or not this info exists
    //             name: 'isAvailable',
    //             type: 'boolean'
    //         }
    //     ],
    //     importance: 1,
    //     daysUntilStale: 150,
    //     requiredFamiliarity: 0,
    //     triggerExistence: false,
    //     changeProperties: []
    // },
    // SetLocationOpeningHours: {
    //     category: 'info',
    //     mainSubject: 'location',
    //     otherSubjects: [],
    //     outcomes: [
    //         {
    //             // TODO: Have structured data??
    //             name: 'openingHours',
    //             type: 'multiline'
    //         }
    //     ],
    //     importance: 30,
    //     daysUntilStale: 90,
    //     requiredFamiliarity: 0,
    //     triggerExistence: false,
    //     changeProperties: []
    // },
    SetLocationProductListComplete: {
        category: 'info',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'completionState',
                type: 'selectOne',
                values: [
                    'complete',
                    'incompleteGoodSummary',
                    'incomplete'
                ]
            }
        ],
        importance: 40,
        daysUntilStale: 90,
        requiredFamiliarity: 1,
        triggerExistence: false,
        changeProperties: [
            {
                targetTask: 'AddProduct',
                targetProperty: 'daysUntilStale',
                scope: 'location',
                byOutcome: {
                    completionState: {
                        complete: 90,
                        incompleteGoodSummary: 90,
                        incomplete: 0 // Resetting it to the default
                    }
                }
            },
            {
                targetTask: 'SetLocationProductListComplete',
                targetProperty: 'daysUntilStale',
                scope: 'location',
                byOutcome: {
                    // This is done because AddProduct changes the daysUntilStale as well
                    completionState: {
                        complete: 90,
                        incompleteGoodSummary: 90,
                        incomplete: 90
                    }
                }
            }
        ]
    },
    // SetLocationCarnistLevel: {
    //     category: 'info',
    //     mainSubject: 'location',
    //     otherSubjects: [],
    //     outcomes: [
    //         {
    //             name: 'carnistLevel',
    //             type: 'selectOne',
    //             values: [
    //                 'vegan',
    //                 'vegetarian',
    //                 'omnivorous'
    //             ]
    //         }
    //     ],
    //     importance: 90,
    //     daysUntilStale: 150,
    //     requiredFamiliarity: 0,
    //     triggerExistence: false,
    //     changeProperties: []
    // },
    // SetLocationLabellingLevel: {
    //     category: 'info',
    //     mainSubject: 'location',
    //     otherSubjects: [],
    //     outcomes: [
    //         {
    //             name: 'labellingLevel',
    //             type: 'selectOne',
    //             values: [
    //                 'all',
    //                 'partially',
    //                 'not'
    //             ]
    //         }
    //     ],
    //     importance: 70,
    //     daysUntilStale: 90,
    //     requiredFamiliarity: 1,
    //     triggerExistence: false,
    //     changeProperties: []
    // },
    // SetLocationPriceLevel: {
    //     category: 'info',
    //     mainSubject: 'location',
    //     otherSubjects: [],
    //     outcomes: [
    //         {
    //             name: 'priceLevel',
    //             type: 'selectOne',
    //             values: [
    //                 'low',
    //                 'medium',
    //                 'high'
    //             ]
    //         }
    //     ],
    //     importance: 30,
    //     daysUntilStale: 135,
    //     requiredFamiliarity: 1,
    //     triggerExistence: false,
    //     changeProperties: []
    // },
    SetLocationExistence: {
        category: 'info',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'existence',
                type: 'selectOne',
                values: [
                    'existing',
                    'closedDown',
                    'wronglyEntered'
                ]
            },
            {
                name: 'notes',
                type: 'multiline'
            }
        ],
        importance: 100,
        daysUntilStale: 165,
        requiredFamiliarity: 1,
        triggerExistence: false,
        changeProperties: []
    },
    SetProductName: {
        category: 'info',
        mainSubject: 'product',
        otherSubjects: [
            'location'
        ],
        outcomes: [
            {
                name: 'name',
                type: 'string'
            }
        ],
        importance: 10, // Note: this task's current value is calculated per product
        daysUntilStale: 180,
        requiredFamiliarity: 1,
        triggerExistence: false,
        changeProperties: []
    },
    SetProductAvailability: {
        category: 'info',
        mainSubject: 'product',
        otherSubjects: [
            'location'
        ],
        outcomes: [
            {
                name: 'availability',
                type: 'selectOne',
                values: [
                    'always',
                    'sometimes',
                    'not'
                ]
            }
        ],
        importance: 30, // Note: this task's current value is calculated per product
        daysUntilStale: 120,
        requiredFamiliarity: 1,
        triggerExistence: false,
        changeProperties: []
    },
    HowWellDoYouKnowThisLocation: {
        category: 'relation',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'knowLocation',
                type: 'selectOne',
                values: [
                    'regular',
                    'fewTimes',
                    'once',
                    'never'
                ]
            }
        ],
        importance: 100,
        daysUntilStale: 1,
        requiredFamiliarity: 0,
        triggerExistence: {
            outcomeToCheck: 'knowLocation',
            triggerWhen: [
                'regular'
            ]
        },
        changeProperties: [
            // TODO: should this not also influence HaveYouBeenHereRecently and vice versa?
            {
                targetTask: 'HowWellDoYouKnowThisLocation',
                targetProperty: 'daysUntilStale',
                scope: 'person',
                byOutcome: {
                    knowLocation: {
                        regular: 90,
                        fewTimes: 90,
                        once: 90,
                        never: 1
                    }
                }
            }
        ]
    },
    // RateLocationStaffVeganKnowledge: {
    //     category: 'opinion',
    //     mainSubject: 'location',
    //     otherSubjects: [],
    //     outcomes: [
    //         {
    //             name: 'staffVeganKnowledge',
    //             type: 'selectOne',
    //             values: [
    //                 'allGood',
    //                 'someHaveSomeKnowledge',
    //                 'theyHaveNoIdea'
    //             ]
    //         }
    //     ],
    //     importance: 50,
    //     daysUntilStale: 90,
    //     requiredFamiliarity: 1,
    //     triggerExistence: false,
    //     changeProperties: []
    // },
    RateLocationQuality: {
        category: 'opinion',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'quality',
                // TODO: How about just a number?
                type: 'selectOne',
                values: [
                    'veryHigh',
                    'high',
                    'medium',
                    'low',
                    'veryLow'
                ]
            }
        ],
        importance: 90,
        daysUntilStale: 90,
        requiredFamiliarity: 1,
        triggerExistence: false,
        changeProperties: []
    },
    TagLocation: {
        category: 'opinion',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'tags',
                type: 'selectMany',
                values: [
                    'all the tags...'
                ]
            }
        ],
        importance: 80,
        daysUntilStale: 90,
        requiredFamiliarity: 1,
        triggerExistence: false,
        changeProperties: []
    },
    RateProduct: {
        category: 'opinion',
        mainSubject: 'product',
        otherSubjects: [
            'location'
        ],
        outcomes: [
            {
                name: 'rating',
                type: 'number'
            }
        ],
        importance: 70, // Note: this task's current value is calculated per product
        daysUntilStale: 90,
        requiredFamiliarity: 1,
        triggerExistence: false,
        changeProperties: []
    },
    HaveYouBeenHereRecently: {
        category: 'relation',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'beenHere',
                type: 'selectOne',
                values: [
                    'yes',
                    'yesRightNow',
                    'no'
                ]
            }
        ],
        importance: 100,
        daysUntilStale: 0,
        requiredFamiliarity: 0,
        triggerExistence: {
            outcomeToCheck: 'beenHere',
            triggerWhen: [
                'yes',
                'yesRightNow'
            ]
        },
        changeProperties: [
            // TODO: should this not also influence HowWellDoYouKnowThisLocation and vice versa?
            {
                targetTask: 'HaveYouBeenHereRecently',
                targetProperty: 'daysUntilStale',
                scope: 'person',
                byOutcome: {
                    beenHere: {
                        yes: 60,
                        yesRightNow: 75,
                        no: 1
                    }
                }
            }
        ]
    },
    GiveFeedback: {
        category: 'veganize',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'commitment',
                type: 'selectOne',
                values: [
                    'yes',
                    'maybe',
                    'no'
                ]
            },
            {
                name: 'notes',
                type: 'multiline'
            }
        ],
        importance: null, // TODO
        daysUntilStale: null, // TODO
        requiredFamiliarity: 0,
        triggerExistence: false, // TODO: trigger loc existence?
        changeProperties: []
    },
    MentionVegan: {
        category: 'veganize',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'commitment',
                type: 'selectOne',
                values: [
                    'yes',
                    'maybe',
                    'no'
                ]
            },
            {
                name: 'notes',
                type: 'multiline'
            }
        ],
        importance: null, // TODO
        daysUntilStale: null, // TODO
        requiredFamiliarity: 0,
        triggerExistence: false, // TODO: trigger loc existence?
        changeProperties: []
    },
    BuyProduct: {
        category: 'veganize',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'commitment',
                type: 'selectOne',
                values: [
                    'yes',
                    'maybe',
                    'no'
                ]
            },
            {
                name: 'notes',
                type: 'multiline'
            }
        ],
        importance: null, // TODO
        daysUntilStale: null, // TODO
        requiredFamiliarity: 0,
        triggerExistence: false, // TODO: trigger loc existence?
        changeProperties: []
    },
    // ExplainVegan: {
    //     category: 'veganize',
    //     mainSubject: 'location',
    //     otherSubjects: [],
    //     outcomes: [
    //         {
    //             name: 'commitment',
    //             type: 'selectOne',
    //             values: [
    //                 'yes',
    //                 'maybe',
    //                 'no'
    //             ]
    //         },
    //         {
    //             name: 'notes',
    //             type: 'multiline'
    //         }
    //     ],
    //     importance: null, // TODO
    //     daysUntilStale: null, // TODO
    //     requiredFamiliarity: 0,
    //     triggerExistence: false, // TODO: trigger loc existence?
    //     changeProperties: []
    // },
    // AskForLabelling: {
    //     category: 'veganize',
    //     mainSubject: 'location',
    //     otherSubjects: [],
    //     outcomes: [
    //         {
    //             name: 'commitment',
    //             type: 'selectOne',
    //             values: [
    //                 'yes',
    //                 'maybe',
    //                 'no'
    //             ]
    //         },
    //         {
    //             name: 'notes',
    //             type: 'multiline'
    //         }
    //     ],
    //     importance: null, // TODO
    //     daysUntilStale: null, // TODO
    //     requiredFamiliarity: 0,
    //     triggerExistence: false, // TODO: trigger loc existence?
    //     changeProperties: []
    // },
    // SuggestProducts: {
    //     category: 'veganize',
    //     mainSubject: 'location',
    //     otherSubjects: [],
    //     outcomes: [
    //         {
    //             name: 'commitment',
    //             type: 'selectOne',
    //             values: [
    //                 'yes',
    //                 'maybe',
    //                 'no'
    //             ]
    //         },
    //         {
    //             name: 'notes',
    //             type: 'multiline'
    //         }
    //     ],
    //     importance: null, // TODO
    //     daysUntilStale: null, // TODO
    //     requiredFamiliarity: 0,
    //     triggerExistence: false, // TODO: trigger loc existence?
    //     changeProperties: []
    // },
    // ReserveExplicitVegan: {
    //     category: 'veganize',
    //     mainSubject: 'location',
    //     otherSubjects: [],
    //     outcomes: [
    //         {
    //             name: 'commitment',
    //             type: 'selectOne',
    //             values: [
    //                 'yes',
    //                 'maybe',
    //                 'no'
    //             ]
    //         },
    //         {
    //             name: 'notes',
    //             type: 'multiline'
    //         }
    //     ],
    //     importance: null, // TODO
    //     daysUntilStale: null, // TODO
    //     requiredFamiliarity: 0,
    //     triggerExistence: false, // TODO: trigger loc existence?
    //     changeProperties: []
    // },
    // MarkForFutureVisit: {
    //     category: 'veganize',
    //     mainSubject: 'location',
    //     otherSubjects: [],
    //     outcomes: [
    //         {
    //             name: 'commitment',
    //             type: 'selectOne',
    //             values: [
    //                 'yes',
    //                 'maybe',
    //                 'no'
    //             ]
    //         },
    //         {
    //             name: 'notes',
    //             type: 'multiline'
    //         }
    //     ],
    //     importance: null, // TODO
    //     daysUntilStale: null, // TODO
    //     requiredFamiliarity: 0,
    //     triggerExistence: false, // TODO: trigger loc existence?
    //     changeProperties: []
    // },
    // DeclareVeganizeFocus: {
    //     category: 'veganize',
    //     mainSubject: 'location',
    //     otherSubjects: [],
    //     outcomes: [
    //         {
    //             name: 'commitment',
    //             type: 'selectOne',
    //             values: [
    //                 'yes',
    //                 'maybe',
    //                 'no'
    //             ]
    //         },
    //         {
    //             name: 'notes',
    //             type: 'multiline'
    //         }
    //     ],
    //     importance: null, // TODO
    //     daysUntilStale: null, // TODO
    //     requiredFamiliarity: 0,
    //     triggerExistence: false, // TODO: trigger loc existence?
    //     changeProperties: []
    // }


    // Tasks imported from pre-1.0.0 release, that are currently not used at all (and maybe never will be)
    LegacyEffortValueTask: {
        category: 'veganize',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'effortValue',
                type: 'selectOne',
                values: [
                    'yes',
                    'ratherYes',
                    'ratherNo',
                    'no'
                ]
            }
        ],
        importance: null, // TODO
        daysUntilStale: null, // TODO
        requiredFamiliarity: 0,
        triggerExistence: false, // TODO: trigger loc existence?
        changeProperties: []
    },
    LegacyHasOptionsTask: {
        category: 'veganize',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'hasOptions',
                type: 'selectOne',
                values: [
                    'yes',
                    'ratherYes',
                    'ratherNo',
                    'no',
                    'noClue'
                ]
            }
        ],
        importance: null, // TODO
        daysUntilStale: null, // TODO
        requiredFamiliarity: 0,
        triggerExistence: false, // TODO: trigger loc existence?
        changeProperties: []
    },
    LegacyWantVeganTask: {
        category: 'veganize',
        mainSubject: 'location',
        otherSubjects: [],
        outcomes: [
            {
                name: 'wantVegan',
                type: 'selectMany',
                values: [
                    // object with 'expression' and 'expressionType' (builtin/custom)
                ]
            }
        ],
        importance: null, // TODO
        daysUntilStale: null, // TODO
        requiredFamiliarity: 0,
        triggerExistence: false, // TODO: trigger loc existence?
        changeProperties: []
    }
};

/*
TODO:
new info task: your veg level?
what is your goal?
 */
