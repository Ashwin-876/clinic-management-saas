import { prisma } from '../src/lib/prisma';
import { getTenantDb, assertTenantMatch, TenantAccessViolationError } from '../src/lib/tenant';
import { generateNextPatientId, formatPatientId, sanitizeClinicPart } from '../src/lib/patient-id';
import { generateQrCodeDataUrl, generateClinicQrSlug, getPatientRegistrationUrl } from '../src/lib/qr';
import { createOtpVerification, verifyOtpCode, validateVerificationToken } from '../src/lib/otp';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    testsFailed++;
  }
}

async function runPhase3Tests() {
  console.log('\n=============================================================');
  console.log('  RUNNING PHASE 3 TEST SUITE: PATIENT REGISTRATION & QR CODE');
  console.log('=============================================================\n');

  try {
    // 1. SETUP TWO SEPARATE TEST CLINICS FOR TENANT ISOLATION TESTING
    const clinicAId = 'QNX-CLN-TEST01';
    const clinicBId = 'QNX-CLN-TEST02';

    await prisma.patientVisit.deleteMany({
      where: { clinicId: { in: [clinicAId, clinicBId] } },
    });
    await prisma.otpVerification.deleteMany({
      where: { clinicId: { in: [clinicAId, clinicBId] } },
    });
    await prisma.patient.deleteMany({
      where: { clinicId: { in: [clinicAId, clinicBId] } },
    });
    await prisma.patientSequence.deleteMany({
      where: { clinicId: { in: [clinicAId, clinicBId] } },
    });
    await prisma.clinic.deleteMany({
      where: { clinicId: { in: [clinicAId, clinicBId] } },
    });

    const clinicA = await prisma.clinic.create({
      data: {
        clinicId: clinicAId,
        name: 'Apex Health Clinic A',
        clinicType: 'General Medical Clinic',
        email: 'apex_p3_a@testclinic.com',
        phone: '9876500001',
        address: '101 Healthcare Blvd',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        qrSlug: 'slug_test_clinic_a',
      },
    });

    const clinicB = await prisma.clinic.create({
      data: {
        clinicId: clinicBId,
        name: 'Beacon Care Clinic B',
        clinicType: 'Multi-specialty Hospital',
        email: 'beacon_p3_b@testclinic.com',
        phone: '9876500002',
        address: '202 Medical Square',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        qrSlug: 'slug_test_clinic_b',
      },
    });

    console.log('--- TEST GROUP 1: PATIENT ID GENERATION & FORMAT ---');
    // Test 1: Sanitize clinic part
    const partA = sanitizeClinicPart(clinicAId);
    assert(partA === 'CLNTEST01', 'Clinic part correctly extracted and formatted', `Got: ${partA}`);

    // Test 2: Sequential ID format: PAT-CLN...-000001
    const formattedId1 = formatPatientId(clinicAId, 1);
    assert(
      formattedId1 === 'PAT-CLNTEST01-000001',
      'Patient ID formatted with PAT prefix, clinic code and 6-digit zero padding',
      `Got: ${formattedId1}`
    );

    // Test 3: Atomic sequence generation in Clinic A
    const idA1 = await generateNextPatientId(prisma, clinicAId);
    assert(idA1 === 'PAT-CLNTEST01-000001', 'First generated patient ID for Clinic A is sequence 1', `Got: ${idA1}`);

    const idA2 = await generateNextPatientId(prisma, clinicAId);
    assert(idA2 === 'PAT-CLNTEST01-000002', 'Second generated patient ID for Clinic A increments to sequence 2', `Got: ${idA2}`);

    // Test 4: Clinic B sequence starts at 1 independently
    const idB1 = await generateNextPatientId(prisma, clinicBId);
    assert(idB1 === 'PAT-CLNTEST02-000001', 'Clinic B patient sequence starts independently at 1', `Got: ${idB1}`);

    console.log('\n--- TEST GROUP 2: QR CODE GENERATION & PUBLIC URL ---');
    // Test 5: Clinic QR slug generator
    const slug = generateClinicQrSlug(clinicAId);
    assert(slug.startsWith('c_') && slug.length > 10, 'generateClinicQrSlug produces unguessable slug');

    // Test 6: Public Registration URL builder
    const regUrl = getPatientRegistrationUrl(clinicA.qrSlug!, 'http://localhost:3000');
    assert(
      regUrl === `http://localhost:3000/register-patient/${clinicA.qrSlug}`,
      'Public registration URL correctly formatted with slug'
    );

    // Test 7: QR Code PNG Data URL generation
    const qrDataUrl = await generateQrCodeDataUrl(regUrl);
    assert(
      qrDataUrl.startsWith('data:image/png;base64,'),
      'QR Code PNG base64 Data URL generated successfully'
    );

    console.log('\n--- TEST GROUP 3: TENANT-ISOLATED PATIENT REGISTRATION ---');
    const tenantDbA = getTenantDb(clinicAId);
    const tenantDbB = getTenantDb(clinicBId);

    const testMobile = '9876543210';

    // Test 8: Register new patient in Clinic A
    const patientA = await tenantDbA.createPatient({
      fullName: 'Vikram Malhotra',
      mobileNumber: testMobile,
      age: 38,
      gender: 'Male',
      email: 'vikram@example.com',
      address: 'Indiranagar 100ft road',
      emergencyContact: '9876543211',
      consentGiven: true,
      registrationChannel: 'QR_CODE',
    });

    assert(
      patientA.patientId.startsWith('PAT-CLNTEST01-'),
      'Patient registered in Clinic A receives Clinic A patient ID',
      `ID: ${patientA.patientId}`
    );
    assert(patientA.totalVisits === 1, 'New patient totalVisits initialized to 1');
    assert(patientA.visits.length === 1, 'Initial patient visit record automatically created');
    assert(patientA.visits[0].registrationChannel === 'QR_CODE', 'Visit channel logged as QR_CODE');

    // Test 9: Duplicate registration within same clinic is rejected
    let duplicateErrorThrown = false;
    try {
      await tenantDbA.createPatient({
        fullName: 'Vikram Duplicate',
        mobileNumber: testMobile,
      });
    } catch (err: any) {
      duplicateErrorThrown = true;
    }
    assert(duplicateErrorThrown, 'Duplicate patient registration with same mobile number in same clinic is blocked');

    // Test 10: Strict Tenant Isolation: SAME mobile CAN register in Clinic B independently!
    const patientB = await tenantDbB.createPatient({
      fullName: 'Vikram Malhotra (Clinic B Record)',
      mobileNumber: testMobile,
      age: 38,
      gender: 'Male',
      registrationChannel: 'QR_CODE',
    });

    assert(
      patientB.patientId.startsWith('PAT-CLNTEST02-'),
      'Same mobile number registers independently in Clinic B without collision',
      `ID: ${patientB.patientId}`
    );
    assert(patientB.clinicId === clinicBId, 'Clinic B patient record strictly bound to Clinic B tenant');

    // Test 11: Cross-tenant query separation
    const clinicAPatients = await tenantDbA.getPatients();
    const clinicBPatients = await tenantDbB.getPatients();

    const clinicAHasClinicBPatient = clinicAPatients.patients.some((p) => p.id === patientB.id);
    const clinicBHasClinicAPatient = clinicBPatients.patients.some((p) => p.id === patientA.id);

    assert(!clinicAHasClinicBPatient, 'Clinic A patient list NEVER contains Clinic B patients');
    assert(!clinicBHasClinicAPatient, 'Clinic B patient list NEVER contains Clinic A patients');

    console.log('\n--- TEST GROUP 4: OTP GENERATION, EXPIRY & VERIFICATION ---');
    // Test 12: Create OTP verification
    const otpResult = await createOtpVerification(clinicAId, testMobile, clinicA.name);
    assert(
      /^\d{6}$/.test(otpResult.otpCode),
      'OTP code is a cryptographically random 6-digit number',
      `Code: ${otpResult.otpCode}`
    );
    assert(
      otpResult.expiresAt.getTime() > Date.now(),
      'OTP expiresAt set in the future (10 min expiry)'
    );

    // Test 13: Incorrect OTP verification failure
    const wrongVerify = await verifyOtpCode(clinicAId, testMobile, '000000');
    assert(!wrongVerify.success, 'Verification fails for incorrect OTP code');

    // Test 14: Correct OTP verification success
    const correctVerify = await verifyOtpCode(clinicAId, testMobile, otpResult.otpCode);
    assert(correctVerify.success, 'Verification succeeds with valid 6-digit OTP code');
    assert(
      Boolean(correctVerify.verificationToken),
      'Secure verification token issued upon successful OTP check'
    );

    // Test 15: Validate verification token
    const isTokenValid = await validateVerificationToken(
      clinicAId,
      testMobile,
      correctVerify.verificationToken!
    );
    assert(isTokenValid, 'Verification token validated successfully');

    // Test 16: Verification token is isolated to clinic
    const isTokenValidInClinicB = await validateVerificationToken(
      clinicBId,
      testMobile,
      correctVerify.verificationToken!
    );
    assert(!isTokenValidInClinicB, 'Verification token cannot be used in a different clinic');

    console.log('\n--- TEST GROUP 5: RETURNING PATIENT VISIT LOGGING ---');
    // Test 17: Record returning patient visit
    const { patient: returningPatient, visit: newVisit } = await tenantDbA.recordPatientVisit(
      patientA.id,
      {
        channel: 'QR_CODE',
        notes: 'Follow-up checkup',
      }
    );

    assert(returningPatient.totalVisits === 2, 'Total visits incremented to 2 for returning patient');
    assert(newVisit.patientId === patientA.id, 'New visit linked to existing patient record');
    assert(newVisit.notes === 'Follow-up checkup', 'Visit notes preserved');

    // Test 18: Patient Profile & Visit History
    const profile = await tenantDbA.getPatientById(patientA.id);
    assert(Boolean(profile), 'Patient profile retrieved by ID');
    assert(profile?.visits.length === 2, 'Patient profile includes chronological history of 2 visits');

    // Test 19: Patient Metrics
    const metricsA = await tenantDbA.getPatientMetrics();
    assert(metricsA.totalPatients === 1, 'Total patients count in Clinic A is 1');
    assert(metricsA.newPatients === 0, 'New patients count (visits=1) in Clinic A is 0 (patient is returning)');
    assert(metricsA.returningPatients === 1, 'Returning patients count (visits>1) in Clinic A is 1');

    console.log('\n--- TEST GROUP 6: PATIENT PROFILE UPDATE & SECURITY GUARDS ---');
    // Test 20: Update patient profile
    const updated = await tenantDbA.updatePatient(patientA.id, {
      fullName: 'Vikram Malhotra (Updated)',
      age: 39,
      address: 'Koramangala 4th Block',
    });
    assert(updated.fullName === 'Vikram Malhotra (Updated)', 'Patient full name updated');
    assert(updated.age === 39, 'Patient age updated');

    // Test 21: Cross-tenant update blocked
    let crossTenantError = false;
    try {
      await tenantDbB.updatePatient(patientA.id, {
        fullName: 'Hacked Patient',
      });
    } catch (err: any) {
      crossTenantError = err instanceof TenantAccessViolationError;
    }
    assert(crossTenantError, 'Cross-tenant update of patient record is blocked with TenantAccessViolationError');

    // Test 22: Search patients by name, ID, or mobile
    const searchById = await tenantDbA.getPatients({ search: patientA.patientId });
    assert(searchById.patients.length === 1, 'Patient searchable by Patient ID');

    const searchByMobile = await tenantDbA.getPatients({ search: testMobile });
    assert(searchByMobile.patients.length === 1, 'Patient searchable by Mobile Number');

    const searchByName = await tenantDbA.getPatients({ search: 'Malhotra' });
    assert(searchByName.patients.length === 1, 'Patient searchable by Name substring');

    // Cleanup
    await prisma.patientVisit.deleteMany({
      where: { clinicId: { in: [clinicAId, clinicBId] } },
    });
    await prisma.otpVerification.deleteMany({
      where: { clinicId: { in: [clinicAId, clinicBId] } },
    });
    await prisma.patient.deleteMany({
      where: { clinicId: { in: [clinicAId, clinicBId] } },
    });
    await prisma.patientSequence.deleteMany({
      where: { clinicId: { in: [clinicAId, clinicBId] } },
    });
    await prisma.clinic.deleteMany({
      where: { clinicId: { in: [clinicAId, clinicBId] } },
    });

    console.log('\n=============================================================');
    console.log(`  PHASE 3 TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log('=============================================================\n');

    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during Phase 3 tests:', error);
    process.exit(1);
  }
}

runPhase3Tests();

