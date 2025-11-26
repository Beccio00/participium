-- AlterTable
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "assignedToId" INTEGER;

-- AddForeignKey
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'Report_assignedToId_fkey'
	) THEN
		ALTER TABLE "Report" ADD CONSTRAINT "Report_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
	END IF;
END
$$;
