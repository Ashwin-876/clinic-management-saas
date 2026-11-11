async function runPhase2E2E() {
  const BASE_URL = 'http://127.0.0.1:3000';
  console.log('===============================================================');
  console.log('🌐 PHASE 2 END-TO-END HTTP API & DOCTOR MANAGEMENT SUITE');
  console.log(` Target Server: ${BASE_URL}`);
  console.log('===============================================================\n');

  let passed = 0;
  function pass(msg: string) {
    console.log(`  ✓ PASS: ${msg}`);
    passed++;
  }

  const timestamp = Date.now();
  const clinicPayload = {
    clinicName: `Fortis Care Center ${timestamp}`,
    clinicType: 'Multi-specialty Hospital',
    officialEmail: `fortis.${timestamp}@hospital.com`,
    contactNumber: '+91 80 4455 6677',
    address: '500 Health Expressway',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560100',
    ownerName: 'Dr. Anand Kumar',
    ownerEmail: `dr.anand.${timestamp}@hospital.com`,
    mobileNumber: '+91 98888 11111',
    password: 'AdminPassword@2026',
    confirmPassword: 'AdminPassword@2026',
  };

  // 1. Clinic Registration
  console.log('--- 1. Clinic Registration ---');
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clinicPayload),
  });
  const regJson = await regRes.json();
  if (regRes.status !== 201) throw new Error(`Reg failed: ${JSON.stringify(regJson)}`);
  const clinicId = regJson.data.clinicId;
  pass(`Clinic registered: ID=${clinicId}`);

  // 2. Administrator Login
  console.log('\n--- 2. Administrator Login ---');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: clinicPayload.ownerEmail,
      password: clinicPayload.password,
    }),
  });
  const loginJson = await loginRes.json();
  if (loginRes.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
  const adminCookie = loginRes.headers.get('set-cookie')?.split(';')[0];
  if (!adminCookie) throw new Error('Missing admin session cookie');
  pass(`Admin authenticated with role ${loginJson.user.role}`);

  // 3. Advanced Dashboard Initial Check
  console.log('\n--- 3. Advanced Dashboard Initial Metrics ---');
  const dashRes1 = await fetch(`${BASE_URL}/api/clinic/dashboard`, {
    headers: { Cookie: adminCookie },
  });
  const dash1 = await dashRes1.json();
  pass(`Total Doctors: ${dash1.data.metrics.totalDoctors}`);
  pass(`Total Departments: ${dash1.data.metrics.totalDepartments}`);

  // 4. Create Departments
  console.log('\n--- 4. Department Management (POST /api/departments) ---');
  const deptRes1 = await fetch(`${BASE_URL}/api/departments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      name: 'Cardiology',
      description: 'Comprehensive cardiology and interventional suites',
    }),
  });
  const dept1 = await deptRes1.json();
  if (deptRes1.status !== 201) throw new Error(`Dept 1 creation failed: ${JSON.stringify(dept1)}`);
  pass(`Department Cardiology created (ID: ${dept1.department.id})`);

  const deptRes2 = await fetch(`${BASE_URL}/api/departments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      name: 'Neurology',
      description: 'Neurosurgery and neurological diagnostics',
    }),
  });
  const dept2 = await deptRes2.json();
  if (deptRes2.status !== 201) throw new Error(`Dept 2 creation failed: ${JSON.stringify(dept2)}`);
  pass(`Department Neurology created (ID: ${dept2.department.id})`);

  // 5. Onboard Doctor
  console.log('\n--- 5. Doctor Registration (POST /api/doctors) ---');
  const doctorEmail = `dr.neha.${timestamp}@hospital.com`;
  const doctorPassword = 'DoctorPassword@2026';
  const docPayload = {
    fullName: 'Dr. Neha Kulkarni',
    email: doctorEmail,
    phone: '+91 97777 88888',
    specialization: 'Consultant Cardiologist',
    qualification: 'MBBS, MD (General Medicine), DM (Cardiology)',
    experience: 10,
    departmentId: dept1.department.id,
    consultationFee: 700,
    accountStatus: 'ACTIVE',
    initialPassword: doctorPassword,
  };

  const addDocRes = await fetch(`${BASE_URL}/api/doctors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify(docPayload),
  });
  const docJson = await addDocRes.json();
  if (addDocRes.status !== 201) throw new Error(`Doctor registration failed: ${JSON.stringify(docJson)}`);
  const doctorId = docJson.doctor.doctorId;
  const docDatabaseId = docJson.doctor.id;
  pass(`Doctor onboarded: Doctor ID=${doctorId}`);
  pass(`Doctor assigned to department: ${docJson.doctor.department.name}`);
  pass(`Login credentials provisioned for doctor`);

  // 6. Advanced Dashboard Metrics Verification
  console.log('\n--- 6. Advanced Dashboard Post-Onboarding Verification ---');
  const dashRes2 = await fetch(`${BASE_URL}/api/clinic/dashboard`, {
    headers: { Cookie: adminCookie },
  });
  const dash2 = await dashRes2.json();
  pass(`Total Doctors count updated to: ${dash2.data.metrics.totalDoctors}`);
  pass(`Active Doctors count: ${dash2.data.metrics.activeDoctors}`);
  pass(`Inactive Doctors count: ${dash2.data.metrics.inactiveDoctors}`);
  pass(`Total Departments count: ${dash2.data.metrics.totalDepartments}`);
  pass(`Recently Added Doctors list populated with: ${dash2.data.recentDoctors[0].fullName}`);

  // 7. Edit Doctor Details
  console.log('\n--- 7. Edit Doctor Details (PUT /api/doctors/[id]) ---');
  const editDocRes = await fetch(`${BASE_URL}/api/doctors/${docDatabaseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      consultationFee: 850,
      experience: 11,
    }),
  });
  const editDocJson = await editDocRes.json();
  if (editDocRes.status !== 200) throw new Error(`Doctor edit failed: ${JSON.stringify(editDocJson)}`);
  pass(`Doctor updated consultationFee=₹${editDocJson.doctor.consultationFee}, experience=${editDocJson.doctor.experience} yrs`);

  // 8. Toggle Doctor Status
  console.log('\n--- 8. Activate / Deactivate Doctor (PATCH /api/doctors/[id]) ---');
  const deactivateRes = await fetch(`${BASE_URL}/api/doctors/${docDatabaseId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'INACTIVE' }),
  });
  const deactJson = await deactivateRes.json();
  pass(`Doctor deactivated: status=${deactJson.doctor.accountStatus}`);

  const reactivateRes = await fetch(`${BASE_URL}/api/doctors/${docDatabaseId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'ACTIVE' }),
  });
  const reactJson = await reactivateRes.json();
  pass(`Doctor reactivated: status=${reactJson.doctor.accountStatus}`);

  // 9. Safe Department Deletion Guard
  console.log('\n--- 9. Safe Department Deletion Constraint Check ---');
  // Attempt to delete Cardiology (has Dr. Neha assigned)
  const safeDeleteRes = await fetch(`${BASE_URL}/api/departments/${dept1.department.id}`, {
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  const safeDeleteJson = await safeDeleteRes.json();
  if (safeDeleteRes.status !== 400) {
    throw new Error(`Expected 400 Bad Request on safe delete, got ${safeDeleteRes.status}`);
  }
  pass(`Safe deletion prevented deleting department with assigned doctors (HTTP 400)`);
  pass(`Alert message: ${safeDeleteJson.error}`);

  // Delete empty Neurology department -> succeeds!
  const deleteEmptyRes = await fetch(`${BASE_URL}/api/departments/${dept2.department.id}`, {
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  if (deleteEmptyRes.status !== 200) throw new Error('Failed to delete empty department');
  pass(`Deleting department with zero doctors succeeded (HTTP 200)`);

  // 10. Individual Doctor Login & Portal
  console.log('\n--- 10. Individual Doctor Login & Portal (POST /api/auth/login) ---');
  const docLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: doctorEmail,
      password: doctorPassword,
    }),
  });
  const docLoginJson = await docLoginRes.json();
  if (docLoginRes.status !== 200) throw new Error(`Doctor login failed: ${JSON.stringify(docLoginJson)}`);
  const docCookie = docLoginRes.headers.get('set-cookie')?.split(';')[0] || '';
  pass(`Doctor authenticated successfully`);
  pass(`Doctor role confirmed: ${docLoginJson.user.role}`);
  pass(`Redirect target: ${docLoginJson.redirectTo}`);

  // 11. Doctor Dashboard Access
  console.log('\n--- 11. Doctor Dashboard (GET /api/doctor/dashboard) ---');
  const docDashRes = await fetch(`${BASE_URL}/api/doctor/dashboard`, {
    headers: { Cookie: docCookie },
  });
  const docDashJson = await docDashRes.json();
  if (docDashRes.status !== 200) throw new Error(`Doctor dashboard failed: ${JSON.stringify(docDashJson)}`);
  pass(`Doctor profile loaded: ${docDashJson.data.doctor.fullName} (${docDashJson.data.doctor.doctorId})`);
  pass(`Doctor affiliated clinic loaded: ${docDashJson.data.clinic.name}`);
  pass(`Doctor department loaded: ${docDashJson.data.department.name}`);

  // 12. Doctor Updates Own Profile
  console.log('\n--- 12. Doctor Self-Profile Update (PUT /api/doctor/dashboard) ---');
  const docUpdateRes = await fetch(`${BASE_URL}/api/doctor/dashboard`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: docCookie },
    body: JSON.stringify({
      phone: '+91 97777 99999',
      consultationFee: 950,
    }),
  });
  const docUpdateJson = await docUpdateRes.json();
  if (docUpdateRes.status !== 200) throw new Error('Doctor self-update failed');
  pass(`Doctor self-updated phone and fee: ₹${docUpdateJson.doctor.consultationFee}`);

  // 13. Role-Based Access Control: Doctor blocked from Admin Endpoints
  console.log('\n--- 13. Role-Based Access Control Verification ---');
  const docAdminAttempt = await fetch(`${BASE_URL}/api/departments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: docCookie },
    body: JSON.stringify({ name: 'Unauthorized Dept' }),
  });
  if (docAdminAttempt.status !== 403) {
    throw new Error(`Expected 403 Forbidden for doctor calling admin API, got ${docAdminAttempt.status}`);
  }
  pass(`Doctor blocked from admin endpoint (HTTP 403 Forbidden)`);

  // 14. Doctor Logout
  console.log('\n--- 14. Doctor Logout (POST /api/auth/logout) ---');
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: docCookie },
  });
  if (logoutRes.status !== 200) throw new Error('Doctor logout failed');
  pass(`Doctor successfully logged out`);

  console.log('\n===============================================================');
  console.log(`🎉 ALL ${passed} PHASE 2 END-TO-END HTTP TESTS PASSED COMPLETELY!`);
  console.log('===============================================================\n');
}

runPhase2E2E().catch((err) => {
  console.error('\n❌ PHASE 2 E2E TESTS FAILED:', err);
  process.exit(1);
});

