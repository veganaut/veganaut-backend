/* global db */
/**
 * Migrations script to remove all social graph related collections.
 */
db.activities.drop();
db.activitylinks.drop();
db.graphnodes.drop();
