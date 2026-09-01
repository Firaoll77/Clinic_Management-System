-- AlterTable
ALTER TABLE "encounters" ADD COLUMN     "nurse_id" TEXT;

-- CreateIndex
CREATE INDEX "encounters_nurse_id_idx" ON "encounters"("nurse_id");
