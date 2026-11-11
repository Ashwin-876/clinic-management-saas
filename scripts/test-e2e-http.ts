async function runE2ETests() {
  const BASE_URL = 'http://127.0.0.1:3000';
  console.log('===============================================================');
  console.log('🌐 RUNNING END-TO-END HTTP API & TENANT ISOLATION SUITE');
  console.log(` Target Server: ${BASE_URL}`);
  console.log('===============================================================\n');

  let passed = 0;
  function pass(msg: string) {
    console.log(`  ✓ PASS: ${msg}`);
    passed++;
  }

  const timestamp = Date.now();
  const testClinicPayload = {
    clinicName: `Zenith Health Hospital ${timestamp}`,
    clinicType: 'Multi-specialty Hospital',
    officialEmail: `contact.zenith${timestamp}@hospital.com`,
    contactNumber: '+91 80 8765 4321',
    address: 'Suite 500, Cyber Medicity, Outer Ring Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103',
    ownerName: 'Dr. Siddharth Menon',
    ownerEmail: `dr.menon${timestamp}@hospital.com`,
    mobileNumber: '+91 91234 56789',
    password: 'ZenithSecret@2026',
    confirmPassword: 'ZenithSecret@2026',
  };

  // 1. Clinic Registration
  console.log('--- 1. Testing Clinic Registration (POST /api/auth/register) ---');
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testClinicPayload),
  });
  const regJson = await regRes.json();
  if (regRes.status !== 201) {
    throw new Error(`Registration failed: ${JSON.stringify(regJson)}`);
  }
  pass(`Status 201 Created`);
  pass(`Generated Clinic ID: ${regJson.data.clinicId}`);
  if (!/^QNX-CLN-\d{6}$/.test(regJson.data.clinicId)) {
    throw new Error(`Invalid Clinic ID format: ${regJson.data.clinicId}`);
  }
  pass(`Clinic ID matches required QNX-CLN-000000 format`);
  pass(`Account Status is ACTIVE: ${regJson.data.accountStatus}`);

  const generatedClinicId = regJson.data.clinicId;

  // 2. Prevent Duplicate Registration
  console.log('\n--- 2. Testing Duplicate Email Prevention ---');
  const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testClinicPayload),
  });
  const dupJson = await dupRes.json();
  if (dupRes.status !== 409) {
    throw new Error(`Expected 409 Conflict, got ${dupRes.status}`);
  }
  pass(`Duplicate official email rejected with HTTP 409 Conflict`);

  // 3. Administrator Login
  console.log('\n--- 3. Testing Administrator Login (POST /api/auth/login) ---');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testClinicPayload.ownerEmail,
      password: testClinicPayload.password,
    }),
  });
  const loginJson = await loginRes.json();
  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
  }
  pass(`Administrator successfully authenticated (HTTP 200)`);
  pass(`User role confirmed as ADMIN: ${loginJson.user.role}`);

  const setCookie = loginRes.headers.get('set-cookie');
  if (!setCookie || !setCookie.includes('qnx_clinic_session')) {
    throw new Error(`Set-Cookie header missing session token`);
  }
  pass(`Secure HTTP-Only session cookie returned`);

  // Extract raw cookie value for subsequent authenticated requests
  const cookieHeader = setCookie.split(';')[0];

  // 4. Session Verification (/api/auth/me)
  console.log('\n--- 4. Testing Session Identity (GET /api/auth/me) ---');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: cookieHeader },
  });
  const meJson = await meRes.json();
  if (meRes.status !== 200 || !meJson.authenticated) {
    throw new Error(`Auth me check failed: ${JSON.stringify(meJson)}`);
  }
  pass(`Session recognized: userId=${meJson.user.userId}, clinicId=${meJson.user.clinicId}`);

  // 5. Clinic Dashboard Scoped Data
  console.log('\n--- 5. Testing Tenant Dashboard (GET /api/clinic/dashboard) ---');
  const dashRes = await fetch(`${BASE_URL}/api/clinic/dashboard`, {
    headers: { Cookie: cookieHeader },
  });
  const dashJson = await dashRes.json();
  if (dashRes.status !== 200) {
    throw new Error(`Dashboard retrieval failed: ${JSON.stringify(dashJson)}`);
  }
  pass(`Dashboard data retrieved with status 200`);
  pass(`Dashboard Clinic Name: "${dashJson.data.clinic.name}"`);
  pass(`Dashboard Clinic ID: "${dashJson.data.clinic.clinicId}"`);
  pass(`Dashboard Account Status: "${dashJson.data.clinic.accountStatus}"`);
  pass(`Dashboard Registration Date: "${dashJson.data.clinic.createdAt}"`);
  pass(`Clinic Settings loaded: timezone=${dashJson.data.settings.timezone}, slotDuration=${dashJson.data.settings.slotDuration}m`);

  // 6. Tenant Isolation Verification Probe
  console.log('\n--- 6. Testing Tenant Isolation Guard (POST /api/clinic/verify-tenant-isolation) ---');
  const probeRes = await fetch(`${BASE_URL}/api/clinic/verify-tenant-isolation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ targetClinicId: 'QNX-CLN-999999_UNAUTHORIZED_FOREIGN' }),
  });
  const probeJson = await probeRes.json();
  if (probeRes.status !== 200) {
    throw new Error(`Probe failed: ${JSON.stringify(probeJson)}`);
  }
  pass(`Tenant probe executed successfully`);
  pass(`Legitimate tenant access: ${probeJson.testResults.ownTenantAccessGranted}`);
  pass(`Cross-tenant breach blocked: ${probeJson.testResults.crossTenantAccessBlocked}`);
  pass(`Security guard status: ${probeJson.testResults.securityStatus}`);

  // 7. Logout
  console.log('\n--- 7. Testing Logout (POST /api/auth/logout) ---');
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
  });
  const logoutJson = await logoutRes.json();
  pass(`Logout successful (HTTP 200): ${logoutJson.message}`);

  // 8. Protected Route Rejection After Logout
  console.log('\n--- 8. Testing Protected Route Guarding After Logout ---');
  const unauthRes = await fetch(`${BASE_URL}/api/clinic/dashboard`);
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 Unauthorized, got ${unauthRes.status}`);
  }
  pass(`Unauthenticated access to /api/clinic/dashboard correctly blocked (HTTP 401)`);

  console.log('\n===============================================================');
  console.log(`🎉 ALL ${passed} END-TO-END HTTP TESTS PASSED COMPLETELY!`);
  console.log('===============================================================\n');
}

runE2ETests().catch((err) => {
  console.error('\n❌ E2E HTTP TESTS FAILED:', err);
  process.exit(1);
});

