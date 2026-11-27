let archiveFilter = 'all';
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
  const weekdays = dates.slice(0, 7)
    .map(date => new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date));
  const cells = dates.map(date => {
    const count = counts.get(localDayKey(date)) || 0;
    const label = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long' }).format(date);
    const activeClass = count ? 'is-active' : '';
    const todayClass = localDayKey(date) === localDayKey(today) ? ' is-today' : '';
    const ariaLabel = esc(label + ': ' + (count ? count + ' aktivitas belajar' : 'tidak ada aktivitas'));
    const tooltip = esc(label + ' · ' + (count ? count + ' aktivitas' : 'tanpa aktivitas'));
    return html`
      <div class="activity-day ${activeClass}${todayClass}" role="img" aria-label="${ariaLabel}" title="${tooltip}">
        <span>${date.getDate()}</span>
        ${count ? '<i aria-hidden="true"></i>' : ''}
      </div>`;
  }).join('');
  const streak = streakStats || learningStreak(progress, events);
  const emptyMessage = recentCount
    ? ''
    : events.length
      ? html`
        <p class="muted activity-empty-note">
          Tidak ada aktivitas dalam 28 hari terakhir. Riwayat sebelumnya tetap tersimpan.
        </p>`
      : html`
        <p class="muted activity-empty-note">
          Belum ada riwayat simulasi atau kuis yang selesai. Jawaban simulasi dan kuis yang dituntaskan akan tercatat di sini.
        </p>`;
  return html`
    <section class="card activity-calendar" aria-labelledby="activity-calendar-title">
      <div class="section-title">
        <div>
          <p class="eyebrow">KEBIASAAN BELAJAR</p>
          <h2 id="activity-calendar-title">Aktivitas 28 hari terakhir</h2>
        </div>
        <span class="tag">${recentCount} aktivitas</span>
      </div>
      <div class="calendar-weekdays" aria-hidden="true">
        ${weekdays.map(day => html`<span>${esc(day)}</span>`).join('')}
      </div>
      <div class="activity-calendar-grid">${cells}</div>
      ${emptyMessage}
      <div class="streak-summary">
        <div>
          <span class="streak-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 3c1 3-1 4.5-1 6.5 0 1.2.8 2 1.8 2 1.6 0 2.2-1.8 2-3.2 2.2 1.8 3.7 4.1 3.7 6.6a6.5 6.5 0 0 1-13 0c0-3.6 2.4-6.8 6.5-11.9Z"/>
            </svg>
          </span>
          <span><small>Streak belajar aktif</small><b>${streak.current} hari</b></span>
        </div>
        <div>
          <span class="streak-record" aria-hidden="true">↗</span>
          <span><small>Rekor streak belajar</small><b>${streak.record} hari</b></span>
        </div>
      </div>
    </section>`;
}


// Function: recommendation
function recommendation() {
  if (!hasAccess('risk-report')) {
    return 'Materi edukasi umum tetap tersedia. ' +
      'Analisis kelemahan pribadi dan rekomendasi adaptif penuh termasuk dalam Premium.';
  }
  const weakest = Object.entries(state.weak).sort((left, right) => right[1] - left[1])[0];
  if (weakest && weakest[1] > 0) {
    return 'Latih kategori <b>' + safeText(weakest[0]) + '</b> pada sesi berikutnya. ' +
      'Skenario adaptif akan memprioritaskan area yang paling sering terlewat.';
  }
  return 'Belum ada kelemahan berulang yang tercatat. ' +
    'Coba sesi campuran untuk membangun baseline keamanan Anda.';
}


// Function: dashboard
const LEARNING_PATH = [
  ['Suspicious sender', 'Suspicious Sender'],
  ['Impersonation', 'Impersonation'],
  ['Fake links', 'Fake Link'],
  ['Credential requests', 'OTP Request'],
  ['Payment change', 'Payment Change'],
  ['Malicious attachments', 'Malicious Attachment'],
  ['Social engineering', 'Social Engineering'],
  ['QR phishing', 'QR Phishing']
];

function dashboard(page) {
  const firstName = String(currentAccount.displayName || currentAccount.username).trim().split(/\s+/)[0];
  const recognized = state.recognized || {};
  const currentIndex = LEARNING_PATH.findIndex(item => !(recognized[item[0]] > 0));
  const doneCount = LEARNING_PATH.filter(item => recognized[item[0]] > 0).length;

  // One honeycomb cell per scam pattern: solved, current (next to study) or not yet opened.
  const cells = LEARNING_PATH.map((item, index) => {
    const count = recognized[item[0]] || 0;
    const status = count > 0 ? 'is-done' : index === currentIndex ? 'is-current' : 'is-next';
    const note = count > 0
      ? 'Terdeteksi ' + count + ' kali'
      : index === currentIndex ? 'Next up' : 'Belum dicoba';
    const marker = count > 0
      ? html`<small aria-hidden="true">${count}×</small>`
      : index === currentIndex ? '<small aria-hidden="true">next up</small>' : '';
    return html`
      <li class="hive-cell ${status}">
        <button type="button" data-path-start title="${esc(note)}" aria-label="${esc(item[1] + ', ' + note + '. Mulai simulasi')}">
          <span>${esc(item[1])}</span>
          ${marker}
        </button>
      </li>`;
  });
  // Rows of 3, 3 and 2 cells; the middle row is shifted to interlock the hexagons.
  const rows = [cells.slice(0, 3), cells.slice(3, 6), cells.slice(6)].map((row, index) => html`
    <div class="hive-row${index === 1 ? ' is-offset' : ''}">
      ${row.join('')}
    </div>`).join('');

  const nextMode = LEARNING_PATH[currentIndex >= 0 ? currentIndex : 0];
  const example = scenarioBank.find(item => item.category === nextMode[0]);
  const activity = learningActivity(state);
  const today = localDayKey(new Date());
  const todayCount = activity.filter(event => localDayKey(event.at) === today).length;
  const dayStreak = learningStreak(state, activity).current;
  const remaining = freeQuotaRemaining();
  const quotaLine = getSubscription().plan === 'Free'
    ? 'Paket Free · ' + remaining + ' dari 3 sesi tersisa bulan ini'
    : esc(activePlanLabel()) + ' · simulasi tanpa batas';
  const badges = badgeDefinitions(state);
  const nextBadge = badges.filter(badge => !badge.unlocked)
    .map(badge => ({ ...badge, remaining: Math.max(0, badge.target - badge.progress) }))
    .sort((left, right) => left.remaining / left.target - right.remaining / right.target)[0];
  const history = state.scoreHistory.slice(-8);

  const trendChart = history.length
    ? html`
      <div class="mini-trend">
        ${history.map(entry => html`
          <i style="height:${Math.max(8, Number(entry.score) || 0)}%" title="Skor ${Number(entry.score) || 0}"></i>
        `).join('')}
      </div>`
    : '<small>Grafik muncul setelah simulasi pertama.</small>';
  const trendBlock = hasAccess('progress-tracking')
    ? html`
      <div class="rail-block">
        <div class="rail-head">
          <b>Perkembangan skor</b>
          <span>${history.length} catatan</span>
        </div>
        ${trendChart}
        <p class="rail-tip">${recommendation()}</p>
      </div>`
    : html`
      <div class="rail-block">
        <div class="rail-head">
          <b>Perkembangan skor</b>
          <span class="pill-premium">Premium</span>
        </div>
        <small>Grafik perkembangan dan saran latihan pribadi ada di Premium.</small>
      </div>`;

  const recent = state.history.slice(0, 3).map(item => html`
    <li class="${item.ok ? 'is-ok' : 'is-miss'}">
      <i aria-hidden="true">${item.ok ? '✓' : '!'}</i>
      <span>
        <b>${safeText(item.title)}</b>
        <small>${item.ok ? 'Benar' : 'Salah, pelajari lagi'}</small>
      </span>
    </li>`).join('');

  const greetingNote = state.total ? 'Siap latihan lagi?' : 'Yuk mulai simulasi pertamamu.';
  const exampleQuote = example
    ? html`<p class="case-quote">Contoh: ${safeText(example.title)}</p>`
    : '';
  const badgeBlock = nextBadge
    ? html`
      <div class="rail-block rail-badge">
        <i class="badge-hex" aria-hidden="true">★</i>
        <div>
          <b>${safeText(nextBadge.name)}</b>
          <small>${nextBadge.progress} dari ${nextBadge.target} · ${safeText(nextBadge.criterion)}</small>
        </div>
      </div>`
    : '';
  const recentBlock = recent
    ? html`
      <div class="rail-block">
        <div class="rail-head"><b>Simulasi terakhir</b></div>
        <ul class="recent-list">${recent}</ul>
      </div>`
    : '';

  page.innerHTML = html`
    <div class="home">
      <section class="home-main">
        <h2 class="home-greeting">Halo, ${esc(firstName)}. ${greetingNote}</h2>
        <p class="home-sub">Phishing map · ${doneCount} dari ${LEARNING_PATH.length} jenis sudah terdeteksi</p>
        <ol class="hive" aria-label="Phishing map">${rows}</ol>
      </section>
      <aside class="home-rail">
        <div class="case-card">
          <span class="case-kicker">Next up · ${esc(nextMode[1])}</span>
          ${exampleQuote}
          <button type="button" class="primary" data-path-start>Mulai simulasi</button>
        </div>
        <div class="home-stats">
          <div><b>${score()}</b><small>resilience score</small></div>
          <div><b>${Math.min(todayCount, 5)}<em>/5</em></b><small>daily goal</small></div>
          <div><b>${dayStreak}</b><small>streak</small></div>
        </div>
        ${trendBlock}
        ${badgeBlock}
        ${recentBlock}
        <div class="rail-block rail-plan">
          <small>${quotaLine}</small>
          <button type="button" class="link-button" data-v-plan>Lihat paket</button>
        </div>
      </aside>
    </div>`;

  page.querySelectorAll('[data-path-start]').forEach(button => button.addEventListener('click', () => {
    view = 'simulation';
    app();
  }));
  page.querySelector('[data-v-plan]').addEventListener('click', () => {
    view = 'subscription';
    app();
  });
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
    // Ties: older account first, then username, then ID.
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
      const rankClass = place <= 3 ? place : 'other';
      const youMarker = isCurrent ? ' <span class="you-marker">Anda</span>' : '';
      return html`
        <tr class="leaderboard-row rank-${rankClass}${isCurrent ? ' is-current' : ''}">
          <td><span class="place-chip" aria-label="${placeLabel}">${place}</span></td>
          <td>
            <div class="leaderboard-person">
              <span class="leaderboard-avatar ${isCurrent ? 'is-current' : ''}" aria-hidden="true">
                ${esc(initials(person.account.displayName))}
              </span>
              <span class="leaderboard-name">
                <b>${safeText(person.account.displayName)}${youMarker}<small>@${safeText(person.account.username)}</small>
              </span>
            </div>
          </td>
          <td>Lv ${level(person.progress.xp)}</td>
          <td><b>${person.xp} XP</b></td>
        </tr>`;
    }).join('')
    : html`
      <tr>
        <td colspan="4">
          <div class="leaderboard-empty">
            <b>Belum ada XP pada periode ini</b>
            <span>Selesaikan simulasi untuk mengisi peringkat dari hasil yang benar-benar tercatat.</span>
          </div>
        </td>
      </tr>`;

  const progress = levelProgress();
  const badges = badgeDefinitions(state);
  const unlockedCount = badges.filter(badge => badge.unlocked).length;
  const activityEvents = learningActivity(state);
  const dayStreak = learningStreak(state, activityEvents);
  const nextBadge = badges.filter(badge => !badge.unlocked)
    .map(badge => ({ ...badge, remaining: Math.max(0, badge.target - badge.progress) }))
    .sort((left, right) =>
      left.remaining / left.target - right.remaining / right.target || left.remaining - right.remaining)[0];
  // What is still missing for the closest locked badge.
  const nextBadgeTask = !nextBadge
    ? ''
    : nextBadge.id === 'streak'
      ? 'Berikan ' + nextBadge.remaining + ' jawaban benar berturut-turut'
      : nextBadge.id === 'hunter'
        ? 'Jawab ' + nextBadge.remaining + ' skenario simulasi dengan benar'
        : 'Kenali ' + nextBadge.remaining + ' skenario ' +
          (nextBadge.id === 'link' ? 'tautan palsu' : 'impersonasi') + ' dengan benar';
  const nextStep = nextBadge
    ? {
      target: 'simulation',
      title: 'Satu langkah menuju ' + nextBadge.name,
      text: nextBadgeTask + ' untuk membuka badge. Progres saat ini: ' +
        nextBadge.progress + '/' + nextBadge.target + '.',
      button: 'Lanjutkan simulasi'
    }
    : {
      target: 'education',
      title: 'Semua badge sudah terbuka',
      text: 'Pertahankan kebiasaan verifikasi dengan meninjau materi edukasi dan mencoba contoh baru.',
      button: 'Buka materi edukasi'
    };
  const weeklyNote = leaderboardPeriod === 'week' && currentStanding < 0
    ? html`
      <p class="leaderboard-self-note">
        Akun Anda belum memiliki XP pada periode 7 hari ini, jadi belum memiliki posisi mingguan.
      </p>`
    : '';

  const badgeCards = badges.map(badge => {
    const value = badge.id === 'streak' ? Math.min(badge.target, Number(state.maxStreak) || 0) : badge.progress;
    const percent = Math.min(100, value / badge.target * 100);
    const status = badge.unlocked ? 'Terbuka' : 'Terkunci';
    const acquiredDate = badge.acquiredAt ? new Date(badge.acquiredAt) : null;
    const dateLabel = badge.unlocked
      ? (acquiredDate && Number.isFinite(acquiredDate.getTime())
        ? 'Diperoleh ' + acquiredDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Tanggal perolehan belum tercatat')
      : 'Belum diperoleh';
    const progressDetail = badge.progressDetail
      ? html`<small class="badge-progress-detail">${safeText(badge.progressDetail)}</small>`
      : '';
    return html`
      <article class="card achievement-badge ${badge.unlocked ? 'is-unlocked' : 'is-locked'}">
        <div class="badge-topline">
          <span class="badge-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${badge.icon}</svg></span>
          <span class="badge-status ${badge.unlocked ? 'status-open' : 'status-locked'}">${status}</span>
        </div>
        <div>
          <h3>${badge.name}</h3>
          <p class="badge-description">${badge.description}</p>
        </div>
        <p class="badge-criterion"><b>Kriteria</b><span>${badge.criterion}</span></p>
        <div class="badge-progress-copy">
          <span>${badge.unlocked ? 'Syarat terpenuhi' : 'Progres'}</span>
          <b>${value}/${badge.target}</b>
        </div>
        ${progressDetail}
        <div class="progress badge-progress" role="progressbar" aria-label="Progres ${badge.name}" aria-valuemin="0" aria-valuemax="${badge.target}" aria-valuenow="${value}">
          <span style="width:${percent}%"></span>
        </div>
        <small class="badge-acquired-date">${dateLabel}</small>
      </article>`;
  }).join('');

  const percentLabel = Math.round(progress.percent);
  const totalXpLabel = progress.currentXp.toLocaleString('id-ID');
  const nextLevel = progress.level + 1;
  const xpInLevel = progress.currentXp - progress.levelStartXp;
  const periodTag = leaderboardPeriod === 'all' ? 'Seluruh waktu' : '7 hari terakhir';
  const periodNote = leaderboardPeriod === 'week'
    ? 'XP dari jawaban simulasi benar yang tercatat selama 7 hari terakhir. ' +
      'Peserta tanpa XP pada periode ini tidak diberi posisi mingguan.'
    : 'XP total akun individu. Jika XP sama, akun yang dibuat lebih dahulu berada di atas; ' +
      'username lalu ID menjadi pemecah seri.';
  const periodButton = (period, label) => {
    const active = leaderboardPeriod === period;
    return html`
      <button type="button" class="filter ${active ? 'active' : ''}" data-action="leaderboard-period" data-period="${period}" aria-pressed="${active}">
        ${label}
      </button>`;
  };

  page.innerHTML = html`
    <section class="achievement-hero card">
      <div class="achievement-hero-main">
        <div class="achievement-identity">
          <span class="level-emblem"><small>LEVEL</small><b>${progress.level}</b></span>
          <div>
            <p class="eyebrow">PERJALANAN BELAJAR ANDA</p>
            <h2>${safeText(currentAccount.displayName)}</h2>
            <p class="muted">@${safeText(currentAccount.username)} · konsistensi membangun ketahanan digital</p>
          </div>
        </div>
        <div class="xp-display">
          <span>Total pengalaman</span>
          <strong>${totalXpLabel}<small> XP</small></strong>
        </div>
        <div class="level-progress-heading">
          <b>Progres ke Level ${nextLevel}</b>
          <span>${progress.xpToNext.toLocaleString('id-ID')} XP lagi · ${percentLabel}%</span>
        </div>
        <div class="progress level-progress" role="progressbar" aria-label="Progres menuju Level ${nextLevel}" aria-valuemin="0" aria-valuemax="200" aria-valuenow="${xpInLevel}">
          <span style="width:${progress.percent}%"></span>
        </div>
        <div class="level-range">
          <span>Level ${progress.level} dimulai di ${progress.levelStartXp.toLocaleString('id-ID')} XP</span>
          <span>Berikutnya ${progress.nextLevelXp.toLocaleString('id-ID')} XP</span>
        </div>
      </div>
      <div class="achievement-quick-stats">
        <div class="quick-stat">
          <span class="quick-stat-icon" aria-hidden="true">✓</span>
          <span><small>Jawaban tepat</small><b>${state.correct} jawaban</b></span>
        </div>
        <div class="quick-stat">
          <span class="quick-stat-icon xp-icon" aria-hidden="true">XP</span>
          <span><small>Total XP</small><b>${totalXpLabel} XP</b></span>
        </div>
        <div class="quick-stat">
          <span class="quick-stat-icon streak-icon" aria-hidden="true">◷</span>
          <span><small>Streak aktif · rekor</small><b>${dayStreak.current} · ${dayStreak.record} hari</b></span>
        </div>
        <div class="quick-stat">
          <span class="quick-stat-icon badge-count-icon" aria-hidden="true">✦</span>
          <span><small>Badge terbuka</small><b>${unlockedCount} dari ${badges.length}</b></span>
        </div>
      </div>
    </section>
    <section class="card next-achievement">
      <div class="next-achievement-copy">
        <p class="eyebrow">LANGKAH BERIKUTNYA</p>
        <h2>${nextStep.title}</h2>
        <p>${nextStep.text}</p>
      </div>
      <button type="button" class="primary" data-game-nav="${nextStep.target}">
        ${nextStep.button}<span aria-hidden="true"> →</span>
      </button>
    </section>
    <section class="leaderboard-section">
      <div class="leaderboard-heading">
        <div>
          <p class="eyebrow">BELAJAR BERSAMA</p>
          <h2>Leaderboard XP</h2>
          <p class="muted">Bandingkan progres dengan peserta nyata di perangkat ini.</p>
        </div>
        <div class="filters" role="group" aria-label="Periode leaderboard">
          ${periodButton('all', 'Keseluruhan')}
          ${periodButton('week', '7 hari terakhir')}
        </div>
      </div>
      <section class="card leaderboard-card">
        <div class="leaderboard-context">
          <span class="tag">${periodTag}</span>
          <p>${periodNote}</p>
        </div>
        ${weeklyNote}
        <div class="table-wrap">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th scope="col">Posisi</th>
                <th scope="col">Peserta</th>
                <th scope="col">Level</th>
                <th scope="col">XP</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="leaderboard-legend">
          <span><i class="legend-dot top-one"></i>3 teratas</span>
          <span><i class="legend-dot current-user"></i>Akun Anda</span>
        </div>
      </section>
    </section>
    ${activityCalendarMarkup(state, activityEvents, dayStreak)}
    <section class="badge-collection" aria-labelledby="badge-collection-title">
      <div class="badge-section-heading">
        <div>
          <p class="eyebrow">KOLEKSI REWARD</p>
          <h2 id="badge-collection-title">Badge pencapaian</h2>
          <p class="muted">
            Buka reward dengan hasil belajar nyata. Progres terkunci menunjukkan jarak ke syarat berikutnya.
          </p>
        </div>
        <span class="badge-total">${unlockedCount}<small> / ${badges.length} terbuka</small></span>
      </div>
      <div class="badge-grid">${badgeCards}</div>
    </section>`;

  page.querySelectorAll('[data-game-nav]').forEach(button => button.addEventListener('click', () => {
    view = button.dataset.gameNav === 'education' ? 'education' : 'simulation';
    app();
  }));
}


// Function: profile
function profile(page) {
  const filter = ['all', 'ok', 'miss'].includes(archiveFilter) ? archiveFilter : 'all';
  const items = state.history;
  const okCount = items.filter(item => item.ok).length;
  const missCount = items.length - okCount;
  const shown = items.filter(item => filter === 'all' || (filter === 'ok' ? item.ok : !item.ok));
  // Relative time label: "Hari ini", "Kemarin", or a short date.
  const when = item => {
    const date = item.at ? new Date(item.at) : null;
    if (!date || !Number.isFinite(date.getTime())) return safeText(item.date || '');
    const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dayDiff = Math.round(
      (new Date().setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000);
    if (dayDiff === 0) return 'Hari ini, ' + time;
    if (dayDiff === 1) return 'Kemarin, ' + time;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' + time;
  };

  const rows = shown.map(item => {
    const scenario = scenarioBank.find(entry => entry.id === item.scenarioId);
    const meta = [scenario && scenario.channel, item.difficulty || (scenario && scenario.difficulty)]
      .filter(Boolean).map(safeText).join(' · ');
    return html`
      <tr class="${item.ok ? 'is-ok' : 'is-miss'}">
        <td><b>${safeText(item.title)}</b>${meta ? html`<small>${meta}</small>` : ''}</td>
        <td>${safeText(categoryLabel(item.cat))}</td>
        <td><span class="verdict-chip"><i aria-hidden="true"></i>${item.ok ? 'Benar' : 'Salah'}</span></td>
        <td class="archive-time">${when(item)}</td>
      </tr>`;
  }).join('');
  const emptyRow = items.length
    ? '<tr><td colspan="4" class="archive-empty">Tidak ada simulasi dengan hasil ini.</td></tr>'
    : html`
      <tr>
        <td colspan="4" class="archive-empty">
          Belum ada riwayat simulasi. <button type="button" class="link-button" data-archive-start>Mulai simulasi pertama</button>
        </td>
      </tr>`;

  const weaknesses = Object.entries(state.weak).filter(entry => entry[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const insight = hasAccess('risk-report')
    ? html`
      <section class="archive-insight">
        <h2>Paling sering salah</h2>
        ${weaknesses.length
          ? html`
            <ul class="weak-list">
              ${weaknesses.map(entry => html`
                <li><span>${safeText(categoryLabel(entry[0]))}</span><b>${entry[1]}×</b></li>
              `).join('')}
            </ul>
            <p class="rail-tip">${recommendation()}</p>`
          : '<p class="muted">Belum ada jenis phishing yang berulang kali salah.</p>'}
      </section>`
    : html`
      <p class="archive-upsell">
        Jenis phishing yang paling sering salah dan saran latihan pribadi tampil di sini dengan Premium. <button type="button" class="link-button" data-open-plan>Lihat paket</button>
      </p>`;

  const filterButton = (key, label, count) => html`
    <button type="button" class="filter ${filter === key ? 'active' : ''}" data-archive-filter="${key}" aria-pressed="${filter === key}">
      ${label} <span>${count}</span>
    </button>`;
  const summary = items.length
    ? items.length + ' simulasi · ' + okCount + ' benar · akurasi ' + accuracy() + '% · ' +
      state.xp + ' XP, level ' + level()
    : 'Setiap simulasi yang kamu kerjakan akan tercatat di sini.';

  page.innerHTML = html`
    <div class="archive">
      <div class="archive-head">
        <p class="archive-summary">${summary}</p>
        <div class="filters archive-filters" role="group" aria-label="Filter hasil">
          ${filterButton('all', 'Semua', items.length)}
          ${filterButton('ok', 'Benar', okCount)}
          ${filterButton('miss', 'Salah', missCount)}
        </div>
      </div>
      <div class="table-wrap archive-table">
        <table>
          <thead>
            <tr>
              <th scope="col">Pesan</th>
              <th scope="col">Jenis</th>
              <th scope="col">Hasil</th>
              <th scope="col" class="archive-time">Waktu</th>
            </tr>
          </thead>
          <tbody>${rows || emptyRow}</tbody>
        </table>
      </div>
      ${insight}
    </div>`;

  page.querySelectorAll('[data-archive-filter]').forEach(button => button.addEventListener('click', () => {
    archiveFilter = button.dataset.archiveFilter;
    profile(page);
  }));
  const start = page.querySelector('[data-archive-start]');
  if (start) start.addEventListener('click', () => {
    view = 'simulation';
    app();
  });
}
