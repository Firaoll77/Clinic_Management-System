import { execSync } from 'child_process';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { prisma } from './prisma';

export async function seedDefaultData() {
  console.log('🌱 Starting seed of default clinic accounts and data...');

  // 1. Admin
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

  // 2. Receptionist
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

  // 3. Doctor
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

  // 4. Nurse
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

  // 5. Laboratorist
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

  // Sample Services
  await prisma.service.upsert({
    where: { code: 'CONSULT-GP' },
    update: {},
    create: {
      code: 'CONSULT-GP',
      name: 'General Consultation',
      category: 'CONSULTATION',
      price: 50.0,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { code: 'CONSULT-FU' },
    update: {},
    create: {
      code: 'CONSULT-FU',
      name: 'Follow-up Consultation',
      category: 'CONSULTATION',
      price: 30.0,
      isActive: true,
    },
  });

  // Sample Lab Tests
  await prisma.labTest.upsert({
    where: { code: 'LAB-CBC' },
    update: {},
    create: {
      code: 'LAB-CBC',
      name: 'Complete Blood Count',
      department: 'LABORATORY',
      price: 25.0,
      referenceRange: 'RBC: 4.5-5.5M/µL, WBC: 4.5-11.0K/µL, Platelets: 150-450K/µL',
      unit: 'cells/µL',
      isActive: true,
    },
  });

  await prisma.labTest.upsert({
    where: { code: 'LAB-URINE' },
    update: {},
    create: {
      code: 'LAB-URINE',
      name: 'Urinalysis',
      department: 'LABORATORY',
      price: 15.0,
      referenceRange: 'Color: Yellow, Specific Gravity: 1.003-1.035',
      unit: 'N/A',
      isActive: true,
    },
  });

  console.log('✅ Default clinic accounts and services successfully seeded!');
  return { admin, receptionist, doctor, nurse, laboratorist };
}

export async function checkAndInitDatabase() {
  try {
    let userCount: number;
    try {
      userCount = await prisma.user.count();
    } catch (dbError: any) {
      const errMsg = dbError?.message || '';
      if (errMsg.includes('does not exist') || dbError?.code === 'P2021') {
        console.log('⚠️ Database tables not found. Automatically running prisma db push...');
        try {
          execSync('npx prisma db push --skip-generate --accept-data-loss', {
            stdio: 'inherit',
            env: process.env,
          });
          console.log('✅ Database tables initialized successfully!');
        } catch (pushErr: any) {
          console.error('Failed to auto-push schema:', pushErr.message);
        }
      }
      userCount = await prisma.user.count();
    }

    if (userCount === 0) {
      console.log('⚠️ Database has 0 users. Seeding default demo accounts...');
      await seedDefaultData();
    } else {
      console.log(`✅ Database ready with ${userCount} existing users.`);
    }
  } catch (error: any) {
    console.error('⚠️ Database init check:', error.message);
  }
}
