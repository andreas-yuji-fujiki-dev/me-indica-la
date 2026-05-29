-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "Provider" ADD COLUMN "customCategory" TEXT;
ALTER TABLE "Provider" ADD COLUMN "customServiceNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON UPDATE CASCADE ON DELETE SET NULL;
