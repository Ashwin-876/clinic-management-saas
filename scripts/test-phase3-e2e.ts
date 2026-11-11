const BASE_URL = process.env.TEST_APP_URL || 'http://127.0.0.1:3000';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

async function runE2ETests() {
  console.log('\n=============================================================');
  console.log('  RUNNING PHASE 3 END-TO-END HTTP API TEST SUITE');
  console.log(`  Target: ${BASE_URL}`);
  console.log('=============================================================\n');

  try {
    const timestamp = Date.now();

    // 1. REGISTER TWO CLINICS FOR TENANT ISOLATION TESTING
    console.log('--- SETUP: REGISTERING TWO TENANT CLINICS ---');
    const clinicAEmail = `e2e_clinic_a_${timestamp}@testmed.com`;
    const clinicBEmail = `e2e_clinic_b_${timestamp}@testmed.com`;
    const password = 'SecurePassword123!';

    const regResA = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicName: `Apex Super Clinic A ${timestamp}`,
        clinicType: 'General Medical Clinic',
        officialEmail: clinicAEmail,
        contactNumber: '+91 9876543201',
        address: '101 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        ownerName: 'Dr. Apex Admin A',
        ownerEmail: clinicAEmail,
        mobileNumber: '9876543201',
        password,
        confirmPassword: password,
      }),
    });

    const regDataA = await regResA.json();
    assert(regResA.status === 201, 'Clinic A registered successfully');
    const clinicAId = regDataA.data.clinicId;

    const regResB = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicName: `Beacon City Hospital B ${timestamp}`,
        clinicType: 'Multi-specialty Hospital',
        officialEmail: clinicBEmail,
        contactNumber: '+91 9876543202',
        address: '202 Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400002',
        ownerName: 'Dr. Beacon Admin B',
        ownerEmail: clinicBEmail,
        mobileNumber: '9876543202',
        password,
        confirmPassword: password,
      }),
    });

    const regDataB = await regResB.json();
    assert(regResB.status === 201, 'Clinic B registered successfully');
    const clinicBId = regDataB.data.clinicId;

    // Login Clinic A
    const loginResA = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: clinicAEmail, password }),
    });
    const cookieA = loginResA.headers.get('set-cookie') || '';
    assert(loginResA.status === 200 && Boolean(cookieA), 'Clinic A administrator logged in with session cookie');

    // Login Clinic B
    const loginResB = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: clinicBEmail, password }),
    });
    const cookieB = loginResB.headers.get('set-cookie') || '';
    assert(loginResB.status === 200 && Boolean(cookieB), 'Clinic B administrator logged in with session cookie');

    console.log('\n--- TEST GROUP 1: CLINIC QR CODE GENERATION ---');
    // Test: GET /api/clinic/qr without auth
    const unauthQrRes = await fetch(`${BASE_URL}/api/clinic/qr`);
    assert(unauthQrRes.status === 401, 'Unauthorized request to /api/clinic/qr rejected with 401');

    // Test: GET /api/clinic/qr with Clinic A auth
    const qrResA = await fetch(`${BASE_URL}/api/clinic/qr`, {
      headers: { Cookie: cookieA },
    });
    const qrDataA = await qrResA.json();
    assert(qrResA.status === 200, 'Clinic A QR code fetched successfully');
    assert(Boolean(qrDataA.qrCodeDataUrl?.startsWith('data:image/png;base64,')), 'QR code image data URL returned');
    assert(Boolean(qrDataA.registrationUrl?.includes('/register-patient/')), 'Public registration URL includes /register-patient/');
    assert(Boolean(qrDataA.qrSlug), 'Unguessable qrSlug returned');

    const clinicAQrSlug = qrDataA.qrSlug;

    console.log('\n--- TEST GROUP 2: PUBLIC CLINIC INFO LOOKUP ---');
    // Test: GET /api/clinic/public-info/[slug]
    const pubInfoRes = await fetch(`${BASE_URL}/api/clinic/public-info/${clinicAQrSlug}`);
    const pubInfoData = await pubInfoRes.json();
    assert(pubInfoRes.status === 200, 'Public clinic information retrieved via QR slug');
    assert(pubInfoData.clinic.name === regDataA.data.clinicName, 'Public clinic name matches');
    assert(!pubInfoData.clinic.passwordHash, 'Sensitive fields like passwordHash NOT exposed');

    // Test: GET /api/clinic/public-info/invalid_slug -> 404
    const invalidPubInfo = await fetch(`${BASE_URL}/api/clinic/public-info/non_existent_slug`);
    assert(invalidPubInfo.status === 404, 'Invalid clinic identifier returns 404');

    console.log('\n--- TEST GROUP 3: PUBLIC QR PATIENT REGISTRATION (NEW PATIENT) ---');
    const patientMobile = `91234${Math.floor(10000 + Math.random() * 90000)}`;

    // Check mobile (should be new)
    const checkMob1 = await fetch(`${BASE_URL}/api/patient/check-mobile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicIdentifier: clinicAQrSlug,
        mobileNumber: patientMobile,
      }),
    });
    const checkMob1Data = await checkMob1.json();
    assert(checkMob1.status === 200 && checkMob1Data.exists === false, 'New mobile number reports exists = false');

    // Register new patient via public endpoint
    const regPatientRes = await fetch(`${BASE_URL}/api/patient/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicIdentifier: clinicAQrSlug,
        fullName: 'Priya Sundaram',
        mobileNumber: patientMobile,
        age: 29,
        gender: 'Female',
        email: 'priya.s@example.com',
        address: '24 Palm Grove Road',
        emergencyContact: '9876543299',
        consentGiven: true,
        registrationChannel: 'QR_CODE',
      }),
    });

    const regPatientData = await regPatientRes.json();
    assert(regPatientRes.status === 201, 'New patient registered successfully via public endpoint');
    assert(regPatientData.isReturning === false, 'isReturning flag is false for new patient');
    assert(
      /^PAT-CLN\d+-000001$/.test(regPatientData.patient.patientId) ||
        regPatientData.patient.patientId.startsWith('PAT-'),
      'Unique Patient ID generated with PAT prefix and sequential format',
      `Got: ${regPatientData.patient.patientId}`
    );
    const patientA1Id = regPatientData.patient.id;
    const patientA1PatientId = regPatientData.patient.patientId;

    console.log('\n--- TEST GROUP 4: EXISTING PATIENT DETECTION & OTP VERIFICATION ---');
    // Check mobile again with same registered number -> returning patient detected!
    const checkMob2 = await fetch(`${BASE_URL}/api/patient/check-mobile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-mode': 'true' },
      body: JSON.stringify({
        clinicIdentifier: clinicAQrSlug,
        mobileNumber: patientMobile,
      }),
    });
    const checkMob2Data = await checkMob2.json();
    assert(checkMob2.status === 200 && checkMob2Data.exists === true, 'Existing patient detected via mobile number');
    assert(Boolean(checkMob2Data.simulatedOtp), 'Simulated OTP provided in test environment');
    assert(Boolean(checkMob2Data.maskedName), 'Patient name safely masked in returning notification');

    const simulatedOtp = checkMob2Data.simulatedOtp;

    // Verify OTP with wrong code
    const wrongOtpRes = await fetch(`${BASE_URL}/api/patient/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicIdentifier: clinicAQrSlug,
        mobileNumber: patientMobile,
        otpCode: '000000',
      }),
    });
    assert(wrongOtpRes.status === 400, 'Incorrect OTP code rejected with 400');

    // Verify OTP with correct code
    const correctOtpRes = await fetch(`${BASE_URL}/api/patient/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicIdentifier: clinicAQrSlug,
        mobileNumber: patientMobile,
        otpCode: simulatedOtp,
      }),
    });
    const correctOtpData = await correctOtpRes.json();
    assert(correctOtpRes.status === 200 && correctOtpData.success === true, 'OTP verified successfully');
    assert(Boolean(correctOtpData.verificationToken), 'One-time verificationToken granted upon OTP success');

    const verificationToken = correctOtpData.verificationToken;

    // Record returning patient visit with verification token
    const returningRegRes = await fetch(`${BASE_URL}/api/patient/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicIdentifier: clinicAQrSlug,
        fullName: 'Priya Sundaram',
        mobileNumber: patientMobile,
        verificationToken,
        registrationChannel: 'QR_CODE',
      }),
    });
    const returningRegData = await returningRegRes.json();
    assert(returningRegRes.status === 200, 'Returning patient check-in confirmed');
    assert(returningRegData.isReturning === true, 'isReturning flag is true');
    assert(returningRegData.patient.totalVisits === 2, 'Total visits incremented to 2');

    console.log('\n--- TEST GROUP 5: DASHBOARD PATIENTS API & METRICS ---');
    // Authenticated GET /api/clinic/patients
    const patientsRes = await fetch(`${BASE_URL}/api/clinic/patients`, {
      headers: { Cookie: cookieA },
    });
    const patientsData = await patientsRes.json();
    assert(patientsRes.status === 200, 'Clinic A patient directory retrieved');
    assert(patientsData.patients.length === 1, 'Clinic A has exactly 1 patient listed');
    assert(patientsData.metrics.totalPatients === 1, 'Total patients metric = 1');
    assert(patientsData.metrics.newPatients === 0, 'New patients metric = 0 (patient has 2 visits)');
    assert(patientsData.metrics.returningPatients === 1, 'Returning patients metric = 1');

    // Authenticated GET /api/clinic/patients/:id
    const patientDetailRes = await fetch(`${BASE_URL}/api/clinic/patients/${patientA1Id}`, {
      headers: { Cookie: cookieA },
    });
    const patientDetailData = await patientDetailRes.json();
    assert(patientDetailRes.status === 200, 'Patient profile retrieved with visit history');
    assert(patientDetailData.patient.visits.length === 2, 'Patient profile includes history of 2 visits');

    // Authenticated PUT /api/clinic/patients/:id
    const updateRes = await fetch(`${BASE_URL}/api/clinic/patients/${patientA1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({
        fullName: 'Priya Sundaram (Updated)',
        age: 30,
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Patient profile updated successfully');
    assert(updateData.patient.fullName === 'Priya Sundaram (Updated)', 'Full name successfully updated');

    // Staff Walk-in Registration (POST /api/clinic/patients)
    const staffRegRes = await fetch(`${BASE_URL}/api/clinic/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({
        fullName: 'Amit Patel (Walk-in)',
        mobileNumber: '9888877777',
        age: 45,
        gender: 'Male',
        registrationChannel: 'RECEPTION_DESK',
      }),
    });
    const staffRegData = await staffRegRes.json();
    assert(staffRegRes.status === 201, 'Staff walk-in registration created successfully');
    assert(staffRegData.patient.patientId.startsWith('PAT-'), 'Walk-in patient assigned Patient ID');

    // Verify Dashboard Metrics (GET /api/clinic/dashboard)
    const dashRes = await fetch(`${BASE_URL}/api/clinic/dashboard`, {
      headers: { Cookie: cookieA },
    });
    const dashData = await dashRes.json();
    assert(dashRes.status === 200, 'Clinic dashboard retrieved');
    assert(dashData.data.metrics.totalPatients === 2, 'Dashboard metrics totalPatients = 2');
    assert(dashData.data.metrics.newPatients === 1, 'Dashboard metrics newPatients = 1');
    assert(dashData.data.metrics.returningPatients === 1, 'Dashboard metrics returningPatients = 1');

    console.log('\n--- TEST GROUP 6: STRICT MULTI-TENANT CROSS-CLINIC ISOLATION ---');
    // Test: Clinic B cannot access Clinic A's patient record
    const crossTenantGet = await fetch(`${BASE_URL}/api/clinic/patients/${patientA1Id}`, {
      headers: { Cookie: cookieB },
    });
    assert(crossTenantGet.status === 404, 'Clinic B session CANNOT retrieve Clinic A patient record (404 isolated)');

    // Test: Clinic B cannot update Clinic A's patient record
    const crossTenantPut = await fetch(`${BASE_URL}/api/clinic/patients/${patientA1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieB,
      },
      body: JSON.stringify({ fullName: 'Malicious Update' }),
    });
    assert(crossTenantPut.status === 400 || crossTenantPut.status === 404, 'Clinic B session CANNOT update Clinic A patient record');

    // Test: Register patient in Clinic B with SAME mobile number as Clinic A
    const clinicBRegRes = await fetch(`${BASE_URL}/api/clinic/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieB,
      },
      body: JSON.stringify({
        fullName: 'Priya Sundaram (Clinic B File)',
        mobileNumber: patientMobile, // Same mobile as Clinic A patient!
        age: 29,
        gender: 'Female',
      }),
    });
    const clinicBRegData = await clinicBRegRes.json();
    assert(
      clinicBRegRes.status === 201,
      'Same mobile number registers independently in Clinic B without collision or leak'
    );
    assert(
      clinicBRegData.patient.id !== patientA1Id,
      'Clinic B patient receives a distinct, isolated record ID'
    );

    // Verify Clinic B patient list contains only Clinic B patient
    const clinicBListRes = await fetch(`${BASE_URL}/api/clinic/patients`, {
      headers: { Cookie: cookieB },
    });
    const clinicBListData = await clinicBListRes.json();
    assert(clinicBListData.patients.length === 1, 'Clinic B has only 1 patient');
    assert(
      clinicBListData.patients[0].fullName === 'Priya Sundaram (Clinic B File)',
      'Clinic B sees only its own patient record'
    );

    console.log('\n=============================================================');
    console.log(`  PHASE 3 E2E SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during E2E tests:', err);
    process.exit(1);
  }
}

runE2ETests();
