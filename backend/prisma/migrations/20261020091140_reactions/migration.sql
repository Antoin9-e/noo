-- CreateTable
CREATE TABLE "ActivityReaction" (
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityReaction_pkey" PRIMARY KEY ("activityId","userId")
);

-- AddForeignKey
ALTER TABLE "ActivityReaction" ADD CONSTRAINT "ActivityReaction_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
