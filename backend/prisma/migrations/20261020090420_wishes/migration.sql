-- CreateEnum
CREATE TYPE "WishCategory" AS ENUM ('MOVIE', 'SERIES', 'RESTAURANT', 'OUTING', 'TRIP', 'GIFT', 'OTHER');

-- CreateEnum
CREATE TYPE "WishStatus" AS ENUM ('OPEN', 'DONE');

-- CreateEnum
CREATE TYPE "Vote" AS ENUM ('YES', 'NO');

-- CreateTable
CREATE TABLE "Wish" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "category" "WishCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "url" TEXT,
    "imageUrl" TEXT,
    "externalId" TEXT,
    "year" INTEGER,
    "forUserId" TEXT,
    "status" "WishStatus" NOT NULL DEFAULT 'OPEN',
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishVote" (
    "wishId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vote" "Vote",
    "rating" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishVote_pkey" PRIMARY KEY ("wishId","userId")
);

-- CreateIndex
CREATE INDEX "Wish_familyId_category_status_idx" ON "Wish"("familyId", "category", "status");

-- AddForeignKey
ALTER TABLE "Wish" ADD CONSTRAINT "Wish_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishVote" ADD CONSTRAINT "WishVote_wishId_fkey" FOREIGN KEY ("wishId") REFERENCES "Wish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishVote" ADD CONSTRAINT "WishVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
