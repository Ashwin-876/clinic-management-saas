import { prisma } from '../src/lib/prisma';
import { generateNextDoctorId } from '../src/lib/doctor-id';
import { hashPassword, comparePassword, signToken, verifyToken } from '../src/lib/auth';
import { getTenantDb, assertTenantMatch, TenantAccessViolationError } from '../src/lib/tenant';
import { departmentSchema, doctorRegistrationSchema } from '../src/lib/validations';
import { generateNextClinicId } from '../src/lib/clinic-id';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runPhase2Tests() {
  console.log('===============================================================');
  console.log('🚀 PHASE 2: CLINIC DASHBOARD & DOCTOR MANAGEMENT TEST SUITE');
  console.log('===============================================================\n');

  // Setup test clinics
  console.log('--- 1. Setting Up Isolated Test Clinics ---');
  const clinicOneId = await generateNextClinicId(prisma);
  const clinicTwoId = await generateNextClinicId(prisma);

  const clinic1 = await prisma.clinic.create({
    data: {
      clinicId: clinicOneId,
      name: 'St. Jude Medical Center',
      clinicType: 'Multi-specialty Hospital',
      email: `stjude.${Date.now()}@hospital.com`,
      phone: '+91 80 5555 1111',
      address: '100 Medical Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      accountStatus: 'ACTIVE',
      users: {
        create: {
          name: 'Admin St. Jude',
          email: `admin.stjude.${Date.now()}@hospital.com`,
          mobileNumber: '+91 99999 55555',
          passwordHash: await hashPassword('AdminPass@2026'),
          role: 'ADMIN',
        },
      },
    },
    include: { users: true },
  });

  const clinic2 = await prisma.clinic.create({
    data: {
      clinicId: clinicTwoId,
      name: 'City Care Hospital',
      clinicType: 'General Medical Clinic',
      email: `citycare.${Date.now()}@hospital.com`,
      phone: '+91 22 7777 2222',
      address: '200 Central Avenue',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400002',
      accountStatus: 'ACTIVE',
      users: {
        create: {
          name: 'Admin City Care',
          email: `admin.citycare.${Date.now()}@hospital.com`,
          mobileNumber: '+91 88888 77777',
          passwordHash: await hashPassword('AdminPass@2026'),
          role: 'ADMIN',
        },
      },
    },
    include: { users: true },
  });

  assert(clinic1.clinicId !== clinic2.clinicId, 'Clinics created with distinct unique IDs');

  const tenant1 = getTenantDb(clinic1.clinicId);
  const tenant2 = getTenantDb(clinic2.clinicId);

  // 2. Department Management Tests
  console.log('\n--- 2. Testing Department Management ---');
  const deptCardio = await tenant1.createDepartment({
    name: 'Cardiology',
    description: 'Heart and cardiovascular care',
  });
  assert(deptCardio.name === 'Cardiology', 'Department Cardiology created');
  assert(deptCardio.clinicId === clinic1.clinicId, 'Department linked strictly to clinic 1');

  const deptPediatrics = await tenant1.createDepartment({
    name: 'Pediatrics',
    description: 'Child health and neonatal care',
  });
  assert(deptPediatrics.name === 'Pediatrics', 'Department Pediatrics created');

  // Clinic 2 creates its own Cardiology department
  const deptCardioClinic2 = await tenant2.createDepartment({
    name: 'Cardiology',
    description: 'Clinic 2 Cardiology Wing',
  });
  assert(deptCardioClinic2.clinicId === clinic2.clinicId, 'Clinic 2 can have own department named Cardiology');

  // Department List & Tenant Isolation
  const depts1 = await tenant1.getDepartments();
  assert(depts1.length === 2, 'Clinic 1 has exactly 2 departments');

  const depts2 = await tenant2.getDepartments();
  assert(depts2.length === 1, 'Clinic 2 has exactly 1 department');

  // Update Department
  const updatedDept = await tenant1.updateDepartment(deptCardio.id, {
    description: 'Advanced interventional cardiology & cardiac surgery',
  });
  assert(
    updatedDept.description === 'Advanced interventional cardiology & cardiac surgery',
    'Department description updated successfully'
  );

  // Cross-clinic department modification attempt: Clinic 2 tries to update Clinic 1's department
  let crossDeptBlocked = false;
  try {
    await tenant2.updateDepartment(deptCardio.id, { name: 'Hacked Cardiology' });
  } catch (err) {
    if (err instanceof TenantAccessViolationError) crossDeptBlocked = true;
  }
  assert(crossDeptBlocked, 'Cross-clinic department update blocked strictly');

  // 3. Unique Doctor ID Generation
  console.log('\n--- 3. Testing Unique Doctor ID Generation (DOC-000001, DOC-000002) ---');
  const docId1 = await generateNextDoctorId(prisma);
  const docId2 = await generateNextDoctorId(prisma);
  console.log(`  Doctor ID 1: ${docId1}`);
  console.log(`  Doctor ID 2: ${docId2}`);
  assert(/^DOC-\d{6}$/.test(docId1), 'Doctor ID format matches DOC-000000');
  assert(docId1 !== docId2, 'Doctor IDs are unique and increment sequentially');

  // 4. Doctor Registration & Onboarding
  console.log('\n--- 4. Testing Doctor Registration & User Account Creation ---');
  const doctorEmail1 = `dr.sharma.${Date.now()}@hospital.com`;
  const doctorPasswordRaw = 'DocSecret@2026';
  const doctorPasswordHash = await hashPassword(doctorPasswordRaw);

  const userDoc1 = await prisma.user.create({
    data: {
      clinicId: clinic1.clinicId,
      name: 'Dr. Ramesh Sharma',
      email: doctorEmail1,
      mobileNumber: '+91 98765 12345',
      passwordHash: doctorPasswordHash,
      role: 'DOCTOR',
      isActive: true,
    },
  });

  const doc1 = await prisma.doctor.create({
    data: {
      doctorId: docId1,
      clinicId: clinic1.clinicId,
      userId: userDoc1.id,
      fullName: 'Dr. Ramesh Sharma',
      email: doctorEmail1,
      phone: '+91 98765 12345',
      specialization: 'Interventional Cardiology',
      qualification: 'MBBS, MD, DM',
      experience: 15,
      departmentId: deptCardio.id,
      consultationFee: 750,
      accountStatus: 'ACTIVE',
    },
    include: { department: true, user: true },
  });

  assert(doc1.doctorId === docId1, `Doctor registered with ID ${doc1.doctorId}`);
  assert(doc1.departmentId === deptCardio.id, 'Doctor assigned to Cardiology department');
  assert(doc1.user?.role === 'DOCTOR', 'Doctor linked to login account with role DOCTOR');

  // Register second doctor (Inactive status)
  const doctorEmail2 = `dr.priya.${Date.now()}@hospital.com`;
  const userDoc2 = await prisma.user.create({
    data: {
      clinicId: clinic1.clinicId,
      name: 'Dr. Priya Nair',
      email: doctorEmail2,
      mobileNumber: '+91 98765 54321',
      passwordHash: await hashPassword('DocSecret@2026'),
      role: 'DOCTOR',
      isActive: false, // Inactive user
    },
  });

  const doc2 = await prisma.doctor.create({
    data: {
      doctorId: docId2,
      clinicId: clinic1.clinicId,
      userId: userDoc2.id,
      fullName: 'Dr. Priya Nair',
      email: doctorEmail2,
      phone: '+91 98765 54321',
      specialization: 'Pediatric Pulmonology',
      qualification: 'MBBS, DCH, DNB',
      experience: 8,
      departmentId: deptPediatrics.id,
      consultationFee: 500,
      accountStatus: 'INACTIVE',
    },
    include: { department: true, user: true },
  });
  assert(doc2.accountStatus === 'INACTIVE', 'Doctor 2 registered with INACTIVE status');

  // 5. Safe Department Deletion Guard
  console.log('\n--- 5. Testing Safe Department Deletion (Cannot delete if doctors assigned) ---');
  let deleteBlocked = false;
  try {
    await tenant1.deleteDepartment(deptCardio.id);
  } catch (err: any) {
    if (err.message.includes('assigned to it')) {
      deleteBlocked = true;
    }
  }
  assert(deleteBlocked, 'Safe deletion rule blocked deleting department with assigned doctors');

  // 6. Doctor Management: Edit, Status Toggle, Search, and Filters
  console.log('\n--- 6. Testing Doctor Management (Search, Filter, Edit, Toggle) ---');
  // Search by name
  const searchResults = await tenant1.getDoctors({ search: 'Ramesh' });
  assert(searchResults.length === 1 && searchResults[0].id === doc1.id, 'Doctor search by name works');

  // Search by Doctor ID
  const searchById = await tenant1.getDoctors({ search: docId1 });
  assert(searchById.length === 1 && searchById[0].doctorId === docId1, 'Doctor search by Doctor ID works');

  // Filter by Department
  const cardioDocs = await tenant1.getDoctors({ departmentId: deptCardio.id });
  assert(cardioDocs.length === 1 && cardioDocs[0].id === doc1.id, 'Filter by department works');

  // Filter by Status
  const activeDocs = await tenant1.getDoctors({ status: 'ACTIVE' });
  assert(activeDocs.length === 1 && activeDocs[0].id === doc1.id, 'Filter by ACTIVE status works');

  const inactiveDocs = await tenant1.getDoctors({ status: 'INACTIVE' });
  assert(inactiveDocs.length === 1 && inactiveDocs[0].id === doc2.id, 'Filter by INACTIVE status works');

  // Edit Doctor
  const updatedDoc1 = await tenant1.updateDoctor(doc1.id, {
    consultationFee: 900,
    experience: 16,
  });
  assert(updatedDoc1.consultationFee === 900, 'Doctor consultation fee updated');
  assert(updatedDoc1.experience === 16, 'Doctor experience updated');

  // Toggle Doctor Status
  const toggledDoc1 = await tenant1.toggleDoctorStatus(doc1.id, 'INACTIVE');
  assert(toggledDoc1.accountStatus === 'INACTIVE', 'Doctor status toggled to INACTIVE');

  // Toggle back to ACTIVE
  const restoredDoc1 = await tenant1.toggleDoctorStatus(doc1.id, 'ACTIVE');
  assert(restoredDoc1.accountStatus === 'ACTIVE', 'Doctor status restored to ACTIVE');

  // 7. Advanced Dashboard Metrics
  console.log('\n--- 7. Testing Advanced Dashboard Metrics ---');
  const metrics1 = await tenant1.getAdvancedDashboardMetrics();
  assert(metrics1.metrics.totalDoctors === 2, 'Total doctors count = 2');
  assert(metrics1.metrics.activeDoctors === 1, 'Active doctors count = 1');
  assert(metrics1.metrics.inactiveDoctors === 1, 'Inactive doctors count = 1');
  assert(metrics1.metrics.totalDepartments === 2, 'Total departments count = 2');
  assert(metrics1.recentDoctors.length === 2, 'Recently added doctors retrieved');
  assert(metrics1.clinic?.name === 'St. Jude Medical Center', 'Clinic information accurate');

  // 8. Doctor Authentication & Login
  console.log('\n--- 8. Testing Doctor Login & Individual Credentials ---');
  const isMatch = await comparePassword(doctorPasswordRaw, userDoc1.passwordHash);
  assert(isMatch, 'Doctor password verifies against stored hash');

  const docToken = signToken({
    userId: userDoc1.id,
    clinicId: clinic1.clinicId,
    email: userDoc1.email,
    name: userDoc1.name,
    role: userDoc1.role,
    clinicName: clinic1.name,
    doctorId: doc1.id,
  });
  assert(typeof docToken === 'string', 'Doctor JWT token generated');

  const verifiedDoc = verifyToken(docToken);
  assert(verifiedDoc?.role === 'DOCTOR', 'Doctor session verified with role DOCTOR');
  assert(verifiedDoc?.doctorId === doc1.id, 'Doctor session holds doctor ID reference');

  // 9. Cross-Clinic Tenant Isolation on Doctor Endpoints
  console.log('\n--- 9. Testing Strict Cross-Clinic Doctor Isolation ---');
  // Clinic 2 queries doctors: should return 0 (none created in clinic 2 yet)
  const clinic2Doctors = await tenant2.getDoctors();
  assert(clinic2Doctors.length === 0, 'Clinic 2 cannot see Clinic 1 doctors');

  // Cross-clinic doctor fetch
  const crossDoctor = await tenant2.getDoctorById(doc1.id);
  assert(crossDoctor === null, 'Clinic 2 cannot access Clinic 1 doctor by ID');

  // Cross-clinic doctor update attempt
  let crossDoctorUpdateBlocked = false;
  try {
    await tenant2.updateDoctor(doc1.id, { consultationFee: 10 });
  } catch (err) {
    if (err instanceof TenantAccessViolationError) crossDoctorUpdateBlocked = true;
  }
  assert(crossDoctorUpdateBlocked, 'Cross-clinic doctor update strictly blocked');

  console.log('\n===============================================================');
  console.log(`🎉 ALL PHASE 2 TESTS PASSED: ${passedTests} passed, ${failedTests} failed.`);
  console.log('===============================================================\n');

  await prisma.$disconnect();
}

runPhase2Tests().catch((err) => {
  console.error('\n❌ PHASE 2 TEST RUNNER FAILED:', err);
  process.exit(1);
});

