/* global db, print */
/**
 * Due to the removal of the "inflection" dependency, some Average properties
 * are now renamed:
 * Location model: "efforts" -> "effort"
 * Product model:  "ratings" -> "rating"
 */

db.locations.find().forEach(function(location) {
    'use strict';
    try {
        db.locations.update(
            {_id: location._id},
            {
                $set: {effort: location.efforts},
                $unset: {efforts: ''}
            }
        );
    }
    catch (e) {
        print(e);
    }
});

db.products.find().forEach(function(product) {
    'use strict';
    try {
        db.products.update(
            {_id: product._id},
            {
                $set: {rating: product.ratings},
                $unset: {ratings: ''}
            }
        );
    }
    catch (e) {
        print(e);
    }
});
