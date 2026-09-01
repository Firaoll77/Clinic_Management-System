-- Create LabAssignment table
CREATE TABLE "lab_assignments" (
    "id" TEXT NOT NULL,
    "lab_order_id" TEXT NOT NULL,
    "lab_tech_id" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_assignments_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint for lab_order_id
ALTER TABLE "lab_assignments" ADD CONSTRAINT "lab_assignments_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes for lab_assignments
CREATE INDEX "lab_assignments_lab_tech_id_status_idx" ON "lab_assignments"("lab_tech_id", "status");
CREATE INDEX "lab_assignments_lab_order_id_idx" ON "lab_assignments"("lab_order_id");
