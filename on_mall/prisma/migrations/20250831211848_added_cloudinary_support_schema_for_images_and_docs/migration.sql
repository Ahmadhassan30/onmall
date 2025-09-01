/*
  Warnings:

  - The `status` column on the `KYC` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `images` on the `Product` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('Pending', 'Approved', 'Rejected');

-- AlterTable
ALTER TABLE "public"."KYC" DROP COLUMN "status",
ADD COLUMN     "status" "public"."Status" NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "images";

-- CreateTable
CREATE TABLE "public"."ProductImg" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductVideo" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVideo_productId_key" ON "public"."ProductVideo"("productId");

-- AddForeignKey
ALTER TABLE "public"."ProductImg" ADD CONSTRAINT "ProductImg_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVideo" ADD CONSTRAINT "ProductVideo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
