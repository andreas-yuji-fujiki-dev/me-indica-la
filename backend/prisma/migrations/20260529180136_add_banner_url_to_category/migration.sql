/*
  Warnings:

  - You are about to alter the column `rating` on the `Review` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Made the column `description` on table `Provider` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `Provider` required. This step will fail if there are existing NULL values in that column.
  - Made the column `logoUrl` on table `Provider` required. This step will fail if there are existing NULL values in that column.
  - Made the column `businessHours` on table `Provider` required. This step will fail if there are existing NULL values in that column.
  - Made the column `whatsappBusiness` on table `Provider` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "bannerUrl" TEXT;

-- AlterTable
ALTER TABLE "Provider" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "logoUrl" SET NOT NULL,
ALTER COLUMN "businessHours" SET NOT NULL,
ALTER COLUMN "whatsappBusiness" SET NOT NULL,
ALTER COLUMN "customServiceNames" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "rating" SET DATA TYPE INTEGER;
