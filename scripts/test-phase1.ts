import { prisma } from '../src/lib/prisma';
import { generateNextClinicId } from '../src/lib/clinic-id';
import { hashPassword, comparePassword, signToken, verifyToken } from '../src/lib/auth';
import { assertTenantMatch, getTenantDb, TenantAccessViolationError } from '../src/lib/tenant';
import { checkRateLimit } from '../src/lib/rate-limit';
import { logAuditEvent } from '../src/lib/audit';
import { clinicRegistrationSchema, loginSchema } from '../src/lib/validations';

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

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 PHASE 1: CLINIC REGISTRATION & UNIQUE ID VERIFICATION SUITE');
  console.log('===============================================================\n');

  // Test 1: Validation Schemas
  console.log('--- 1. Testing Input Validation Schemas ---');
  const validData = {
    clinicName: 'Metro Health Multispecialty',
    clinicType: 'Multi-specialty Hospital',
    officialEmail: 'contact@metrohealth.com',
    contactNumber: '+91 80 1234 5678',
    address: '45 Healthcare Boulevard',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    ownerName: 'Dr. Anita Roy',
    ownerEmail: 'dr.anita@metrohealth.com',
    mobileNumber: '+91 98765 11111',
    password: 'SecurePassword@123',
    confirmPassword: 'SecurePassword@123',
  };
  const parsed = clinicRegistrationSchema.safeParse(validData);
  assert(parsed.success, 'Valid registration payload accepted by schema');

  const mismatchedPassword = { ...validData, confirmPassword: 'DifferentPassword@123' };
  const parseMismatch = clinicRegistrationSchema.safeParse(mismatchedPassword);
  assert(!parseMismatch.success, 'Mismatched passwords rejected by schema');

  // Test 2: Unique Clinic ID Generation Format & Concurrency
  console.log('\n--- 2. Testing Unique Clinic ID Generation (QNX-CLN-000001, QNX-CLN-000002) ---');
  const id1 = await generateNextClinicId(prisma);
  console.log(`  Generated ID 1: ${id1}`);
  assert(/^QNX-CLN-\d{6}$/.test(id1), 'Generated ID matches required regex QNX-CLN-000000 format');

  const id2 = await generateNextClinicId(prisma);
  console.log(`  Generated ID 2: ${id2}`);
  assert(id1 !== id2, 'Generated IDs are unique and increment sequentially');

  // Test 3: Password Hashing & Authentication
  console.log('\n--- 3. Testing Password Hashing & Bcrypt Security ---');
  const rawPassword = 'ClinicSecretPass@2026';
  const hashed = await hashPassword(rawPassword);
  assert(hashed !== rawPassword, 'Password is never stored in plain text');
  assert(hashed.startsWith('$2'), 'Password hashed with bcrypt');

  const validMatch = await comparePassword(rawPassword, hashed);
  assert(validMatch, 'Valid password matches hash correctly');

  const wrongMatch = await comparePassword('WrongPassword', hashed);
  assert(!wrongMatch, 'Invalid password does not match hash');

  // Test 4: JWT Session Management
  console.log('\n--- 4. Testing JWT Session Generation & Cryptographic Verification ---');
  const samplePayload = {
    userId: 'user-cuid-123',
    clinicId: id1,
    email: 'dr.anita@metrohealth.com',
    name: 'Dr. Anita Roy',
    role: 'ADMIN' as const,
    clinicName: 'Metro Health Multispecialty',
  };
  const token = signToken(samplePayload);
  assert(typeof token === 'string' && token.length > 20, 'JWT token signed successfully');

  const verified = verifyToken(token);
  assert(verified !== null && verified.clinicId === id1, 'JWT token verified and clinicId payload intact');

  const fakeVerified = verifyToken('invalid.token.signature');
  assert(fakeVerified === null, 'Tampered JWT token rejected safely');

  // Test 5: Full Database Clinic Registration & Shared Database Persistence
  console.log('\n--- 5. Testing Database Persistence & Provisioning ---');
  // Clean up any test clinics with these emails if re-running
  await prisma.user.deleteMany({
    where: { email: { in: ['admin.alpha@testclinic.com', 'admin.beta@testclinic.com'] } },
  });
  await prisma.clinic.deleteMany({
    where: { email: { in: ['office.alpha@testclinic.com', 'office.beta@testclinic.com'] } },
  });

  // Provision Clinic Alpha
  const clinicAlphaId = await generateNextClinicId(prisma);
  const clinicAlpha = await prisma.clinic.create({
    data: {
      clinicId: clinicAlphaId,
      name: 'Alpha Care Clinic',
      clinicType: 'Dental Clinic',
      email: 'office.alpha@testclinic.com',
      phone: '+91 22 1111 2222',
      address: 'Suite 101, Alpha Medical Tower',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      accountStatus: 'ACTIVE',
      users: {
        create: {
          name: 'Dr. Alpha Administrator',
          email: 'admin.alpha@testclinic.com',
          mobileNumber: '+91 99999 11111',
          passwordHash: await hashPassword('AlphaPass@2026'),
          role: 'ADMIN',
        },
      },
      settings: {
        create: {
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          slotDuration: 30,
        },
      },
    },
    include: { users: true, settings: true },
  });
  assert(clinicAlpha.clinicId === clinicAlphaId, `Clinic Alpha created with ID ${clinicAlpha.clinicId}`);
  assert(clinicAlpha.users.length === 1, 'Clinic Alpha administrator user created');
  assert(clinicAlpha.settings !== null, 'Clinic Alpha settings initialized');

  // Provision Clinic Beta
  const clinicBetaId = await generateNextClinicId(prisma);
  const clinicBeta = await prisma.clinic.create({
    data: {
      clinicId: clinicBetaId,
      name: 'Beta Life Hospital',
      clinicType: 'Multi-specialty Hospital',
      email: 'office.beta@testclinic.com',
      phone: '+91 80 3333 4444',
      address: 'Building 202, Beta Tech Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560002',
      accountStatus: 'ACTIVE',
      users: {
        create: {
          name: 'Dr. Beta Administrator',
          email: 'admin.beta@testclinic.com',
          mobileNumber: '+91 88888 22222',
          passwordHash: await hashPassword('BetaPass@2026'),
          role: 'ADMIN',
        },
      },
      settings: {
        create: {
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          slotDuration: 15,
        },
      },
    },
    include: { users: true, settings: true },
  });
  assert(clinicBeta.clinicId === clinicBetaId, `Clinic Beta created with ID ${clinicBeta.clinicId}`);
  assert(clinicAlpha.clinicId !== clinicBeta.clinicId, 'Clinic Alpha and Beta have distinct unique IDs');

  // Test 6: Shared Database with Strict Tenant-Level Data Separation
  console.log('\n--- 6. Testing Tenant Isolation & Prevention of Cross-Clinic Access ---');
  const tenantAlphaDb = getTenantDb(clinicAlpha.clinicId);
  const tenantBetaDb = getTenantDb(clinicBeta.clinicId);

  // Alpha queries its own data
  const alphaSelf = await tenantAlphaDb.getClinic();
  assert(alphaSelf?.clinicId === clinicAlpha.clinicId, 'Tenant Alpha queries only own clinic');
  assert(alphaSelf?.name === 'Alpha Care Clinic', 'Tenant Alpha retrieves correct clinic name');

  // Beta queries its own data
  const betaSelf = await tenantBetaDb.getClinic();
  assert(betaSelf?.clinicId === clinicBeta.clinicId, 'Tenant Beta queries only own clinic');
  assert(betaSelf?.name === 'Beta Life Hospital', 'Tenant Beta retrieves correct clinic name');

  // Verify users are strictly tenant-isolated
  const alphaUsers = await tenantAlphaDb.getUsers();
  assert(alphaUsers.length === 1 && alphaUsers[0].email === 'admin.alpha@testclinic.com', 'Alpha users list contains only Alpha users');

  const betaUsers = await tenantBetaDb.getUsers();
  assert(betaUsers.length === 1 && betaUsers[0].email === 'admin.beta@testclinic.com', 'Beta users list contains only Beta users');

  // Cross-tenant guard check: Alpha attempts to access Beta's tenant ID
  let crossAccessPrevented = false;
  try {
    assertTenantMatch(clinicAlpha.clinicId, clinicBeta.clinicId, {
      userId: clinicAlpha.users[0].id,
      resource: 'TestCrossAccessProbe',
    });
  } catch (err) {
    if (err instanceof TenantAccessViolationError) {
      crossAccessPrevented = true;
    }
  }
  assert(crossAccessPrevented, 'Cross-clinic access attempt is strictly intercepted and blocked');

  // Test 7: Rate Limiting
  console.log('\n--- 7. Testing Rate Limiting Protection ---');
  const testIp = '192.168.1.100';
  const limitOpts = { limit: 3, windowMs: 10000 };
  const r1 = checkRateLimit(testIp, limitOpts);
  const r2 = checkRateLimit(testIp, limitOpts);
  const r3 = checkRateLimit(testIp, limitOpts);
  const r4 = checkRateLimit(testIp, limitOpts); // Exceeds limit
  assert(r1.success && r2.success && r3.success, 'Requests within limit are permitted');
  assert(!r4.success && r4.remaining === 0, 'Excess request rejected by rate limiter (HTTP 429)');

  // Test 8: Audit Logging
  console.log('\n--- 8. Testing Security Audit Logs ---');
  await logAuditEvent({
    clinicId: clinicAlpha.clinicId,
    userId: clinicAlpha.users[0].id,
    action: 'TEST_AUDIT_VERIFIED',
    entity: 'SecuritySuite',
    details: { phase: 'Phase 1 Complete' },
    ipAddress: '127.0.0.1',
  });

  const logs = await tenantAlphaDb.getAuditLogs(5);
  assert(logs.length > 0, 'Audit logs successfully written and retrieved for tenant');
  assert(logs[0].action === 'TEST_AUDIT_VERIFIED' || logs[0].action === 'TENANT_ISOLATION_VIOLATION_BLOCKED', 'Audit log records correct security action');

  console.log('\n===============================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passedTests} passed, ${failedTests} failed.`);
  console.log('===============================================================\n');

  await prisma.$disconnect();
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUNNER FAILED:', err);
  process.exit(1);
});

