import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@clinic.com',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      role: Role.ADMIN,
      isActive: true,
      staffProfile: {
        create: {
          fullName: 'System Administrator',
          phone: '+1234567890',
        },
      },
    },
    include: { staffProfile: true },
  });
  console.log('Created admin user:', admin.username);

  // Create receptionist user
  const receptionist = await prisma.user.upsert({
    where: { username: 'receptionist' },
    update: {},
    create: {
      username: 'receptionist',
      email: 'reception@clinic.com',
      passwordHash: await bcrypt.hash('Reception@123', 10),
      role: Role.RECEPTIONIST,
      isActive: true,
      staffProfile: {
        create: {
          fullName: 'Aberash Tesfaye',
          phone: '+1234567891',
        },
      },
    },
    include: { staffProfile: true },
  });
  console.log('Created receptionist user:', receptionist.username);

  // Create doctor user
  const doctor = await prisma.user.upsert({
    where: { username: 'doctor' },
    update: {},
    create: {
      username: 'doctor',
      email: 'doctor@clinic.com',
      passwordHash: await bcrypt.hash('Doctor@123', 10),
      role: Role.DOCTOR,
      isActive: true,
      staffProfile: {
        create: {
          fullName: 'Dr. Beyene Teshale',
          phone: '+1234567892',
          specialization: 'General Practitioner',
          licenseNo: 'MD-12345',
        },
      },
    },
    include: { staffProfile: true },
  });
  console.log('Created doctor user:', doctor.username);

  // Create nurse user
  const nurse = await prisma.user.upsert({
    where: { username: 'nurse' },
    update: {},
    create: {
      username: 'nurse',
      email: 'nurse@clinic.com',
      passwordHash: await bcrypt.hash('Nurse@123', 10),
      role: Role.NURSE,
      isActive: true,
      staffProfile: {
        create: {
          fullName: 'Semira Ahmed',
          phone: '+1234567893',
          specialization: 'Registered Nurse',
        },
      },
    },
    include: { staffProfile: true },
  });
  console.log('Created nurse user:', nurse.username);

  // Create laboratorist user
  const laboratorist = await prisma.user.upsert({
    where: { username: 'labtech' },
    update: {},
    create: {
      username: 'labtech',
      email: 'lab@clinic.com',
      passwordHash: await bcrypt.hash('Lab@123', 10),
      role: Role.LAB_TECH,
      isActive: true,
      staffProfile: {
        create: {
          fullName: 'Shiferaw Tolosa',
          phone: '+1234567894',
          specialization: 'Medical Laboratory Scientist',
          licenseNo: 'MLS-67890',
        },
      },
    },
    include: { staffProfile: true },
  });
  console.log('Created laboratorist user:', laboratorist.username);

  

  //  sample services
  const consultationService = await prisma.service.upsert({
    where: { code: 'CONSULT-GP' },
    update: {},
    create: {
      code: 'CONSULT-GP',
      name: 'General Consultation',
      category: 'CONSULTATION',
      price: 50.00,
      isActive: true,
    },
  });
  console.log('Created service:', consultationService.code);

  const followUpService = await prisma.service.upsert({
    where: { code: 'CONSULT-FU' },
    update: {},
    create: {
      code: 'CONSULT-FU',
      name: 'Follow-up Consultation',
      category: 'CONSULTATION',
      price: 30.00,
      isActive: true,
    },
  });
  console.log('Created service:', followUpService.code);

  //  sample lab tests
  const bloodTest = await prisma.labTest.upsert({
    where: { code: 'LAB-CBC' },
    update: {},
    create: {
      code: 'LAB-CBC',
      name: 'Complete Blood Count',
      department: 'LABORATORY',
      price: 25.00,
      referenceRange: 'RBC: 4.5-5.5M/µL, WBC: 4.5-11.0K/µL, Platelets: 150-450K/µL',
      unit: 'cells/µL',
      isActive: true,
    },
  });
  console.log('Created lab test:', bloodTest.code);

  const urinalysis = await prisma.labTest.upsert({
    where: { code: 'LAB-URINE' },
    update: {},
    create: {
      code: 'LAB-URINE',
      name: 'Urinalysis',
      department: 'LABORATORY',
      price: 15.00,
      referenceRange: 'Color: Yellow, Specific Gravity: 1.003-1.035',
      unit: 'N/A',
      isActive: true,
    },
  });
  console.log('Created lab test:', urinalysis.code);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
