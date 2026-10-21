-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT,
    "spotifyType" TEXT,
    "spotifyId" TEXT,
    "musicTitle" TEXT,
    "musicArtist" TEXT,
    "musicImage" TEXT,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteReaction" (
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteReaction_pkey" PRIMARY KEY ("noteId","userId")
);

-- CreateIndex
CREATE INDEX "Note_familyId_createdAt_idx" ON "Note"("familyId", "createdAt");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteReaction" ADD CONSTRAINT "NoteReaction_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
