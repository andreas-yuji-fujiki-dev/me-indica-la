-- CreateTable
CREATE TABLE "FavoriteCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FavoriteCategory_userId_idx" ON "FavoriteCategory"("userId");

-- CreateIndex
CREATE INDEX "FavoriteCategory_categoryId_idx" ON "FavoriteCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteCategory_userId_categoryId_key" ON "FavoriteCategory"("userId", "categoryId");

-- AddForeignKey
ALTER TABLE "FavoriteCategory" ADD CONSTRAINT "FavoriteCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteCategory" ADD CONSTRAINT "FavoriteCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
