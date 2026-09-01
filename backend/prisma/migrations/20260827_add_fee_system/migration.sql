-- Add FeeType enum
CREATE TYPE "FeeType" AS ENUM ('REGISTRATION', 'TRIAGE', 'NURSE_EXAMINATION', 'DOCTOR_CONSULTATION', 'LAB_TEST', 'PRESCRIPTION', 'PROCEDURE');

-- Add FeeConfiguration model
CREATE TABLE "fee_configurations" (
    "id" TEXT NOT NULL,
    "fee_type" "FeeType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_configurations_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint on fee_type
CREATE UNIQUE INDEX "fee_configurations_fee_type_key" ON "fee_configurations"("fee_type");

-- Add EncounterFee model
CREATE TABLE "encounter_fees" (
    "id" TEXT NOT NULL,
    "encounter_id" TEXT NOT NULL,
    "fee_type" "FeeType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logged_by" TEXT NOT NULL,

    CONSTRAINT "encounter_fees_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint for encounter_id
ALTER TABLE "encounter_fees" ADD CONSTRAINT "encounter_fees_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes for encounter_fees
CREATE INDEX "encounter_fees_encounter_id_idx" ON "encounter_fees"("encounter_id");
CREATE INDEX "encounter_fees_fee_type_idx" ON "encounter_fees"("fee_type");
