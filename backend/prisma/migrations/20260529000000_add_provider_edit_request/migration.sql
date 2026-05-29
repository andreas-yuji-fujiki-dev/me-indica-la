-- CreateEnum
CREATE TYPE "ProviderEditRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ProviderEditRequest" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "status" "ProviderEditRequestStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "whatsappBusiness" TEXT,
    "instagram" TEXT,
    "website" TEXT,
    "keywords" TEXT[],
    "categoryId" TEXT,
    "customCategory" TEXT,
    "serviceIds" TEXT[],
    "customServiceNames" TEXT[],
    "address" TEXT,
    "cityId" TEXT,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "galleryImageUrls" TEXT[],
    "businessHours" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ProviderEditRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderEditRequest_providerId_idx" ON "ProviderEditRequest"("providerId");

-- CreateIndex
CREATE INDEX "ProviderEditRequest_status_idx" ON "ProviderEditRequest"("status");

-- AddForeignKey
ALTER TABLE "ProviderEditRequest" ADD CONSTRAINT "ProviderEditRequest_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
