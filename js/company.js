// Company workspace rendering and local management handlers.

// Function: company
function company(page) {
  if (!currentAccount || currentAccount.role !== 'company') {
    page.innerHTML = '<section class="card locked-feature"><h2>Dashboard organisasi khusus akun perusahaan</h2><p class="muted">Buat akun perusahaan melalui alur registrasi untuk mengelola workspace organisasi.</p><button class="primary" data-plan-action="company-registration">Buat akun perusahaan</button></section>';
    return;
  }
  const organization = companyWorkspace();
  if (!hasAccess('company-dashboard')) {
    page.innerHTML = '<section class="card company-gate"><span class="eyebrow">AKUN PERUSAHAAN</span><h2>' + safeText(organization.name || currentAccount.displayName) + '</h2>' +
      '<p class="muted">Dashboard, data karyawan, dan laporan hanya aktif setelah Company Plan disimulasikan untuk organisasi ini. Tidak ada data perusahaan contoh yang dipakai.</p>' +
      packageStatusMarkup() + '<button class="primary" data-open-plan>Aktifkan Company Plan</button></section>';
    return;
  }
  const employees = organization.employees;
  const results = employees.flatMap(employee => employee.results);
  const rightAnswers = results.filter(result => result.correct).length;
  const accuracyRate = results.length ? Math.round(rightAnswers / results.length * 100) : null;
  const vulnerability = results.length ? 100 - accuracyRate : null;
  const completedEmployees = employees.filter(employee => employee.results.length > 0).length;
  const missedByCategory = {};
  results.filter(result => !result.correct).forEach(result => { missedByCategory[result.category] = (missedByCategory[result.category] || 0) + 1; });
  const categoryRows = Object.entries(missedByCategory).sort((a, b) => b[1] - a[1]);
  const departments = [...new Set(employees.map(employee => employee.department))].sort();
  const departmentRows = departments.length ? departments.map(department => {
    const group = employees.filter(employee => employee.department === department).flatMap(employee => employee.results);
    const misses = group.filter(result => !result.correct).length;
    const rate = group.length ? Math.round(misses / group.length * 100) : null;
    return '<tr><td>' + safeText(department) + '</td><td>' + group.length + '</td><td>' + (rate === null ? 'Belum ada hasil' : rate + '%') + '</td></tr>';
  }).join('') : '<tr><td colspan="3" class="muted">Tambahkan karyawan untuk memulai ringkasan departemen.</td></tr>';
  const employeeRows = employees.length ? employees.map(employee => {
    const total = employee.results.length;
    const correct = employee.results.filter(result => result.correct).length;
    const latest = employee.results[0];
    const trainingForm = trainingEmployeeId === employee.id ? '<form class="employee-training-form" data-company-form="training" data-employee-id="' + esc(employee.id) + '">' +
      '<label class="field">Kategori latihan<select name="category" required>' + [...new Set(scenarioBank.map(item => item.category))].map(category => '<option>' + safeText(category) + '</option>').join('') + '</select></label>' +
      '<label class="field">Hasil evaluasi lokal<select name="correct" required><option value="true">Tepat mengenali indikator</option><option value="false">Belum tepat</option></select></label>' +
      '<div class="employee-form-actions"><button class="primary" type="submit">Simpan hasil lokal</button><button class="ghost" type="button" data-company-action="cancel-training">Batal</button></div></form>' : '';
    return '<tr><td><b>' + safeText(employee.name) + '</b><br><small class="muted">ID ' + safeText(employee.id) + '</small></td><td>' + safeText(employee.department) + '</td><td>' +
      (total ? correct + ' / ' + total + ' (' + Math.round(correct / total * 100) + '%)' : 'Belum ada hasil') + '</td><td>' + (latest ? (latest.correct ? 'Tepat' : 'Perlu latihan') + ' · ' + safeText(latest.category) + '<br><small class="muted">' + formatDate(latest.at) + '</small>' : 'Belum mulai') +
      '</td><td><button class="ghost compact-action" type="button" data-company-action="training" data-employee-id="' + esc(employee.id) + '">Catat hasil latihan</button> <button class="ghost compact-action" type="button" data-company-action="remove" data-employee-id="' + esc(employee.id) + '">Hapus</button>' + trainingForm + '</td></tr>';
  }).join('') : '<tr><td colspan="5" class="muted">Belum ada karyawan. Tambahkan anggota fiktif untuk mulai membuat ringkasan latihan organisasi.</td></tr>';
  const formMarkup = showEmployeeForm ? '<form class="employee-add-form card" data-company-form="employee"><div class="section-title"><h2>Tambah anggota fiktif</h2><span class="tag">data lokal</span></div>' +
    '<div class="employee-form-grid"><label class="field">Nama tampilan <em>*</em><input name="name" required minlength="2" maxlength="70" placeholder="Contoh: Karyawan 01"></label>' +
    '<label class="field">ID karyawan (opsional)<input name="employeeId" maxlength="32" placeholder="Dibuat otomatis bila kosong"></label>' +
    '<label class="field">Departemen <em>*</em><select name="department" required><option>Teknologi</option><option>Keuangan</option><option>HR</option><option>Operasional</option><option>Marketing</option><option>Lainnya</option></select></label></div>' +
    '<p class="muted">Gunakan nama fiktif. Prototype tidak mengundang atau menghubungi karyawan.</p><div class="employee-form-actions"><button class="primary" type="submit">Simpan karyawan</button><button class="ghost" type="button" data-company-action="cancel-add">Batal</button></div></form>' : '';
  page.innerHTML = '<div class="notice">Workspace <b>' + safeText(organization.name || currentAccount.displayName) + '</b> · data ini tersimpan lokal di akun perusahaan ini saja. Angka hanya dihitung dari hasil latihan yang Anda catat.</div>' +
    packageStatusMarkup() + '<div class="grid stats company-stats"><div class="card stat"><small>KARYAWAN</small><div class="value">' + employees.length + '</div><span class="muted">sasaran ' + (Number(organization.targetSize) || 0) + '</span></div>' +
    '<div class="card stat"><small>VULNERABILITY RATE</small><div class="value">' + (vulnerability === null ? '—' : vulnerability + '%') + '</div><span class="muted">jawaban latihan yang belum tepat</span></div>' +
    '<div class="card stat"><small>HASIL LATIHAN</small><div class="value">' + results.length + '</div><span class="muted">catatan evaluasi lokal</span></div>' +
    '<div class="card stat"><small>PELATIHAN DIMULAI</small><div class="value">' + (employees.length ? completedEmployees + '/' + employees.length : '—') + '</div><span class="muted">anggota dengan hasil</span></div></div>' +
    '<div class="company-toolbar"><div><h2>Ringkasan organisasi</h2></div><button class="primary" type="button" data-company-action="toggle-add">Tambah karyawan</button></div>' + formMarkup +
    '<p id="companymsg" class="feedback" aria-live="polite">' + esc(companyMessage) + '</p>' +
    '<div class="grid two company-reports"><section class="card"><div class="section-title"><h2>Kerentanan per departemen</h2><span class="tag">hasil tersimpan</span></div>' +
    '<div class="table-wrap"><table><thead><tr><th>Departemen</th><th>Jawaban</th><th>Belum tepat</th></tr></thead><tbody>' + departmentRows + '</tbody></table></div><p class="muted">' + (results.length ? 'Tingkat kerentanan = jawaban yang belum tepat ÷ seluruh hasil latihan.' : 'Belum ada hasil simulasi; statistik departemen akan muncul setelah hasil dicatat.') + '</p></section>' +
    '<section class="card"><div class="section-title"><h2>Kategori yang perlu dilatih</h2></div>' + (categoryRows.length ? '<ol class="company-category-list">' + categoryRows.map(item => '<li><span>' + safeText(item[0]) + '</span><b>' + item[1] + ' belum tepat</b></li>').join('') + '</ol>' : '<p class="muted empty-state">' + (results.length ? 'Belum ada jawaban yang keliru. Kategori akan dicatat dari hasil latihan berikutnya.' : 'Data belum tersedia. Tambahkan karyawan dan catat hasil latihan untuk membangun ringkasan.') + '</p>') +
    '<p class="muted">Akurasi keseluruhan: ' + (accuracyRate === null ? 'belum tersedia' : accuracyRate + '%') + '</p></section></div>' +
    '<section class="card company-table-card"><div class="section-title"><div><h2>Peserta & hasil latihan</h2><p class="muted">' + (employees.length ? 'Hasil per individu hanya tersimpan pada workspace organisasi ini.' : 'Belum ada data karyawan.') + '</p></div><button class="ghost" type="button" data-action="download-company-report" ' + (employees.length ? '' : 'disabled') + '>Unduh laporan CSV</button></div>' +
    '<div class="table-wrap"><table><thead><tr><th>Karyawan</th><th>Departemen</th><th>Akurasi latihan</th><th>Hasil terakhir</th><th>Aksi</th></tr></thead><tbody>' + employeeRows + '</tbody></table></div></section>';
}


// Function: companyWorkspace
function companyWorkspace(account) {
  const owner = account || currentAccount;
  if (!owner || owner.role !== 'company') return { employees: [] };
  if (!owner.company || typeof owner.company !== 'object') owner.company = { name: owner.displayName };
  if (!Array.isArray(owner.company.employees)) owner.company.employees = [];
  owner.company.employees = owner.company.employees.filter(employee => employee && typeof employee === 'object' &&
    (!employee.ownerAccountId || normalizeUsername(employee.ownerAccountId) === owner.id)).map(employee => ({
      ...employee,
      ownerAccountId: owner.id,
      id: normalizeUsername(employee.id || employee.employeeId || employee.name) || 'karyawan',
      name: String(employee.name || employee.displayName || 'Karyawan'),
      department: String(employee.department || 'Lainnya'),
      results: Array.isArray(employee.results) ? employee.results.filter(result => result && typeof result === 'object').map(result => ({
        category: String(result.category || 'Lainnya'),
        correct: Boolean(result.correct),
        at: result.at || null
      })) : []
    }));
  return owner.company;
}


// Function: downloadCompanyReport
function downloadCompanyReport() {
  if (!hasAccess('company-dashboard')) return;
  const employees = companyWorkspace().employees;
  const rows = [['PhishGuard · laporan simulasi lokal · tidak mewakili hasil pengiriman nyata'], [],
    ['ID karyawan', 'Karyawan', 'Departemen', 'Jawaban tepat', 'Total hasil', 'Akurasi', 'Hasil terakhir', 'Kategori terakhir', 'Waktu terakhir']];
  employees.forEach(employee => {
    const total = employee.results.length;
    const correct = employee.results.filter(result => result.correct).length;
    const latest = employee.results[0];
    rows.push([employee.id, employee.name, employee.department, correct, total, total ? Math.round(correct / total * 100) + '%' : '',
      latest ? (latest.correct ? 'Tepat' : 'Perlu latihan') : 'Belum ada hasil', latest ? latest.category : '', latest ? formatDate(latest.at) : '']);
  });


  // Function: csvCell
  const csvCell = value => '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"';
  const file = new Blob(['\ufeff' + rows.map(row => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'phishguard-laporan-' + currentAccount.id + '.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  const message = document.querySelector('#companymsg');
  if (message) message.textContent = employees.length ? 'Laporan CSV untuk workspace ini berhasil disiapkan.' : 'Belum ada data karyawan untuk diekspor.';
}


// Function: submitCompanyForm
function submitCompanyForm(formElement) {
  if (!hasAccess('company-manage') || formElement.dataset.submitting === 'true') return;
  formElement.dataset.submitting = 'true';
  const submitButton = formElement.querySelector('[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  const fields = Object.fromEntries(new FormData(formElement));
  const workspace = companyWorkspace();
  if (formElement.dataset.companyForm === 'employee') {
    const name = String(fields.name || '').trim();
    const employeeId = normalizeUsername(fields.employeeId || name) || ('karyawan-' + Date.now().toString(36));
    const department = String(fields.department || '').trim();
    if (name.length < 2 || !department) {
      companyMessage = 'Nama minimal 2 karakter dan departemen wajib dipilih.';
    } else if (workspace.employees.some(employee => employee.id === employeeId)) {
      companyMessage = 'ID karyawan sudah ada di workspace ini. Gunakan ID yang berbeda.';
    } else {
      workspace.employees.push({ id: employeeId, ownerAccountId: currentAccount.id, name: name, department: department, results: [] });
      companyMessage = 'Karyawan fiktif ' + name + ' berhasil ditambahkan ke workspace lokal ini.';
      showEmployeeForm = false;
    }
  } else if (formElement.dataset.companyForm === 'training') {
    const employee = workspace.employees.find(item => item.id === normalizeUsername(formElement.dataset.employeeId));
    const category = String(fields.category || '').trim();
    const validCategories = [...new Set(scenarioBank.map(item => item.category))];
    if (!employee || !validCategories.includes(category) || !['true', 'false'].includes(String(fields.correct))) {
      companyMessage = 'Hasil tidak dapat disimpan. Periksa karyawan, kategori, dan pilihan evaluasi.';
    } else {
      employee.results.unshift({ category: category, correct: String(fields.correct) === 'true', at: new Date().toISOString() });
      trainingEmployeeId = '';
      companyMessage = 'Hasil latihan lokal tersimpan untuk ' + employee.name + '. Tidak ada pesan yang dikirim ke karyawan.';
    }
  }
  save();
  company(document.querySelector('#page'));
}


// Function: handleCompanyAction
function handleCompanyAction(control) {
  if (!currentAccount || currentAccount.role !== 'company') return;
  if (control.dataset.companyAction === 'open-dashboard') {
    view = 'company';
    app();
    return;
  }
  if (!hasAccess('company-manage')) {
    companyMessage = 'Aktifkan Company Plan untuk mengelola data organisasi.';
    company(document.querySelector('#page'));
    return;
  }
  const action = control.dataset.companyAction;
  const workspace = companyWorkspace();
  const employeeId = normalizeUsername(control.dataset.employeeId || '');
  if (action === 'toggle-add') showEmployeeForm = !showEmployeeForm;
  if (action === 'cancel-add') showEmployeeForm = false;
  if (action === 'training') trainingEmployeeId = employeeId;
  if (action === 'cancel-training') trainingEmployeeId = '';
  if (action === 'remove') {
    const employee = workspace.employees.find(item => item.id === employeeId);
    if (!employee) return;
    if (!window.confirm('Hapus data lokal ' + employee.name + ' beserta seluruh hasil latihan yang tersimpan di workspace ini?')) return;
    workspace.employees = workspace.employees.filter(item => item.id !== employeeId);
    trainingEmployeeId = '';
    companyMessage = 'Data karyawan dan hasil latihannya dihapus dari workspace lokal ini.';
  }
  if (action !== 'open-dashboard') {
    if (action !== 'remove') companyMessage = '';
    save();
    company(document.querySelector('#page'));
  }
}
