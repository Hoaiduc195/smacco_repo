ALTER TABLE "places"
ADD COLUMN "raw_serpapi_property_details" JSONB,
ADD COLUMN "serpapi_property_details_synced_at" TIMESTAMP(3);
