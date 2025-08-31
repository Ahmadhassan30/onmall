/*
  Warnings:

  - You are about to drop the column `documents` on the `KYC` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."DocType" AS ENUM ('CNIC', 'PASSPORT', 'LICENSE');

-- AlterTable
ALTER TABLE "public"."KYC" DROP COLUMN "documents",
ADD COLUMN     "status" TEXT;

-- CreateTable
CREATE TABLE "public"."KYCDocument" (
    "id" TEXT NOT NULL,
    "url" TEXT,
    "documentType" "public"."DocType" NOT NULL,
    "public_id" TEXT NOT NULL,
    "kycId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KYCDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."KYCDocument" ADD CONSTRAINT "KYCDocument_kycId_fkey" FOREIGN KEY ("kycId") REFERENCES "public"."KYC"("id") ON DELETE CASCADE ON UPDATE CASCADE;
