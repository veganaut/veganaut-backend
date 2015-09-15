/* global db, print */
/**
 * Migration script to add ratings (rank, count, total) to the products.
 * The ratings are created from the RateOptionsMissions.
 */

db.products.find().forEach(function(product) {
    'use strict';
    if (typeof product.ratings === 'undefined') {
        var ratings = {
            rank: 0,
            count: 0,
            total: 0
        };
        db.missions.find({
            __t: 'RateOptionsMission',
            location: product.location
        }).forEach(function(mission) {
            mission.outcome.forEach(function(outcome) {
                if (product._id.equals(outcome.product)) {
                    ratings.count += 1;
                    ratings.total += outcome.info;
                }
            });
        });

        if (ratings.count > 0) {
            ratings.rank = (ratings.total + 3 * 2) / (ratings.count + 2);
        }

        try {
            db.products.update(
                {_id: product._id},
                {$set: {ratings: ratings}}
            );
        }
        catch (e) {
            print(e);
        }
    }
});
