/*
  Warnings:

  - A unique constraint covering the columns `[shopName]` on the table `Vendor` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Vendor_shopName_key" ON "public"."Vendor"("shopName");
