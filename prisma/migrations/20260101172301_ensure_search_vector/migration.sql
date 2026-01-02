-- Ensure search_vector column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE "product" ADD COLUMN "search_vector" tsvector;
  END IF;
END $$;

-- Fix the trigger function to use correct column name
CREATE OR REPLACE FUNCTION product_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.brand_name, '')), 'C') ||
    setweight(
      to_tsvector(
        'spanish',
        coalesce((SELECT name FROM brand WHERE id = NEW.brand_id), '')
      ),
      'C'
    ) ||
    setweight(
      to_tsvector(
        'spanish',
        coalesce((SELECT name FROM category WHERE id = NEW.category_id), '')
      ),
      'C'
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger if it doesn't exist
DROP TRIGGER IF EXISTS product_search_vector_tgr ON "product";
CREATE TRIGGER product_search_vector_tgr
BEFORE INSERT OR UPDATE ON "product"
FOR EACH ROW EXECUTE FUNCTION product_search_vector_update();

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS "product_search_idx" ON "product" USING GIN ("search_vector");

-- Update existing rows to populate search_vector
UPDATE "product" SET "updated_at" = "updated_at" WHERE 1=1;
