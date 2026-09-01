import { prisma } from './lib/prisma';

async function testWorkflow() {
  console.log('--- STARTING LAB ASSIGNMENT E2E VERIFICATION ---');

  // 1. Fetch Doctor and Lab Tech users
  const doctorUser = await prisma.user.findUnique({
    where: { username: 'doctor' },
    include: { staffProfile: true }
  });
  const labTechUser = await prisma.user.findUnique({
    where: { username: 'labtech' },
    include: { staffProfile: true }
  });

  if (!doctorUser?.staffProfile || !labTechUser?.staffProfile) {
    console.error('Missing doctor or labtech seed user!');
    process.exit(1);
  }

  console.log(`Found Doctor Profile: ${doctorUser.staffProfile.id} (${doctorUser.staffProfile.fullName})`);
  console.log(`Found Lab Tech Profile: ${labTechUser.staffProfile.id} (${labTechUser.staffProfile.fullName})`);

  // Ensure lab tech is available
  await prisma.staffProfile.update({
    where: { id: labTechUser.staffProfile.id },
    data: { isAvailable: true }
  });

  // 2. Find or create patient & encounter for test
  let patient = await prisma.patient.findFirst();
  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        mrn: 'MRN-TEST-101',
        firstName: 'John',
        lastName: 'Doe',
        dob: new Date('1990-01-01'),
        gender: 'MALE',
        phone: '+15550001111'
      }
    });
  }

  const encounter = await prisma.encounter.create({
    data: {
      patientId: patient.id,
      doctorId: doctorUser.staffProfile.id,
      visitStatus: 'DOCTOR_CONSULT',
      chiefComplaint: 'E2E Test Routine Checkup'
    }
  });

  console.log(`Created test encounter: ${encounter.id} for patient: ${patient.firstName} ${patient.lastName}`);

  // 3. Doctor creates a lab order
  const labOrder = await prisma.labOrder.create({
    data: {
      encounterId: encounter.id,
      patientId: patient.id,
      orderedBy: doctorUser.staffProfile.id,
      status: 'ORDERED'
    }
  });
  console.log(`Doctor created lab order: ${labOrder.id}`);

  // 4. Doctor assigns lab technician
  const assignment = await prisma.labAssignment.create({
    data: {
      labOrderId: labOrder.id,
      labTechId: labTechUser.staffProfile.id,
      assignedBy: doctorUser.staffProfile.id,
      status: 'PENDING'
    },
    include: {
      labOrder: {
        include: {
          encounter: {
            include: {
              patient: true
            }
          }
        }
      }
    }
  });
  console.log(`Created assignment: ${assignment.id}, status: ${assignment.status}`);

  // 5. Query assignments as lab tech
  const labTechAssignments = await prisma.labAssignment.findMany({
    where: {
      labTechId: labTechUser.staffProfile.id,
      status: { in: ['PENDING', 'ACCEPTED'] }
    },
    include: {
      labOrder: {
        include: {
          encounter: {
            include: {
              patient: true
            }
          }
        }
      }
    }
  });

  const foundAssignment = labTechAssignments.find((a: any) => a.id === assignment.id);
  if (!foundAssignment) {
    console.error('FAILED: Created assignment not found in lab tech assignments!');
    process.exit(1);
  }
  console.log(`PASSED: Lab tech successfully queried assignment for patient ${foundAssignment.labOrder.encounter.patient.firstName}`);

  // 6. Lab tech accepts assignment
  const updatedAssignment = await prisma.labAssignment.update({
    where: { id: assignment.id },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date()
    }
  });
  console.log(`PASSED: Lab tech accepted assignment ${updatedAssignment.id}, status is now ${updatedAssignment.status}`);

  // Clean up test data
  await prisma.labAssignment.delete({ where: { id: assignment.id } });
  await prisma.labOrder.delete({ where: { id: labOrder.id } });
  await prisma.encounter.delete({ where: { id: encounter.id } });

  console.log('--- ALL E2E VERIFICATION CHECKS PASSED SUCCESSFULLY ---');
  await prisma.$disconnect();
}

testWorkflow().catch((err) => {
  console.error('Test error:', err);
  prisma.$disconnect();
  process.exit(1);
});
