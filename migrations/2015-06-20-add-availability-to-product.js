/* global db, print */
/**
 * Migration script to add availability=100 (the default value)
 * to all existing products
 */
db.products.find().forEach(function(product) {
    'use strict';

    try {
        db.products.update(
            {_id: product._id},
            {
                $set: {
                    availability: 100 // 100 is the value for "available"
                }
            }
        );
    }
    catch (e) {
        print(e);
    }
});
