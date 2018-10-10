-- Create types and tables (generated by Sequelize)
CREATE TYPE "public"."enum_locations_existence" AS ENUM('existing', 'closedDown', 'wronglyEntered');
CREATE TYPE "public"."enum_locations_productListComplete" AS ENUM('complete', 'incompleteGoodSummary', 'incomplete');
CREATE TYPE "public"."enum_locations_type" AS ENUM('gastronomy', 'retail');
CREATE TYPE "public"."enum_people_accountType" AS ENUM('player', 'npc');
CREATE TYPE "public"."enum_people_locale" AS ENUM('en', 'de', 'fr');
CREATE TYPE "public"."enum_products_availability" AS ENUM('unknown', 'always', 'sometimes', 'not');
CREATE TYPE "public"."enum_tasks_type" AS ENUM('AddLocation', 'AddProduct', 'SetLocationName', 'SetLocationType', 'SetLocationDescription', 'SetLocationCoordinates', 'SetLocationWebsite', 'SetLocationProductListComplete', 'SetLocationExistence', 'SetProductName', 'SetProductAvailability', 'HowWellDoYouKnowThisLocation', 'RateLocationQuality', 'TagLocation', 'RateProduct', 'HaveYouBeenHereRecently', 'GiveFeedback', 'MentionVegan', 'BuyProduct', 'LegacyEffortValueTask', 'LegacyHasOptionsTask', 'LegacyWantVeganTask');

CREATE TABLE "locations" ("id"   SERIAL , "name" VARCHAR(255) NOT NULL, "description" TEXT, "type" "public"."enum_locations_type" NOT NULL, "coordinates" GEOMETRY(POINT) NOT NULL, "website" VARCHAR(255), "addressStreet" VARCHAR(255), "addressHouse" VARCHAR(255), "addressPostcode" VARCHAR(255), "addressCity" VARCHAR(255), "addressCountry" VARCHAR(255), "osmAddress" JSONB, "productListComplete" "public"."enum_locations_productListComplete", "existence" "public"."enum_locations_existence" NOT NULL DEFAULT 'existing', "tags" JSONB NOT NULL DEFAULT '{}', "qualityTotal" INTEGER NOT NULL DEFAULT 0, "qualityCount" INTEGER NOT NULL DEFAULT 0, "qualityRank" REAL NOT NULL DEFAULT 0, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "deletedAt" TIMESTAMP WITH TIME ZONE, PRIMARY KEY ("id"));
CREATE TABLE "people" ("id"   SERIAL , "nickname" VARCHAR(255) NOT NULL, "fullName" VARCHAR(255), "email" VARCHAR(255) NOT NULL UNIQUE, "password" VARCHAR(255), "resetPasswordToken" VARCHAR(255), "resetPasswordExpires" TIMESTAMP WITH TIME ZONE, "locale" "public"."enum_people_locale" NOT NULL DEFAULT 'en', "accountType" "public"."enum_people_accountType" NOT NULL DEFAULT 'player', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, UNIQUE ("email"), PRIMARY KEY ("id"));
CREATE TABLE "products" ("id"   SERIAL , "name" VARCHAR(255) NOT NULL, "availability" "public"."enum_products_availability" NOT NULL DEFAULT 'unknown', "isAvailable" BOOLEAN NOT NULL DEFAULT true, "locationId" INTEGER NOT NULL REFERENCES "locations" ("id") ON DELETE CASCADE ON UPDATE CASCADE, "ratingTotal" INTEGER NOT NULL DEFAULT 0, "ratingCount" INTEGER NOT NULL DEFAULT 0, "ratingRank" REAL NOT NULL DEFAULT 0, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));
CREATE TABLE "sessions" ("sid" VARCHAR(40) , "userAgent" VARCHAR(255), "activeAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" INTEGER NOT NULL REFERENCES "people" ("id") ON DELETE NO ACTION ON UPDATE CASCADE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("sid"));
CREATE TABLE "tasks" ("id"   SERIAL , "type" "public"."enum_tasks_type" NOT NULL, "skipped" BOOLEAN NOT NULL DEFAULT false, "byNpc" BOOLEAN NOT NULL DEFAULT false, "flow" UUID, "flowPosition" INTEGER, "personId" INTEGER NOT NULL REFERENCES "people" ("id") ON DELETE CASCADE ON UPDATE CASCADE, "outcome" JSONB NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "locationId" INTEGER REFERENCES "locations" ("id") ON DELETE SET NULL ON UPDATE CASCADE, "productId" INTEGER REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE, "triggeredById" INTEGER REFERENCES "tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE, "confirmingId" INTEGER REFERENCES "tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE, PRIMARY KEY ("id"));


-- Set the id sequences to something high to not start at 1

SELECT setval('locations_id_seq', 10000000); -- Needs to be that high because of the converted ids from MongoDB that come up to 9mio
SELECT setval('people_id_seq', 100000);
SELECT setval('products_id_seq', 100000);
SELECT setval('tasks_id_seq', 100000);


-- Add locations searchVector

ALTER TABLE "locations" ADD COLUMN "searchVector" TSVECTOR;

UPDATE "locations" SET "searchVector" = (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
);

CREATE INDEX location_search_idx ON "locations" USING gin("searchVector");

CREATE FUNCTION location_weighted_search_trigger() RETURNS trigger AS $$
begin
  new."searchVector" :=
     setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
     setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER location_search_vector_update BEFORE INSERT OR UPDATE ON "locations" FOR EACH ROW
    EXECUTE PROCEDURE location_weighted_search_trigger();