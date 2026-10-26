function getSubscription(account) {
  const owner = account || currentAccount;
  if (!owner) return normalizeSubscription(null, {});
  const previousPlan = owner.subscription && owner.subscription.plan;
  owner.subscription = normalizeSubscription(owner.subscription, owner);
  if (previousPlan && previousPlan !== owner.subscription.plan && owner.subscription.status === 'expired') {
    owner.subscription.previousPlan = previousPlan;
  }
  return owner.subscription;
}
function activePlanLabel(account) {
  const subscription = getSubscription(account);
  return subscription.plan === 'Company' ? 'Company Plan' : subscription.plan;
}
function hasAccess(feature, account) {
  const owner = account || currentAccount;
  if (!owner) return false;
  const subscription = getSubscription(owner);
  const ownerRole = owner.role === 'company' ? 'company' : 'individual';
  if (feature === 'education' || feature === 'subscription') return true;
  if (feature === 'company-dashboard' || feature === 'company-manage') {
    return ownerRole === 'company' && subscription.plan === 'Company' && subscription.status === 'active';
  }
  if (feature === 'simulation' || feature === 'badges' || feature === 'leaderboard') return ownerRole === 'individual';
  if (feature === 'advanced-scenarios' || feature === 'risk-report' || feature === 'progress-tracking') {
    return ownerRole === 'individual' && subscription.plan === 'Premium' && subscription.status === 'active';
  }
  return false;
}
function freeQuotaRemaining(account) {
  const owner = account || currentAccount;
  if (!owner) return 0;
  const subscription = getSubscription(owner);
  return subscription.plan === 'Free' ? Math.max(0, 3 - subscription.usage.count) : Infinity;
}
function canStartSimulation(account) {
  const owner = account || currentAccount;
  return hasAccess('simulation', owner) && freeQuotaRemaining(owner) > 0;
}
function packageStatusMarkup() {
  const subscription = getSubscription();
  if (subscription.plan === 'Free') {
    if (currentAccount && currentAccount.role === 'company') {
      return '<div class="package-status"><div><span class="eyebrow">PAKET AKTIF</span><b>Free</b><small>Materi edukasi terbuka · fitur organisasi menunggu aktivasi Company Plan</small></div>' +
        '<button class="ghost" data-open-plan>Kelola paket</button></div>';
    }
    const remaining = freeQuotaRemaining();
    const recordedSessions = subscription.usage.count;
    const quotaProgress = Math.min(recordedSessions, 3);
    const usageSummary = recordedSessions > 3
      ? recordedSessions + ' sesi tercatat · kuota Free 3/3 terpakai'
      : recordedSessions + ' dari 3 sesi bulan ini';
    return '<div class="package-status"><div><span class="eyebrow">PAKET AKTIF</span><b>Free</b><small>' + usageSummary + ' · ' + remaining + ' tersisa</small></div>' +
      '<div class="quota-track" role="progressbar" aria-label="Penggunaan kuota Free" aria-valuemin="0" aria-valuemax="3" aria-valuenow="' + quotaProgress + '"><span style="width:' + (quotaProgress / 3 * 100) + '%"></span></div>' +
      '<small class="muted">Kuota diperbarui ' + formatDate(nextPeriodDate(new Date())) + '</small><button class="ghost" data-open-plan>Pilih paket</button></div>';
  }
  return '<div class="package-status"><div><span class="eyebrow">PAKET AKTIF</span><b>' + esc(activePlanLabel()) + '</b><small>Aktif sejak ' + formatDate(subscription.startedAt) +
    (subscription.expiresAt ? ' · berakhir ' + formatDate(subscription.expiresAt) : ' · tanpa tanggal berakhir') + '</small></div><span class="tag">' + (subscription.plan === 'Premium' ? 'Unlimited simulasi' : 'Workspace perusahaan') +
    '</span><button class="ghost" data-open-plan>Kelola paket</button></div>';
}
function subscription(page) {
  const subscriptionData = getSubscription();
  const active = subscriptionData.plan;
  const isCompanyAccount = currentAccount.role === 'company';
  const freeFeatures = isCompanyAccount
    ? '<li>Akses materi edukasi umum</li><li>Profil organisasi dasar</li><li>Dashboard dan data karyawan aktif melalui Company Plan</li>'
    : '<li>3 sesi simulasi per bulan, masing-masing 5 skenario</li><li>Feedback edukatif setelah jawaban</li><li>Badge dasar dan leaderboard</li><li>Materi edukasi umum tanpa batas</li>';
  const freeCard = '<article class="card plan ' + (active === 'Free' ? 'selected' : '') + '"><span class="eyebrow">' + (active === 'Free' ? 'PAKET AKTIF' : 'MULAI GRATIS') + '</span><h2>Free</h2><div class="price">Rp0</div>' +
    '<p class="muted">' + (isCompanyAccount ? 'Paket awal akun organisasi.' : 'Untuk belajar dasar secara mandiri.') + '</p><ul>' + freeFeatures + '</ul>' +
    '<button class="' + (active === 'Free' ? 'ghost' : 'ghost') + ' wide" type="button" data-plan="Free" ' + (active === 'Free' ? 'disabled' : '') + '>' + (active === 'Free' ? 'Paket aktif' : 'Pilih Free') + '</button></article>';
  const premiumCard = '<article class="card plan featured ' + (active === 'Premium' ? 'selected' : '') + '"><span class="eyebrow">' + (active === 'Premium' ? 'PAKET AKTIF' : 'UNTUK INDIVIDU') + '</span><h2>Premium</h2><div class="price">Rp49.000<small>/bulan</small></div>' +
    '<p class="muted">' + (isCompanyAccount ? 'Premium individu tidak berlaku untuk akun perusahaan; gunakan Company Plan untuk workspace organisasi.' : 'Latihan lanjutan dengan umpan balik yang lebih personal.') + '</p><ul><li>Simulasi tanpa batas selama masa aktif</li><li>Skenario tingkat Hard dan impersonation lanjutan</li><li>Profil risiko dan kategori kelemahan personal</li><li>Grafik serta pelacakan progres lengkap</li><li>Semua badge dan XP tetap tersimpan</li></ul>' +
    (isCompanyAccount
      ? '<button class="ghost wide" type="button" data-plan-action="premium-individual">Khusus akun individu</button>'
      : '<button class="primary wide" type="button" data-plan="Premium" ' + (active === 'Premium' ? 'disabled' : '') + '>' + (active === 'Premium' ? 'Paket aktif' : 'Aktifkan Premium') + '</button>') + '</article>';
  const companyCard = '<article class="card plan ' + (active === 'Company' ? 'selected' : '') + '"><span class="eyebrow">' + (active === 'Company' ? 'PAKET AKTIF' : 'UNTUK ORGANISASI') + '</span><h2>Company Plan</h2><div class="price">Sesuai kebutuhan</div>' +
    '<p class="muted">Workspace terisolasi untuk akun perusahaan terdaftar.</p><ul><li>Dashboard perusahaan dan statistik departemen</li><li>Tambah serta kelola karyawan fiktif lokal</li><li>Catat hasil latihan, akurasi, dan kategori risiko</li><li>Ringkasan organisasi dan ekspor CSV</li><li>Tanpa undangan atau pengiriman simulasi sungguhan</li></ul>' +
    (currentAccount.role === 'company'
      ? '<button class="ghost wide" type="button" data-plan="Company" ' + (active === 'Company' ? 'disabled' : '') + '>' + (active === 'Company' ? 'Paket aktif' : 'Aktifkan Company Plan') + '</button>'
      : '<button class="ghost wide" type="button" data-plan-action="company-registration">Khusus akun perusahaan</button>') + '</article>';
  const expiryStatus = subscriptionData.expiresAt
    ? 'Aktif sejak ' + formatDate(subscriptionData.startedAt) + ' · berakhir ' + formatDate(subscriptionData.expiresAt)
    : 'Aktif sejak ' + formatDate(subscriptionData.startedAt) + (active === 'Free' ? ' · periode Free berjalan bulanan' : ' · tidak ada tanggal kedaluwarsa');
  const freeUsageLabel = subscriptionData.usage.count > 3
    ? subscriptionData.usage.count + ' sesi tercatat · batas Free 3 sesi'
    : subscriptionData.usage.count + '/3 sesi';
  const freeUsage = currentAccount.role === 'individual' && active === 'Free'
    ? '<p class="muted package-usage">Kuota bulan ini: <b>' + freeUsageLabel + '</b> · tersisa ' + freeQuotaRemaining() + ' · diperbarui ' + formatDate(nextPeriodDate(new Date())) + '</p>'
    : '';
  page.innerHTML = '<section class="card active-package"><div><span class="eyebrow">STATUS AKUN · ' + (currentAccount.role === 'company' ? 'PERUSAHAAN' : 'INDIVIDU') + '</span><h2>' + esc(activePlanLabel()) + '</h2><p class="muted">' + expiryStatus + (subscriptionData.status === 'expired' ? ' · Premium berakhir ' + formatDate(subscriptionData.previousExpiresAt) + '; progres tetap tersimpan.' : '') + '</p>' + freeUsage + '</div><span class="tag">' + (subscriptionData.status === 'active' ? 'Aktif' : 'Kembali ke Free') + '</span></section>' +
    '<div class="plan-grid package-grid">' + freeCard + premiumCard + companyCard + '</div>' +
    '<div id="planmsg" class="feedback" role="status" aria-live="polite">' + esc(planMessage) + '</div>';
  planMessage = '';
}
function addOneMonth(date) {
  const source = new Date(date);
  const month = source.getMonth();
  const day = source.getDate();
  const targetFirst = new Date(source.getFullYear(), month + 1, 1);
  const lastDay = new Date(targetFirst.getFullYear(), targetFirst.getMonth() + 1, 0).getDate();
  return new Date(targetFirst.getFullYear(), targetFirst.getMonth(), Math.min(day, lastDay), source.getHours(), source.getMinutes(), source.getSeconds(), source.getMilliseconds());
}
function showPlanConfirmation(plan) {
  if (document.querySelector('#plan-confirmation')) return;
  const isPremium = plan === 'Premium';
  const title = isPremium ? 'Aktifkan Premium?' : plan === 'Company' ? 'Aktifkan Company Plan?' : 'Kembali ke Free?';
  const details = isPremium
    ? '<p>Premium berlaku satu bulan dalam simulasi ini dengan harga demonstrasi <b>Rp49.000 per bulan</b>. Status diperbarui otomatis setelah konfirmasi.</p><p>Ini hanya prototype lokal. Tidak ada pembayaran nyata atau data pembayaran yang diminta.</p>'
    : plan === 'Company'
      ? '<p>Company Plan akan membuka dashboard dan pengelolaan karyawan fiktif untuk akun perusahaan ini.</p><p>Aktivasi hanya simulasi lokal; tidak ada pembayaran, penagihan, undangan, atau pesan yang dikirim. Paket ini tidak memiliki tanggal berakhir dalam prototype.</p>'
      : '<p>Akses Premium atau Company akan berhenti, tetapi XP, badge, riwayat, data karyawan, dan kuota tersimpan tetap dipertahankan.</p><p>Tidak ada pengembalian dana atau pembayaran sungguhan karena paket hanya simulasi.</p>';
  const overlay = document.createElement('div');
  overlay.id = 'plan-confirmation';
  overlay.className = 'plan-confirm-overlay';
  overlay.innerHTML = '<section class="plan-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="plan-confirm-title" aria-describedby="plan-confirm-copy">' +
    '<button class="plan-confirm-close" type="button" data-plan-action="cancel" aria-label="Tutup konfirmasi">×</button><span class="eyebrow">KONFIRMASI PAKET</span><h2 id="plan-confirm-title">' + title + '</h2><div id="plan-confirm-copy">' + details + '</div>' +
    '<div class="plan-confirm-actions"><button type="button" class="ghost" data-plan-action="cancel">Kembali</button><button type="button" class="primary" data-plan-action="confirm" data-confirm-plan="' + plan + '">Konfirmasi simulasi</button></div></section>';
  document.querySelector('#app').appendChild(overlay);
  const cancel = overlay.querySelector('[data-plan-action="cancel"]');
  const closeOnEscape = event => {
    if (event.key === 'Escape') {
      closePlanConfirmation();
      document.removeEventListener('keydown', closeOnEscape);
    }
  };
  overlay._closeOnEscape = closeOnEscape;
  document.addEventListener('keydown', closeOnEscape);
  overlay.addEventListener('click', event => { if (event.target === overlay) closePlanConfirmation(); });
  if (cancel) cancel.focus();
}
function closePlanConfirmation() {
  const overlay = document.querySelector('#plan-confirmation');
  if (!overlay) return;
  if (overlay._closeOnEscape) document.removeEventListener('keydown', overlay._closeOnEscape);
  overlay.remove();
}
function activatePlan(plan) {
  if (!currentAccount || !['Free', 'Premium', 'Company'].includes(plan)) return;
  if (plan === 'Company' && currentAccount.role !== 'company') {
    planMessage = 'Company Plan hanya dapat diaktifkan oleh akun perusahaan yang didaftarkan melalui alur organisasi.';
    subscription(document.querySelector('#page'));
    return;
  }
  if (plan === 'Premium' && currentAccount.role !== 'individual') {
    planMessage = 'Premium individu tidak berlaku untuk akun perusahaan. Gunakan Company Plan untuk fitur organisasi.';
    subscription(document.querySelector('#page'));
    return;
  }
  if (getSubscription().plan === plan) {
    planMessage = 'Paket ini sudah aktif pada akun Anda.';
    subscription(document.querySelector('#page'));
    return;
  }
  showPlanConfirmation(plan);
}
function applyPlan(plan) {
  if (!currentAccount) return;
  if ((plan === 'Company' && currentAccount.role !== 'company') || (plan === 'Premium' && currentAccount.role !== 'individual')) return;
  const now = new Date();
  currentAccount.subscription = {
    ...getSubscription(),
    plan: plan,
    role: currentAccount.role,
    startedAt: now.toISOString(),
    expiresAt: plan === 'Premium' ? addOneMonth(now).toISOString() : null,
    status: 'active'
  };
  state.selectedPlan = plan === 'Company' ? 'Company Plan' : plan;
  planMessage = plan === 'Premium'
    ? 'Premium aktif untuk akun ini sampai ' + formatDate(currentAccount.subscription.expiresAt) + '. Simulasi berhasil; tidak ada pembayaran nyata.'
    : plan === 'Company'
      ? 'Company Plan aktif untuk workspace ' + (currentAccount.company && currentAccount.company.name || currentAccount.displayName) + '. Tidak ada pembayaran nyata.'
      : 'Paket Free aktif kembali. Progres dan riwayat akun tetap tersimpan.';
  save();
  closePlanConfirmation();
  app();
}
