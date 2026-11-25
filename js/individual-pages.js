// Function: activityCalendarMarkup
function activityCalendarMarkup(progress, activityEvents, streakStats) {
  const events = activityEvents || learningActivity(progress);
  const counts = new Map();
  events.forEach(event => {
    const key = localDayKey(event.at);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 27);
  const dates = Array.from({ length: 28 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  const recentCount = dates.reduce((sum, date) => sum + (counts.get(localDayKey(date)) || 0), 0);
  const weekdays = dates.slice(0, 7).map(date => new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date));
  const cells = dates.map(date => {
    const count = counts.get(localDayKey(date)) || 0;
    const label = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long' }).format(date);
    return '<div class="activity-day ' + (count ? 'is-active' : '') + (localDayKey(date) === localDayKey(today) ? ' is-today' : '') + '" role="img" aria-label="' + esc(label + ': ' + (count ? count + ' aktivitas belajar' : 'tidak ada aktivitas')) + '" title="' + esc(label + ' · ' + (count ? count + ' aktivitas' : 'tanpa aktivitas')) + '"><span>' + date.getDate() + '</span>' + (count ? '<i aria-hidden="true"></i>' : '') + '</div>';
  }).join('');
  const streak = streakStats || learningStreak(progress, events);
  const emptyMessage = recentCount
    ? ''
    : events.length
      ? '<p class="muted activity-empty-note">Tidak ada aktivitas dalam 28 hari terakhir. Riwayat sebelumnya tetap tersimpan.</p>'
      : '<p class="muted activity-empty-note">Belum ada riwayat simulasi atau kuis yang selesai. Jawaban simulasi dan kuis yang dituntaskan akan tercatat di sini.</p>';
  return '<section class="card activity-calendar" aria-labelledby="activity-calendar-title"><div class="section-title"><div><p class="eyebrow">KEBIASAAN BELAJAR</p><h2 id="activity-calendar-title">Aktivitas 28 hari terakhir</h2></div><span class="tag">' + recentCount + ' aktivitas</span></div>' +
    '<div class="calendar-weekdays" aria-hidden="true">' + weekdays.map(day => '<span>' + esc(day) + '</span>').join('') + '</div>' +
    '<div class="activity-calendar-grid">' + cells + '</div>' + emptyMessage +
    '<div class="streak-summary"><div><span class="streak-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3c1 3-1 4.5-1 6.5 0 1.2.8 2 1.8 2 1.6 0 2.2-1.8 2-3.2 2.2 1.8 3.7 4.1 3.7 6.6a6.5 6.5 0 0 1-13 0c0-3.6 2.4-6.8 6.5-11.9Z"/></svg></span><span><small>Streak belajar aktif</small><b>' + streak.current + ' hari</b></span></div>' +
    '<div><span class="streak-record" aria-hidden="true">↗</span><span><small>Rekor streak belajar</small><b>' + streak.record + ' hari</b></span></div></div></section>';
}


// Function: recommendation
function recommendation() {
  if (!hasAccess('risk-report')) {
    return 'Materi edukasi umum tetap tersedia. Analisis kelemahan pribadi dan rekomendasi adaptif penuh termasuk dalam Premium.';
  }
  const weakest = Object.entries(state.weak).sort((left, right) => right[1] - left[1])[0];
  if (weakest && weakest[1] > 0) {
    return 'Latih kategori <b>' + safeText(weakest[0]) + '</b> pada sesi berikutnya. Skenario adaptif akan memprioritaskan area yang paling sering terlewat.';
  }
  return 'Belum ada kelemahan berulang yang tercatat. Coba sesi campuran untuk membangun baseline keamanan Anda.';
}


// Function: dashboard
function dashboard(page) {
  const events = state.scoreHistory.slice(-8);
  const trend = hasAccess('progress-tracking') && events.length
    ? '<div class="trend">' + events.map((entry, index) => '<i style="height:' + Math.max(8, Number(entry.score) || 0) + '%" data-w="' + (index + 1) + '"></i>').join('') + '</div>'
    : hasAccess('progress-tracking')
      ? '<p class="muted empty-state">Grafik akan muncul setelah Anda menyelesaikan simulasi. Tidak ada skor historis yang dibuat-buat.</p>'
      : '<div class="locked-feature"><b>Pelacakan skor lengkap tersedia di Premium</b><p class="muted">Riwayat dasar tetap tersimpan. Upgrade membuka grafik perkembangan dan analisis risiko personal.</p><button class="ghost" data-open-plan>Lihat Premium</button></div>';
  const activities = state.history.length
    ? state.history.slice(0, 4).map(item => '<div class="activity"><i class="dot ' + (item.ok ? '' : 'bad') + '"></i><div><b>' + safeText(item.title) + '</b><br><span class="muted">' +
      (item.ok ? 'Berhasil mengenali' : 'Perlu dipelajari') + ' · ' + safeText(item.cat) + '</span></div><small class="muted">' + safeText(item.date) + '</small></div>').join('')
    : '<p class="muted empty-state">Belum ada aktivitas. Mulai satu sesi untuk mencatat hasil training Anda.</p>';
  page.innerHTML =
    '<div class="grid stats"><div class="card stat"><small>SIMULASI SELESAI</small><div class="value">' + state.total + '</div><span class="muted">skenario akun ini</span></div>' +
    '<div class="card stat"><small>ACCURACY RATE</small><div class="value">' + accuracy() + '%</div><span class="muted">jawaban tepat</span></div>' +
    '<div class="card stat"><small>RESILIENCE SCORE</small><div class="value">' + score() + '</div><span class="muted">dari 100</span></div>' +
    '<div class="card stat"><small>XP & LEVEL</small><div class="value">' + state.xp + ' <small>LV ' + level() + '</small></div><div class="progress"><span style="width:' + (state.xp % 200 / 2) + '%"></span></div></div></div>' +
    packageStatusMarkup() +
    '<div class="grid two"><section class="card span2"><div class="section-title"><h2>Perkembangan ketahanan</h2><span class="tag">' + (hasAccess('progress-tracking') ? 'data akun ini' : 'Premium') + '</span></div>' + trend + '</section>' +
    '<section class="card"><div class="section-title"><h2>Aktivitas terbaru</h2></div>' + activities + '</section></div>' +
    '<section class="card recommend" style="margin-top:16px"><div class="section-title"><h2>Rekomendasi berikutnya</h2><button class="primary" id="go-sim">Mulai latihan</button></div><p class="muted">' + recommendation() + '</p></section>';
  document.querySelector('#go-sim').addEventListener('click', () => { view = 'simulation'; app(); });
}


// Function: game
function game(page) {
  const now = Date.now();
  const cutoff = now - 7 * 24 * 60 * 60 * 1000;
  const people = accounts.filter(account => account.role === 'individual' && !isDemoAccount(account)).map(account => {
    const progress = createProgress(account.progress);
    const weekXp = progress.xpEvents.reduce((sum, event) => {
      const timestamp = Date.parse(event.at || '');
      return timestamp >= cutoff && timestamp <= now ? sum + Math.max(0, Number(event.xp) || 0) : sum;
    }, 0);
    return { account: account, progress: progress, xp: leaderboardPeriod === 'week' ? weekXp : progress.xp };
  }).filter(person => leaderboardPeriod === 'all' || person.xp > 0)
    .sort((left, right) => right.xp - left.xp ||
      (Date.parse(left.account.createdAt) || 0) - (Date.parse(right.account.createdAt) || 0) ||
      left.account.username.localeCompare(right.account.username, 'id') ||
      left.account.id.localeCompare(right.account.id, 'id'));
  const currentStanding = people.findIndex(person => person.account.id === currentAccount.id);
  const rows = people.length
    ? people.map((person, index) => {
      const place = index + 1;
      const isCurrent = person.account.id === currentAccount.id;
      const placeLabel = place <= 3 ? 'Top ' + place : 'Peringkat ' + place;
      return '<tr class="leaderboard-row rank-' + (place <= 3 ? place : 'other') + (isCurrent ? ' is-current' : '') + '"><td><span class="place-chip" aria-label="' + placeLabel + '">' + place + '</span></td>' +
        '<td><div class="leaderboard-person"><span class="leaderboard-avatar ' + (isCurrent ? 'is-current' : '') + '" aria-hidden="true">' + esc(initials(person.account.displayName)) + '</span><span class="leaderboard-name"><b>' + safeText(person.account.displayName) +
        (isCurrent ? ' <span class="you-marker">Anda</span>' : '') + '<small>@' + safeText(person.account.username) + '</small></span></div></td><td>Lv ' + level(person.progress.xp) + '</td><td><b>' + person.xp + ' XP</b></td></tr>';
    }).join('')
    : '<tr><td colspan="4"><div class="leaderboard-empty"><b>Belum ada XP pada periode ini</b><span>Selesaikan simulasi untuk mengisi peringkat dari hasil yang benar-benar tercatat.</span></div></td></tr>';
  const progress = levelProgress();
  const badges = badgeDefinitions(state);
  const unlockedCount = badges.filter(badge => badge.unlocked).length;
  const activityEvents = learningActivity(state);
  const dayStreak = learningStreak(state, activityEvents);
  const nextBadge = badges.filter(badge => !badge.unlocked).map(badge => ({ ...badge, remaining: Math.max(0, badge.target - badge.progress) }))
    .sort((left, right) => left.remaining / left.target - right.remaining / right.target || left.remaining - right.remaining)[0];
  const nextStep = nextBadge
    ? { target: 'simulation', title: 'Satu langkah menuju ' + nextBadge.name, text: (nextBadge.id === 'streak'
      ? 'Berikan ' + nextBadge.remaining + ' jawaban benar berturut-turut'
      : (nextBadge.id === 'hunter' ? 'Jawab ' + nextBadge.remaining + ' skenario simulasi dengan benar' : 'Kenali ' + nextBadge.remaining + ' skenario ' + (nextBadge.id === 'link' ? 'tautan palsu' : 'impersonasi') + ' dengan benar')) + ' untuk membuka badge. Progres saat ini: ' + nextBadge.progress + '/' + nextBadge.target + '.', button: 'Lanjutkan simulasi' }
    : { target: 'education', title: 'Semua badge sudah terbuka', text: 'Pertahankan kebiasaan verifikasi dengan meninjau materi edukasi dan mencoba contoh baru.', button: 'Buka materi edukasi' };
  const weeklyNote = leaderboardPeriod === 'week' && currentStanding < 0
    ? '<p class="leaderboard-self-note">Akun Anda belum memiliki XP pada periode 7 hari ini, jadi belum memiliki posisi mingguan.</p>'
    : '';
  const badgeCards = badges.map(badge => {
    const value = badge.id === 'streak' ? Math.min(badge.target, Number(state.maxStreak) || 0) : badge.progress;
    const percent = Math.min(100, value / badge.target * 100);
    const status = badge.unlocked ? 'Terbuka' : 'Terkunci';
    const acquiredDate = badge.acquiredAt ? new Date(badge.acquiredAt) : null;
    const dateLabel = badge.unlocked
      ? (acquiredDate && Number.isFinite(acquiredDate.getTime()) ? 'Diperoleh ' + acquiredDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tanggal perolehan belum tercatat')
      : 'Belum diperoleh';
    const progressDetail = badge.progressDetail ? '<small class="badge-progress-detail">' + safeText(badge.progressDetail) + '</small>' : '';
    return '<article class="card achievement-badge ' + (badge.unlocked ? 'is-unlocked' : 'is-locked') + '"><div class="badge-topline"><span class="badge-icon" aria-hidden="true"><svg viewBox="0 0 24 24">' + badge.icon + '</svg></span><span class="badge-status ' + (badge.unlocked ? 'status-open' : 'status-locked') + '">' + status + '</span></div>' +
      '<div><h3>' + badge.name + '</h3><p class="badge-description">' + badge.description + '</p></div><p class="badge-criterion"><b>Kriteria</b><span>' + badge.criterion + '</span></p>' +
      '<div class="badge-progress-copy"><span>' + (badge.unlocked ? 'Syarat terpenuhi' : 'Progres') + '</span><b>' + value + '/' + badge.target + '</b></div>' + progressDetail + '<div class="progress badge-progress" role="progressbar" aria-label="Progres ' + badge.name + '" aria-valuemin="0" aria-valuemax="' + badge.target + '" aria-valuenow="' + value + '"><span style="width:' + percent + '%"></span></div><small class="badge-acquired-date">' + dateLabel + '</small></article>';
  }).join('');
  const percentLabel = Math.round(progress.percent);
  page.innerHTML =
    '<section class="achievement-hero card"><div class="achievement-hero-main"><div class="achievement-identity"><span class="level-emblem"><small>LEVEL</small><b>' + progress.level + '</b></span><div><p class="eyebrow">PERJALANAN BELAJAR ANDA</p><h2>' + safeText(currentAccount.displayName) + '</h2><p class="muted">@' + safeText(currentAccount.username) + ' · konsistensi membangun ketahanan digital</p></div></div>' +
    '<div class="xp-display"><span>Total pengalaman</span><strong>' + progress.currentXp.toLocaleString('id-ID') + '<small> XP</small></strong></div><div class="level-progress-heading"><b>Progres ke Level ' + (progress.level + 1) + '</b><span>' + progress.xpToNext.toLocaleString('id-ID') + ' XP lagi · ' + percentLabel + '%</span></div>' +
    '<div class="progress level-progress" role="progressbar" aria-label="Progres menuju Level ' + (progress.level + 1) + '" aria-valuemin="0" aria-valuemax="200" aria-valuenow="' + (progress.currentXp - progress.levelStartXp) + '"><span style="width:' + progress.percent + '%"></span></div><div class="level-range"><span>Level ' + progress.level + ' dimulai di ' + progress.levelStartXp.toLocaleString('id-ID') + ' XP</span><span>Berikutnya ' + progress.nextLevelXp.toLocaleString('id-ID') + ' XP</span></div></div>' +
    '<div class="achievement-quick-stats"><div class="quick-stat"><span class="quick-stat-icon" aria-hidden="true">✓</span><span><small>Jawaban tepat</small><b>' + state.correct + ' jawaban</b></span></div><div class="quick-stat"><span class="quick-stat-icon xp-icon" aria-hidden="true">XP</span><span><small>Total XP</small><b>' + progress.currentXp.toLocaleString('id-ID') + ' XP</b></span></div><div class="quick-stat"><span class="quick-stat-icon streak-icon" aria-hidden="true">◷</span><span><small>Streak aktif · rekor</small><b>' + dayStreak.current + ' · ' + dayStreak.record + ' hari</b></span></div><div class="quick-stat"><span class="quick-stat-icon badge-count-icon" aria-hidden="true">✦</span><span><small>Badge terbuka</small><b>' + unlockedCount + ' dari ' + badges.length + '</b></span></div></div></section>' +
    '<section class="card next-achievement"><div class="next-achievement-copy"><p class="eyebrow">LANGKAH BERIKUTNYA</p><h2>' + nextStep.title + '</h2><p>' + nextStep.text + '</p></div><button type="button" class="primary" data-game-nav="' + nextStep.target + '">' + nextStep.button + '<span aria-hidden="true"> →</span></button></section>' +
    '<section class="leaderboard-section"><div class="leaderboard-heading"><div><p class="eyebrow">BELAJAR BERSAMA</p><h2>Leaderboard XP</h2><p class="muted">Bandingkan progres dengan peserta nyata di perangkat ini.</p></div><div class="filters" role="group" aria-label="Periode leaderboard"><button type="button" class="filter ' + (leaderboardPeriod === 'all' ? 'active' : '') + '" data-action="leaderboard-period" data-period="all" aria-pressed="' + (leaderboardPeriod === 'all') + '">Keseluruhan</button>' +
    '<button type="button" class="filter ' + (leaderboardPeriod === 'week' ? 'active' : '') + '" data-action="leaderboard-period" data-period="week" aria-pressed="' + (leaderboardPeriod === 'week') + '">7 hari terakhir</button></div></div>' +
    '<section class="card leaderboard-card"><div class="leaderboard-context"><span class="tag">' + (leaderboardPeriod === 'all' ? 'Seluruh waktu' : '7 hari terakhir') + '</span><p>' + (leaderboardPeriod === 'week'
      ? 'XP dari jawaban simulasi benar yang tercatat selama 7 hari terakhir. Peserta tanpa XP pada periode ini tidak diberi posisi mingguan.'
      : 'XP total akun individu. Jika XP sama, akun yang dibuat lebih dahulu berada di atas; username lalu ID menjadi pemecah seri.') + '</p></div>' + weeklyNote +
    '<div class="table-wrap"><table class="leaderboard-table"><thead><tr><th scope="col">Posisi</th><th scope="col">Peserta</th><th scope="col">Level</th><th scope="col">XP</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<div class="leaderboard-legend"><span><i class="legend-dot top-one"></i>3 teratas</span><span><i class="legend-dot current-user"></i>Akun Anda</span></div></section></section>' +
    activityCalendarMarkup(state, activityEvents, dayStreak) +
    '<section class="badge-collection" aria-labelledby="badge-collection-title"><div class="badge-section-heading"><div><p class="eyebrow">KOLEKSI REWARD</p><h2 id="badge-collection-title">Badge pencapaian</h2><p class="muted">Buka reward dengan hasil belajar nyata. Progres terkunci menunjukkan jarak ke syarat berikutnya.</p></div><span class="badge-total">' + unlockedCount + '<small> / ' + badges.length + ' terbuka</small></span></div><div class="badge-grid">' + badgeCards + '</div></section>';
  page.querySelectorAll('[data-game-nav]').forEach(button => button.addEventListener('click', () => {
    view = button.dataset.gameNav === 'education' ? 'education' : 'simulation';
    app();
  }));
}


// Function: profile
function profile(page) {
  const weaknesses = Object.entries(state.weak).filter(entry => entry[1] > 0).sort((a, b) => b[1] - a[1]);
  const weaknessMarkup = weaknesses.length
    ? weaknesses.map(entry => '<div class="barrow"><span>' + safeText(entry[0]) + '</span><div class="progress"><span style="width:' + Math.min(100, entry[1] * 30) + '%;background:var(--red)"></span></div><small>' + entry[1] + 'x</small></div>').join('')
    : '<p class="muted empty-state">Belum ada kategori kelemahan yang tercatat.</p>';
  const rows = state.history.length
    ? state.history.map(item => '<tr><td>' + safeText(item.title) + '</td><td>' + safeText(item.cat) + '</td><td style="color:' + (item.ok ? 'var(--green)' : 'var(--red)') + '">' +
      (item.ok ? 'Tepat' : 'Perlu latihan') + '</td><td>' + safeText(item.date) + '</td></tr>').join('')
    : '<tr><td colspan="4" class="muted">Belum ada riwayat. Hasil simulasi berikutnya akan dicatat di sini.</td></tr>';
  page.innerHTML =
    '<div class="grid two"><section class="card"><p class="eyebrow">PROFIL PESERTA</p><h2>' + safeText(currentAccount.displayName) + '</h2><p class="muted">@' + safeText(currentAccount.username) + ' · Individual learner</p>' +
    '<div class="grid three"><div><b class="mini-score">' + score() + '</b><br><small class="muted">resilience</small></div><div><b class="mini-score">' + accuracy() + '%</b><br><small class="muted">akurasi</small></div>' +
    '<div><b class="mini-score">' + state.total + '</b><br><small class="muted">skenario</small></div></div><p class="muted">XP: <b>' + state.xp + '</b> · Level <b>' + level() + '</b></p></section>' +
    (hasAccess('risk-report')
      ? '<section class="card"><div class="section-title"><h2>Area yang perlu dikuatkan</h2><span class="tag">analisis personal</span></div>' + weaknessMarkup + '<p class="muted" style="margin-top:18px">' + recommendation() + '</p></section>'
      : '<section class="card locked-feature"><span class="eyebrow">FITUR PREMIUM</span><h2>Profil risiko personal</h2><p class="muted">Kelemahan per kategori dan rekomendasi khusus akun ini tersedia setelah Premium diaktifkan. Riwayat dasar Anda tetap disimpan.</p><button class="ghost" data-open-plan>Lihat paket Premium</button></section>') + '</div>' +
    '<section class="card" style="margin-top:16px"><div class="section-title"><h2>Riwayat latihan ' + (hasAccess('progress-tracking') ? '& perkembangan lengkap' : 'dasar') + '</h2><span class="tag">akun @' + safeText(currentAccount.username) + '</span></div>' +
    '<div class="table-wrap"><table><thead><tr><th>Skenario</th><th>Kategori</th><th>Hasil</th><th>Waktu</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
}
