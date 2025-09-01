-- Add discountPrice column to Product
ALTER TABLE "Product" ADD COLUMN "discountPrice" DECIMAL(10,2);

-- Optional: backfill discountPrice as NULL (default) - existing rows unaffected
-- You can later update rows to set discountPrice < price to mark them as discounted.