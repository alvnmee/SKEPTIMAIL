// Function: login
function login() {
  const isLogin = authMode === 'login';
  document.querySelector('#app').innerHTML =
    '<main class="auth auth-light"><div class="auth-top"><div class="auth-logo"><span>◇</span><div><b>PhishGuard</b><small>CYBER DEFENSE EDUCATION</small></div></div></div>' +
    '<section class="auth-card auth-wide"><div class="auth-heading"><p class="eyebrow">' + (isLogin ? 'AKSES PLATFORM' : 'MULAI BELAJAR DENGAN AMAN') + '</p>' +
    '<h1>' + (isLogin ? 'Masuk ke PhishGuard' : 'Daftar Akun PhishGuard') + '</h1><p>' +
    (isLogin ? 'Masuk menggunakan ID pengguna atau email yang Anda daftarkan.' : 'Buat akun lokal untuk menyimpan progres latihan pada browser ini.') +
    '</p></div>' + (isLogin ? '' :
      '<div class="account-switch" role="tablist"><button type="button" class="' + (signupType === 'individual' ? 'active' : '') + '" data-kind="individual">Untuk Individu & Publik</button>' +
      '<button type="button" class="' + (signupType === 'company' ? 'active' : '') + '" data-kind="company">Untuk Perusahaan</button></div>') +
    '<div id="form"></div></section><p class="auth-safe">Akun dan progres disimpan hanya di browser/perangkat ini. Jangan gunakan kata sandi akun penting.</p></main>';
  form(isLogin ? 'login' : signupType);
  document.querySelectorAll('[data-kind]').forEach(button => button.addEventListener('click', () => {
    captureRegistrationDraft(signupType);
    signupType = button.dataset.kind;
    login();
  }));
}


// Function: employeeTargetRowMarkup
function employeeTargetRowMarkup(contact) {
  const row = contact || {};
  const rowId = ++employeeTargetRowId;
  return '<tr class="employee-target-row" data-row-id="' + rowId + '">' +
    '<td data-label="Nama Karyawan"><input name="employeeName" data-employee-field="name" aria-label="Nama Karyawan" aria-describedby="employee-name-error-' + rowId + '" maxlength="100" value="' + esc(row.name || '') + '"><small class="field-error" id="employee-name-error-' + rowId + '" data-row-error="name" aria-live="polite"></small></td>' +
    '<td data-label="Email Kantor"><input name="employeeEmail" data-employee-field="email" type="email" aria-label="Email Kantor" aria-describedby="employee-email-error-' + rowId + '" placeholder="nama@organisasi.example" value="' + esc(row.email || '') + '"><small class="field-error" id="employee-email-error-' + rowId + '" data-row-error="email" aria-live="polite"></small></td>' +
    '<td data-label="Nomor WhatsApp"><input name="employeePhone" data-employee-field="phone" type="tel" aria-label="Nomor WhatsApp" aria-describedby="employee-phone-error-' + rowId + '" placeholder="+62 812-3456-7890" value="' + esc(row.phone || '') + '"><small class="field-error" id="employee-phone-error-' + rowId + '" data-row-error="phone" aria-live="polite"></small></td>' +
    '<td data-label="Divisi"><input name="employeeDivision" data-employee-field="division" aria-label="Divisi" maxlength="100" value="' + esc(row.division || '') + '"></td>' +
    '<td data-label="Aksi"><button class="ghost target-remove-row" type="button" data-target-action="remove-employee">Hapus</button></td></tr>';
}


// Function: captureRegistrationDraft
function captureRegistrationDraft(type) {
  const formElement = document.querySelector('#authForm');
  if (!formElement || formElement.dataset.mode !== 'register' || !['individual', 'company'].includes(type)) return;
  const fields = {};
  formElement.querySelectorAll('input[name],select[name]').forEach(input => {
    if (input.name === 'targetPlatforms') {
      if (!fields.targetPlatforms) fields.targetPlatforms = [];
      if (input.checked) fields.targetPlatforms.push(input.value);
    } else if (!input.name.startsWith('employee')) {
      fields[input.name] = input.type === 'checkbox' ? input.checked : input.value;
    }
  });
  const employees = [...formElement.querySelectorAll('.employee-target-row')].map(row => ({
    name: row.querySelector('[data-employee-field="name"]').value,
    email: row.querySelector('[data-employee-field="email"]').value,
    phone: row.querySelector('[data-employee-field="phone"]').value,
    division: row.querySelector('[data-employee-field="division"]').value
  }));
  registrationDrafts[type] = { fields: fields, employees: employees };
}


// Function: restoreRegistrationDraft
function restoreRegistrationDraft(formElement, type) {
  const draft = registrationDrafts[type];
  if (!draft) return;
  Object.entries(draft.fields || {}).forEach(([name, value]) => {
    if (name === 'targetPlatforms') {
      formElement.querySelectorAll('[name="targetPlatforms"]').forEach(input => { input.checked = value.includes(input.value); });
      return;
    }
    const input = [...formElement.querySelectorAll('[name]')].find(field => field.name === name);
    if (input) {
      if (input.type === 'checkbox') input.checked = Boolean(value);
      else input.value = value;
    }
  });
  if (type === 'company' && draft.employees && draft.employees.length) {
    formElement.querySelector('[data-employee-rows]').innerHTML = draft.employees.map(employeeTargetRowMarkup).join('');
  }
}


// Function: updateTargetRequirements
function updateTargetRequirements(formElement) {
  if (!formElement) return;
  const platforms = [...formElement.querySelectorAll('[name="targetPlatforms"]:checked')].map(input => input.value);
  const email = formElement.querySelector('[name="targetEmail"]');
  const phone = formElement.querySelector('[name="targetPhone"]');
  if (email) {
    email.required = platforms.includes('Email');
    email.setAttribute('aria-required', String(email.required));
  }
  if (phone) {
    phone.required = platforms.includes('WhatsApp') || platforms.includes('SMS');
    phone.setAttribute('aria-required', String(phone.required));
  }
}


// Function: targetConfigurationMarkup
function targetConfigurationMarkup(company) {
  const heading = company ? 'Konfigurasi Target Simulasi Perusahaan' : 'Konfigurasi Target Simulasi';
  const authorization = company
    ? 'Saya menyatakan bahwa organisasi saya memiliki kewenangan dan persetujuan yang diperlukan untuk menjalankan simulasi terhadap kontak yang didaftarkan.'
    : 'Saya menyatakan bahwa saya memiliki izin yang sah untuk menggunakan kontak target tersebut dalam simulasi pelatihan phishing dan edukasi keamanan siber.';
  return '<section class="target-config" aria-labelledby="target-config-title"><header class="target-config-heading"><div><p class="eyebrow">PENGATURAN LATIHAN</p><h2 id="target-config-title">' + heading + '</h2><p>Atur target untuk latihan simulasi phishing yang terotorisasi.</p></div></header>' +
    '<div class="form-grid target-fields-grid"><label class="field">Alamat Email Target Simulasi <em>* jika Email dipilih</em><input name="targetEmail" type="email" autocomplete="off" placeholder="nama@email.com" aria-describedby="target-email-hint target-email-error"><small class="field-hint" id="target-email-hint">Wajib diisi jika platform Email dipilih.</small><small class="field-error" id="target-email-error" data-error-for="targetEmail" aria-live="polite"></small></label>' +
    '<label class="field">Nomor WhatsApp / SMS Target Simulasi <em>* jika WhatsApp atau SMS dipilih</em><input name="targetPhone" type="tel" autocomplete="off" inputmode="tel" placeholder="+62 812-3456-7890" aria-describedby="target-phone-hint target-phone-error"><small class="field-hint" id="target-phone-hint">Gunakan format internasional, misalnya +62 812-3456-7890.</small><small class="field-error" id="target-phone-error" data-error-for="targetPhone" aria-live="polite"></small></label></div>' +
    '<fieldset class="target-platforms" aria-describedby="target-platform-error"><legend>Platform Simulasi <em>*</em></legend><div class="target-platform-list">' +
    ['WhatsApp', 'Email', 'SMS'].map(platform => '<label><input type="checkbox" name="targetPlatforms" value="' + platform + '"><span>' + platform + '</span></label>').join('') +
    '</div><small class="field-error" id="target-platform-error" data-error-for="targetPlatforms" aria-live="polite"></small></fieldset>' +
    (company ? '<div class="employee-targets"><div class="employee-targets-heading"><div><h3>Daftar Kontak &amp; Divisi Karyawan</h3><p>Tambahkan kontak yang akan menjadi target. Bagian ini opsional jika Anda hanya memakai satu target di atas.</p></div><button class="ghost target-add-row" type="button" data-target-action="add-employee">+ Tambah Baris Karyawan</button></div>' +
      '<p class="field-hint employee-authorization-note">Jika daftar ini digunakan, pastikan otorisasi yang sah mencakup setiap kontak yang didaftarkan.</p><div class="target-contact-scroll" role="region" aria-label="Daftar kontak dan divisi karyawan" tabindex="0"><table class="target-contact-table"><thead><tr><th>Nama Karyawan</th><th>Email Kantor</th><th>Nomor WhatsApp</th><th>Divisi</th><th>Aksi</th></tr></thead><tbody data-employee-rows>' + employeeTargetRowMarkup() + '</tbody></table></div>' +
      '</div>' : '') +
    '<label class="consent target-authorization"><input name="targetAuthorization" type="checkbox" value="yes" aria-describedby="target-authorization-error"> <span>' + authorization + '</span></label>' +
    '<small class="field-error target-authorization-error" id="target-authorization-error" data-error-for="targetAuthorization" aria-live="polite"></small>' +
    '</section>';
}


// Function: authSwitchText
function authSwitchText() {
  return authMode === 'login'
    ? 'Belum punya akun? <button type="button" class="auth-inline-link" id="auth-switch">Daftar akun</button>'
    : 'Sudah punya akun? <button type="button" class="auth-inline-link" id="auth-switch">Masuk</button>';
}


// Function: form
function form(type) {
  const container = document.querySelector('#form');
  const switchText = authSwitchText();
  if (type === 'login') {
    container.innerHTML =
      '<form id="authForm" class="auth-form compact">' +
      '<label class="field">ID pengguna atau alamat email<input name="identifier" autocomplete="username" required placeholder="contoh: namaanda"></label>' +
      '<label class="field">Kata sandi<input name="password" type="password" autocomplete="current-password" required placeholder="Kata sandi akun"></label>' +
      '<button class="primary auth-cta">Masuk ke dashboard</button><div class="feedback" id="formmsg" aria-live="polite">' + esc(accountMessage) + '</div>' +
      '<p class="auth-form-switch">' + switchText + '</p></form>';
  } else {
    const company = type === 'company';
    const organizationFields = company
      ? '<label class="field">Nama perusahaan / organisasi <em>*</em><input name="companyName" required minlength="2" placeholder="Nama organisasi"><small class="field-error" data-error-for="companyName" aria-live="polite"></small></label>' +
        '<label class="field">Nama kontak penanggung jawab <em>*</em><input name="contactName" required placeholder="Nama kontak"><small class="field-error" data-error-for="contactName" aria-live="polite"></small></label>' +
        '<label class="field">Domain perusahaan (opsional)<input name="domain" placeholder="organisasi.example"></label>' +
        '<label class="field">Sektor industri<select name="industry"><option>Teknologi</option><option>Keuangan</option><option>Pendidikan</option><option>Kesehatan</option><option>Lainnya</option></select></label>' +
        '<label class="field">Jumlah karyawan target <em>*</em><input name="size" type="number" min="1" required placeholder="Contoh: 150"><small class="field-error" data-error-for="size" aria-live="polite"></small></label>'
      : '<label class="field full">Nama lengkap <em>*</em><input name="displayName" required minlength="2" placeholder="Nama tampilan Anda"><small class="field-error" data-error-for="displayName" aria-live="polite"></small></label>';
    container.innerHTML =
      '<form id="authForm" class="auth-form" data-mode="register" novalidate>' + (company ? '<div class="notice">Akun perusahaan dibuat terpisah dari akun individu. Data organisasi hanya tersimpan pada akun ini di browser yang sama.</div>' : '') +
      '<div class="form-grid">' + organizationFields +
      '<label class="field">ID pengguna <em>*</em><input name="username" required minlength="3" maxlength="32" pattern="[A-Za-z0-9][A-Za-z0-9._\\x2d]{2,31}" autocomplete="username" placeholder="huruf, angka, titik, _ atau -"><small class="field-error" data-error-for="username" aria-live="polite"></small></label>' +
      '<label class="field">Alamat email <em>*</em><input name="email" type="email" autocomplete="email" required placeholder="nama@email.com"><small class="field-error" data-error-for="email" aria-live="polite"></small></label>' +
      '</div><label class="field full">Kata sandi <em>*</em><input name="password" type="password" autocomplete="new-password" minlength="8" required placeholder="Minimal 8 karakter"><small class="field-error" data-error-for="password" aria-live="polite"></small></label>' +
      targetConfigurationMarkup(company) +
      '<label class="consent"><input name="consent" type="checkbox" required aria-describedby="account-consent-error"> <span>Saya memahami bahwa ini adalah prototype lokal dan tidak mengirim simulasi kepada siapa pun.</span></label><small class="field-error" id="account-consent-error" data-error-for="consent" aria-live="polite"></small>' +
      '<button class="primary auth-cta" type="submit">' + (company ? 'Buat akun perusahaan' : 'Buat akun & mulai belajar') + '</button>' +
      '<div class="feedback" id="formmsg" aria-live="polite"></div><p class="auth-form-switch">' + switchText + '</p></form>';
  }
  const formElement = document.querySelector('#authForm');
  if (type !== 'login') {
    restoreRegistrationDraft(formElement, type);
    updateTargetRequirements(formElement);
    formElement.addEventListener('change', event => {
      if (event.target.name === 'targetPlatforms') {
        updateTargetRequirements(formElement);
        if (formElement.querySelector('[name="targetPlatforms"]:checked')) {
          const error = formElement.querySelector('[data-error-for="targetPlatforms"]');
          if (error) error.textContent = '';
          formElement.querySelectorAll('[name="targetPlatforms"]').forEach(input => input.removeAttribute('aria-invalid'));
        }
      }
    });
    formElement.addEventListener('input', event => {
      const input = event.target;
      const error = input.name && formElement.querySelector('[data-error-for="' + input.name + '"]');
      if (error) error.textContent = '';
      input.removeAttribute('aria-invalid');
      if (input.dataset.employeeField) {
        const rowError = input.closest('td').querySelector('[data-row-error="' + input.dataset.employeeField + '"]');
        if (rowError) rowError.textContent = '';
      }
    });
    formElement.addEventListener('click', event => {
      const action = event.target.closest('[data-target-action]');
      if (!action) return;
      if (action.dataset.targetAction === 'add-employee') {
        const rows = formElement.querySelector('[data-employee-rows]');
        if (rows) rows.insertAdjacentHTML('beforeend', employeeTargetRowMarkup());
      }
      if (action.dataset.targetAction === 'remove-employee') action.closest('.employee-target-row').remove();
    });
  }
  document.querySelector('#auth-switch').addEventListener('click', () => {
    if (authMode === 'register') captureRegistrationDraft(signupType);
    authMode = authMode === 'login' ? 'register' : 'login';
    accountMessage = '';
    login();
  });
  formElement.addEventListener('submit', event => {
    event.preventDefault();
    submitAccountForm(event.currentTarget, type);
  });
}


// Function: showFormError
function showFormError(message) {
  const messageElement = document.querySelector('#formmsg');
  if (messageElement) messageElement.textContent = message;
}


// Function: clearRegistrationErrors
function clearRegistrationErrors(formElement) {
  formElement.querySelectorAll('[data-error-for]').forEach(error => { error.textContent = ''; });
  formElement.querySelectorAll('[aria-invalid="true"]').forEach(input => input.removeAttribute('aria-invalid'));
  formElement.querySelectorAll('[data-row-error]').forEach(error => { error.textContent = ''; });
}


// Function: setRegistrationFieldError
function setRegistrationFieldError(formElement, name, message) {
  const error = formElement.querySelector('[data-error-for="' + name + '"]');
  if (error) error.textContent = message;
  formElement.querySelectorAll('[name="' + name + '"]').forEach(input => input.setAttribute('aria-invalid', 'true'));
}


// Function: validEmailAddress
function validEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}


// Function: validInternationalPhone
function validInternationalPhone(value) {
  return /^\+[1-9]\d{7,14}$/.test(String(value || '').replace(/[\s()-]/g, ''));
}


// Function: readRegistrationTargets
function readRegistrationTargets(formElement, type) {
  const platforms = [...formElement.querySelectorAll('[name="targetPlatforms"]:checked')].map(input => input.value);
  const targets = {
    email: String(formElement.querySelector('[name="targetEmail"]').value || '').trim().toLowerCase(),
    phone: String(formElement.querySelector('[name="targetPhone"]').value || '').trim()
  };
  const result = {
    scope: type === 'company' ? 'company' : 'individual',
    platforms: platforms,
    targets: targets,
    authorized: Boolean(formElement.querySelector('[name="targetAuthorization"]').checked)
  };
  if (type === 'company') {
    result.employeeContacts = [...formElement.querySelectorAll('.employee-target-row')].map(row => ({
      name: row.querySelector('[data-employee-field="name"]').value.trim(),
      email: row.querySelector('[data-employee-field="email"]').value.trim().toLowerCase(),
      phone: row.querySelector('[data-employee-field="phone"]').value.trim(),
      division: row.querySelector('[data-employee-field="division"]').value.trim()
    })).filter(contact => contact.name || contact.email || contact.phone || contact.division);
  }
  return result;
}


// Function: validateRegistrationForm
function validateRegistrationForm(formElement, type, fields, targets) {
  clearRegistrationErrors(formElement);
  let valid = true;


  // Function: fail
  const fail = (name, message) => { setRegistrationFieldError(formElement, name, message); valid = false; };
  if (type === 'company') {
    if (String(fields.companyName || '').trim().length < 2) fail('companyName', 'Masukkan nama organisasi minimal 2 karakter.');
    if (!String(fields.contactName || '').trim()) fail('contactName', 'Masukkan nama kontak penanggung jawab.');
    const size = Number(fields.size);
    if (!Number.isInteger(size) || size < 1) fail('size', 'Masukkan jumlah karyawan berupa bilangan minimal 1.');
  } else if (String(fields.displayName || '').trim().length < 2) {
    fail('displayName', 'Masukkan nama lengkap minimal 2 karakter.');
  }
  const username = normalizeUsername(fields.username);
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) fail('username', 'ID pengguna harus 3–32 karakter: huruf, angka, titik, garis bawah, atau tanda hubung.');
  if (!validEmailAddress(fields.email)) fail('email', 'Masukkan alamat email akun dengan format yang benar.');
  if (String(fields.password || '').length < 8) fail('password', 'Kata sandi harus memiliki minimal 8 karakter.');
  if (!formElement.querySelector('[name="consent"]').checked) fail('consent', 'Centang pernyataan penggunaan prototype lokal untuk melanjutkan.');

  if (!targets.platforms.length) fail('targetPlatforms', 'Pilih minimal satu platform simulasi.');
  if (targets.platforms.includes('Email') && !targets.targets.email) {
    fail('targetEmail', 'Alamat email target wajib diisi karena platform Email dipilih.');
  } else if (targets.targets.email && !validEmailAddress(targets.targets.email)) {
    fail('targetEmail', 'Masukkan alamat email target dengan format yang benar.');
  }
  const needsPhone = targets.platforms.includes('WhatsApp') || targets.platforms.includes('SMS');
  if (needsPhone && !targets.targets.phone) {
    fail('targetPhone', 'Nomor target wajib diisi karena WhatsApp atau SMS dipilih.');
  } else if (targets.targets.phone && !validInternationalPhone(targets.targets.phone)) {
    fail('targetPhone', 'Gunakan format internasional, misalnya +62 812-3456-7890.');
  }
  if (!targets.authorized) fail('targetAuthorization', 'Persetujuan otorisasi wajib dicentang sebelum registrasi.');

  if (type === 'company') {
    formElement.querySelectorAll('.employee-target-row').forEach(row => {
      const values = {
        name: row.querySelector('[data-employee-field="name"]').value.trim(),
        email: row.querySelector('[data-employee-field="email"]').value.trim(),
        phone: row.querySelector('[data-employee-field="phone"]').value.trim(),
        division: row.querySelector('[data-employee-field="division"]').value.trim()
      };
      const used = Object.values(values).some(Boolean);


      // Function: rowFail
      const rowFail = (key, message) => {
        const input = row.querySelector('[data-employee-field="' + key + '"]');
        const error = row.querySelector('[data-row-error="' + key + '"]');
        if (input) input.setAttribute('aria-invalid', 'true');
        if (error) error.textContent = message;
        valid = false;
      };
      if (used && !values.name) rowFail('name', 'Masukkan nama untuk baris kontak ini.');
      if (values.email && !validEmailAddress(values.email)) rowFail('email', 'Format email kantor belum benar.');
      if (values.phone && !validInternationalPhone(values.phone)) rowFail('phone', 'Gunakan nomor internasional, misalnya +62 812-3456-7890.');
    });
  }
  if (!valid) {
    const invalid = formElement.querySelector('[aria-invalid="true"]');
    if (invalid) invalid.focus({ preventScroll: true });
  }
  return valid;
}


// Function: submitAccountForm
function submitAccountForm(formElement, type) {
  const fields = Object.fromEntries(new FormData(formElement));
  if (type === 'login') {
    const identifier = String(fields.identifier || '').trim().toLowerCase();
    const account = identifier.includes('@')
      ? accounts.find(item => item.email === identifier)
      : accounts.find(item => item.id === normalizeUsername(identifier) || item.username === normalizeUsername(identifier));
    if (!account) {
      showFormError('Akun tidak ditemukan. Periksa ID/email atau daftar menggunakan ID baru.');
      return;
    }
    if (account.needsPassword) {
      if (String(fields.password || '').length < 8) {
        showFormError('Akun lama dan progresnya ditemukan. Buat kata sandi lokal minimal 8 karakter untuk mengaktifkan login berikutnya.');
        return;
      }
      account.password = String(fields.password);
      account.needsPassword = false;
      persistAccounts();
    } else if (account.password !== String(fields.password || '')) {
      showFormError('Kata sandi tidak cocok dengan akun ini.');
      return;
    }
    openAccount(account);
    return;
  }
  const targets = readRegistrationTargets(formElement, type);
  if (!validateRegistrationForm(formElement, type, fields, targets)) return;
  const username = normalizeUsername(fields.username);
  const email = String(fields.email || '').trim().toLowerCase();
  if (accounts.some(item => item.username === username || item.id === username)) {
    setRegistrationFieldError(formElement, 'username', 'ID pengguna tersebut sudah terdaftar. Pilih ID lain.');
    formElement.querySelector('[name="username"]').focus({ preventScroll: true });
    return;
  }
  if (accounts.some(item => item.email && item.email === email)) {
    setRegistrationFieldError(formElement, 'email', 'Email tersebut sudah terhubung ke akun lain.');
    formElement.querySelector('[name="email"]').focus({ preventScroll: true });
    return;
  }
  const company = type === 'company';
  const createdAt = new Date().toISOString();
  const account = normalizedAccount({
    id: username,
    username: username,
    displayName: company ? String(fields.companyName).trim() : String(fields.displayName).trim(),
    email: email,
    password: String(fields.password),
    needsPassword: false,
    role: company ? 'company' : 'individual',
    company: company ? {
      name: String(fields.companyName).trim(),
      contactName: String(fields.contactName).trim(),
      domain: String(fields.domain || '').trim(),
      industry: String(fields.industry || ''),
      targetSize: Math.max(1, Number(fields.size) || 1)
    } : null,
    simulationTargets: targets,
    createdAt: createdAt,
    progress: createProgress()
  });
  accounts.push(account);
  persistAccounts();
  registrationDrafts[type] = null;
  accountMessage = 'Akun berhasil dibuat dan disimpan di browser ini.';
  openAccount(account);
}


// Function: openAccount
function openAccount(account) {
  currentAccount = account;
  currentAccount.progress = createProgress(account.progress);
  currentAccount.subscription = normalizeSubscription(account.subscription, currentAccount);
  state = currentAccount.progress;
  role = currentAccount.role;
  planMessage = '';
  companyMessage = '';
  showEmployeeForm = false;
  trainingEmployeeId = '';
  localStorage.setItem(SESSION_KEY, currentAccount.id);
  accountMessage = '';
  view = role === 'company' ? 'company' : 'dashboard';
  app();
}
