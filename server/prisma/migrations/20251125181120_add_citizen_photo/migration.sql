/*
  Warnings:

  - You are about to drop the column `rejectionReason` on the `Report` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Report" DROP COLUMN "rejectionReason",
ADD COLUMN     "assignedToId" INTEGER,
ADD COLUMN     "rejectedReason" TEXT;

-- CreateTable
CREATE TABLE "CitizenPhoto" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "CitizenPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CitizenPhoto_userId_key" ON "CitizenPhoto"("userId");

-- AddForeignKey
ALTER TABLE "CitizenPhoto" ADD CONSTRAINT "CitizenPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
