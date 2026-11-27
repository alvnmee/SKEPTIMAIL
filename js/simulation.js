// Phishing simulation scenario rendering, session flow, scoring, and feedback.

// Function: chooseSession
function chooseSession() {
  const availableScenarios = hasAccess('advanced-scenarios')
    ? scenarioBank
    : scenarioBank.filter(item => item.difficulty !== 'Hard');
  if (availableScenarios.length < 5) {
    throw new Error('Scenario bank cannot form a five-scenario session for this package.');
  }
  const valid = [];


  // Function: visit
  // Collects every five-scenario combination that satisfies the mix rules.
  function visit(start, chosen) {
    if (chosen.length === 5) {
      const difficulties = new Set(chosen.map(item => item.difficulty));
      const channels = new Set(chosen.map(item => item.channel));
      const phishing = chosen.filter(item => item.answer === 'phish').length;
      const difficultyMixIsValid = hasAccess('advanced-scenarios')
        ? difficulties.size === 3
        : difficulties.size >= 1 && !difficulties.has('Hard');
      if (difficultyMixIsValid && channels.size >= 4 && phishing >= 2 && phishing <= 4) valid.push(chosen);
      return;
    }
    for (let index = start; index < availableScenarios.length; index++) {
      visit(index + 1, [...chosen, availableScenarios[index]]);
    }
  }
  visit(0, []);
  if (!valid.length) throw new Error('Scenario bank cannot form a valid five-scenario session.');


  // Function: priority
  // Premium sets score higher when they cover categories the user still misses.
  const priority = set => hasAccess('risk-report')
    ? set.reduce((sum, scenario) => sum + Math.max(0,
      (state.weak[scenario.category] || 0) - (state.recognized[scenario.category] || 0) * 0.5), 0)
    : 0;
  const highest = Math.max(...valid.map(priority));
  let preferred = valid.filter(set => priority(set) >= highest - 1);
  if (state.previousSessionIds.length) {
    const previous = [...state.previousSessionIds].sort().join('|');
    const alternatives = preferred.filter(set => [...set.map(item => item.id)].sort().join('|') !== previous);
    if (alternatives.length) preferred = alternatives;
  }
  return shuffled(preferred[Math.floor(Math.random() * preferred.length)]);
}


// Function: startSession
function startSession() {
  if (startingSession || !canStartSimulation()) return false;
  startingSession = true;
  let picked;
  try {
    picked = chooseSession();
  } catch (error) {
    startingSession = false;
    return false;
  }
  const subscription = getSubscription();
  if (subscription.plan === 'Free' && subscription.usage.count >= 3) {
    startingSession = false;
    return false;
  }
  const sessionId = currentAccount.id + '-' + Date.now().toString(36) + '-' +
    Math.random().toString(36).slice(2, 8);
  if (subscription.usage.sessionIds.includes(sessionId)) {
    startingSession = false;
    return false;
  }
  subscription.usage.sessionIds.push(sessionId);
  subscription.usage.count = subscription.usage.sessionIds.length;
  state.previousSessionIds = picked.map(item => item.id);
  state.session = {
    sessionId: sessionId,
    ids: picked.map(item => item.id),
    index: 0,
    answers: Array(5).fill(null),
    earnedXp: 0,
    complete: false,
    startedAt: new Date().toISOString()
  };
  save();
  startingSession = false;
  return true;
}


// Function: iconSvg
function iconSvg(channel) {
  const paths = {
    WhatsApp: html`
      <path d="M20.2 11.5a8.1 8.1 0 0 1-12 7.1L4 20l1.3-4A8.1 8.1 0 1 1 20.2 11.5Z"/>
      <path d="M8.4 8.1c.3-.4.6-.4.9-.1l1 1.4c.2.3.1.6-.1.8l-.5.6c.5 1 1.3 1.8 2.4 2.3l.6-.7c.2-.2.5-.3.8-.1l1.4.7c.3.2.4.5.2.9-.4.8-1.1 1.2-2 1.2-2.5-.2-5.7-3.2-5.9-5.6-.1-.7.4-1.2 1.2-1.4Z"/>
    `,
    Email: html`
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="m4 7 8 6 8-6"/>
    `,
    SMS: html`
      <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8 8 0 0 1-4-.9L4 20l1.5-3.4A7.2 7.2 0 0 1 4 12c0-4.1 3.6-7 8-7s8 2.5 8 6.5Z"/>
      <path d="M8 11h8M8 14h5"/>
    `,
    Website: html`
      <circle cx="12" cy="12" r="9"/>
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>
    `,
    'Notifikasi akun': '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>',
    'QR Code': html`
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/>
      <path d="M14 14h2v2h-2zM18 14h2v6h-6v-2M7 7h.01M17 7h.01M7 17h.01"/>
    `
  };
  return html`
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      ${paths[channel] || paths.Email}
    </svg>
  `;
}


// Function: activeScenario
function activeScenario() {
  if (!state.session) return null;
  return scenarioBank.find(item => item.id === state.session.ids[state.session.index]) || null;
}


// Function: scenarioAttachment
// Uses the scenario's explicit attachment, or infers one from a file-like link label
// when the message text talks about uploading or attaching a file.
function scenarioAttachment(scenario) {
  if (scenario.attachment && scenario.attachment.name) return scenario.attachment;
  const label = scenario.link ? String(scenario.link.label || '') : '';
  const match = label.match(/(?:^|[\s:·])([^/\\\s:·]+\.(?:pdf|apk|zip|png|jpe?g|webp|docx?))$/i);
  if (!match || !/\b(unggah|lampiran|terlampir|file)\b/i.test(scenario.message || '')) return null;
  const extension = match[1].split('.').pop().toUpperCase();
  return { name: match[1], type: extension, size: scenario.attachmentSize || '' };
}


// Function: messageParagraphs
// Splits the message on blank lines and highlights every occurrence of the link label.
function messageParagraphs(scenario, linkClass) {
  const label = scenario.link && scenario.link.label ? safeText(scenario.link.label) : '';
  return String(scenario.message || '').split(/\n\s*\n/).map(paragraph => {
    let content = safeText(paragraph).replace(/\n/g, '<br>');
    if (label) content = content.split(label).join(html`<span class="${linkClass}">${label}</span>`);
    return html`<p>${content}</p>`;
  }).join('');
}


// Function: simulatedLinkCard
function simulatedLinkCard(scenario, variant) {
  if (!scenario.link) return '';
  let host = '';
  try {
    host = new URL(scenario.link.url).hostname;
  } catch (error) {
    host = scenario.sender.domain || '';
  }
  return html`
    <button type="button" class="simulated-link-card ${variant}" data-sim-action="analyze-link" aria-controls="link-inspector" aria-expanded="false" aria-label="Analisis tautan simulasi: ${safeText(scenario.link.label)}">
      <span class="sim-link-mark" aria-hidden="true">↗</span>
      <span class="simulated-link-copy">
        <b>${safeText(scenario.link.label)}</b>
        <small>${safeText(host)}</small>
        <small class="sim-link-action">Periksa tujuan</small>
      </span>
    </button>
  `;
}


// Function: scenarioAddress
function scenarioAddress(scenario) {
  try {
    const url = new URL(scenario.link.url);
    return url.hostname + url.pathname + url.search;
  } catch (error) {
    return scenario.sender.domain || scenario.sender.address || '';
  }
}


// Function: simulatedAttachmentCard
function simulatedAttachmentCard(scenario, variant) {
  const file = scenarioAttachment(scenario);
  if (!file) return '';
  const type = String(file.type || String(file.name).split('.').pop() || 'FILE').toUpperCase();
  const typeClass = type.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const typeModifier = typeClass ? ' attachment-' + typeClass : '';
  const size = file.size ? ' · ' + safeText(file.size) : '';
  return html`
    <div class="simulated-attachment ${variant}" role="group" aria-label="Lampiran simulasi ${safeText(file.name)}">
      <span class="attachment-type${typeModifier}" aria-hidden="true">${safeText(type)}</span>
      <span class="attachment-copy">
        <b>${safeText(file.name)}</b>
        <small>${safeText(type)} · lampiran simulasi${size}</small>
      </span>
      <span class="attachment-preview">Pratinjau</span>
    </div>
  `;
}


// Function: renderWhatsAppMessage
function renderWhatsAppMessage(scenario) {
  const sender = scenario.sender;
  const initials = sender.initials || sender.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  const hasInlineLink = scenario.link && String(scenario.message).includes(scenario.link.label);
  const attachment = simulatedAttachmentCard(scenario, 'wa-attachment');
  // A separate link card is shown only when the link is neither inline nor replaced by an attachment.
  const link = !hasInlineLink && !attachment ? simulatedLinkCard(scenario, 'wa-link') : '';
  return html`
    <div class="message-app whatsapp-app">
      <header class="whatsapp-toolbar">
        <span class="app-back" aria-hidden="true">‹</span>
        <span class="app-avatar" style="--sender-color:${safeText(sender.color)}">${safeText(initials)}</span>
        <span class="app-contact">
          <b>${safeText(sender.name)}</b>
          <small>${safeText(sender.address || sender.role)}</small>
        </span>
        <span class="app-name">WhatsApp</span>
        <span class="app-info" aria-hidden="true">i</span>
      </header>
      <section class="whatsapp-chat" aria-label="Percakapan WhatsApp simulasi">
        <div class="chat-day-label">PESAN SIMULASI</div>
        <div class="whatsapp-bubble">
          <div class="chat-message-copy">${messageParagraphs(scenario, 'message-inline-link')}</div>
          ${attachment}
          ${link}
          <div class="bubble-meta">
            <time>${safeText(scenario.time)}</time>
            <span class="message-checks" aria-hidden="true">✓✓</span>
          </div>
        </div>
      </section>
    </div>
  `;
}


// Function: renderSmsMessage
function renderSmsMessage(scenario) {
  const sender = scenario.sender;
  const initials = sender.initials || sender.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  const hasInlineLink = scenario.link && String(scenario.message).includes(scenario.link.label);
  const link = !hasInlineLink ? simulatedLinkCard(scenario, 'sms-link') : '';
  return html`
    <div class="message-app sms-app">
      <header class="sms-toolbar">
        <span class="app-back" aria-hidden="true">‹</span>
        <span class="app-avatar" style="--sender-color:${safeText(sender.color)}">${safeText(initials)}</span>
        <span class="app-contact">
          <b>${safeText(sender.name)}</b>
          <small>${safeText(sender.address || sender.role)}</small>
        </span>
        <span class="sms-info" aria-hidden="true">⋮</span>
      </header>
      <section class="sms-chat" aria-label="SMS simulasi">
        <div class="sms-time-divider">
          <span>Pesan masuk</span>
          <time>${safeText(scenario.time)}</time>
        </div>
        <div class="sms-bubble">
          ${messageParagraphs(scenario, 'message-inline-link')}
          ${link}
          ${simulatedAttachmentCard(scenario, 'sms-attachment')}
        </div>
      </section>
    </div>
  `;
}


// Function: renderEmailMessage
function renderEmailMessage(scenario) {
  const sender = scenario.sender;
  const initials = sender.initials || sender.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  const hasInlineLink = scenario.link && String(scenario.message).includes(scenario.link.label);
  const link = scenario.link && !hasInlineLink ? simulatedLinkCard(scenario, 'email-link') : '';
  return html`
    <div class="message-app email-app">
      <div class="email-app-bar">
        <span class="email-app-mark" aria-hidden="true">✉</span>
        <span>Email</span>
        <span class="email-demo-label">KOTAK MASUK</span>
      </div>
      <article class="email-paper" aria-label="Email simulasi">
        <div class="email-subject-row">
          <h3>${safeText(scenario.subject)}</h3>
          <span class="email-more" aria-hidden="true">⋮</span>
        </div>
        <div class="email-sender-row">
          <span class="app-avatar" style="--sender-color:${safeText(sender.color)}">${safeText(initials)}</span>
          <span class="email-sender-copy">
            <b>${safeText(sender.name)}</b>
            <small>${safeText(sender.address)}</small>
          </span>
          <time>${safeText(scenario.time)}</time>
        </div>
        <p class="email-to-line">kepada saya <span aria-hidden="true">⌄</span></p>
        <div class="email-body-copy">
          ${messageParagraphs(scenario, 'message-inline-link')}
          ${link}
          ${simulatedAttachmentCard(scenario, 'email-attachment')}
        </div>
      </article>
    </div>
  `;
}


// Function: renderAccountNotification
function renderAccountNotification(scenario) {
  const sender = scenario.sender;
  const initials = sender.initials || sender.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  const hasInlineLink = scenario.link && String(scenario.message).includes(scenario.link.label);
  const link = scenario.link && !hasInlineLink ? simulatedLinkCard(scenario, 'notification-link') : '';
  return html`
    <div class="message-app account-notification-app">
      <div class="notification-device-label">NOTIFIKASI</div>
      <article class="account-notification" aria-label="Notifikasi keamanan simulasi">
        <header class="notification-app-header">
          <span class="notification-app-icon" aria-hidden="true">${iconSvg('Notifikasi akun')}</span>
          <span class="notification-app-name">
            <b>${safeText(sender.name)}</b>
            <small>${safeText(sender.role)}</small>
          </span>
          <time>${safeText(scenario.time)}</time>
        </header>
        <div class="notification-content">
          <div class="notification-kind">PEMBERITAHUAN KEAMANAN</div>
          <h3>${safeText(scenario.title)}</h3>
          <p class="notification-subject">${safeText(scenario.subject)}</p>
          <div class="notification-copy">${messageParagraphs(scenario, 'message-inline-link')}</div>
          ${link}
          <div class="notification-service">
            <span class="app-avatar" style="--sender-color:${safeText(sender.color)}">${safeText(initials)}</span>
            <span>
              <small>LAYANAN</small>
              <b>${safeText(sender.domain || sender.address)}</b>
            </span>
            <span class="notification-status">Simulasi</span>
          </div>
        </div>
      </article>
    </div>
  `;
}


// Function: websiteLoginPreview
// Disabled, non-submitting login form drawn inside the website preview.
function websiteLoginPreview() {
  return html`
    <div class="website-login-preview" role="group" aria-label="Formulir login simulasi nonaktif">
      <span class="website-form-kicker">MASUK KE PORTAL</span>
      <label>
        Email pengguna
        <input type="email" disabled autocomplete="off" placeholder="nama@organisasi.example">
      </label>
      <label>
        Kata sandi
        <input type="password" disabled autocomplete="off" placeholder="Tidak menerima kata sandi">
      </label>
      <button type="button" disabled>Masuk · nonaktif</button>
      <small>Pratinjau visual saja. Kolom ini tidak menerima atau menyimpan data.</small>
    </div>
  `;
}


// Function: renderWebsitePreview
function renderWebsitePreview(scenario) {
  const sender = scenario.sender;
  const initials = sender.initials || sender.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  const loginContext = /login|masuk|password|kata sandi|kredensial/i
    .test([scenario.title, scenario.subject, scenario.message].join(' '));
  const loginForm = loginContext ? websiteLoginPreview() : '';
  return html`
    <div class="message-app website-app">
      <header class="browser-chrome">
        <div class="browser-controls" aria-hidden="true">
          <span>‹</span>
          <span>›</span>
          <span>↻</span>
        </div>
        <div class="browser-address">
          <span class="browser-globe" aria-hidden="true">◎</span>
          <span>${safeText(scenarioAddress(scenario))}</span>
        </div>
        <span class="browser-preview-tag">PRATINJAU LOKAL</span>
      </header>
      <section class="website-page" aria-label="Halaman website simulasi">
        <header class="website-brandbar">
          <span class="website-brand-icon" style="--sender-color:${safeText(sender.color)}">${safeText(initials)}</span>
          <span class="website-brand-copy">
            <b>${safeText(sender.name)}</b>
            <small>${safeText(sender.role)}</small>
          </span>
          <span class="website-nav-label">Portal</span>
        </header>
        <main class="website-content">
          <span class="website-page-kicker">${safeText(scenario.subject)}</span>
          <h3>${safeText(scenario.title)}</h3>
          <div class="website-message-copy">${messageParagraphs(scenario, 'message-inline-link')}</div>
          ${loginForm}
          <div class="website-preview-status">
            <span class="preview-status-dot"></span>
            <span>
              <b>Lingkungan simulasi edukasi</b>
              <small>Alamat hanya ditampilkan sebagai teks. Halaman tidak terhubung ke layanan atau mengirim data.</small>
            </span>
          </div>
        </main>
      </section>
    </div>
  `;
}


// Function: renderQrCodeMessage
function renderQrCodeMessage(scenario) {
  const sender = scenario.sender;
  const initials = sender.initials || sender.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  // The QR pattern is a static illustration, not a scannable code.
  return html`
    <div class="message-app qr-simulation-app">
      <header class="qr-app-header">
        <span class="qr-app-icon">${iconSvg('QR Code')}</span>
        <span>
          <b>QR Code</b>
          <small>Pratinjau pemindaian lokal</small>
        </span>
        <time>${safeText(scenario.time)}</time>
      </header>
      <article class="qr-notice">
        <div class="qr-sender">
          <span class="app-avatar" style="--sender-color:${safeText(sender.color)}">${safeText(initials)}</span>
          <span>
            <b>${safeText(sender.name)}</b>
            <small>${safeText(sender.address || sender.role)}</small>
          </span>
        </div>
        <div class="qr-notice-copy">
          <span class="qr-kicker">KONTEN DI BALIK KODE</span>
          <h3>${safeText(scenario.title)}</h3>
          ${messageParagraphs(scenario, 'message-inline-link')}
        </div>
        <div class="qr-scan-preview">
          <svg class="qr-code-visual" viewBox="0 0 21 21" role="img" aria-label="Pola QR ilustratif, tidak dapat dipindai">
            <rect width="21" height="21" rx="1" fill="#fff"/>
            <path fill="#081725" d="M2 2h7v7H2zM12 2h7v7h-7zM2 12h7v7H2zM11 11h2v2h-2zM14 11h2v2h-2zM18 11h1v3h-1zM11 15h2v4h-2zM14 15h5v2h-5zM16 18h3v1h-3z"/>
            <path fill="#fff" d="M4 4h3v3H4zM14 4h3v3h-3zM4 14h3v3H4z"/>
            <path fill="#081725" d="M5 5h1v1H5zM15 5h1v1h-1zM5 15h1v1H5z"/>
          </svg>
          <span>
            <b>Pratinjau kode</b>
            <small>Visual latihan statis; kamera dan pemindaian tidak diaktifkan.</small>
          </span>
        </div>
      </article>
    </div>
  `;
}


// Function: renderLegacyMessage
// Generic layout for any channel without a dedicated app-style preview.
function renderLegacyMessage(scenario) {
  const sender = scenario.sender;
  const initials = sender.initials || sender.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  const linkLabel = scenario.link
    ? html`<p class="sim-link-label">Teks tautan dalam pesan: <span>${safeText(scenario.link.label)}</span></p>`
    : '';
  return html`
    <header class="sim-sender">
      <div class="sender-avatar" style="--sender-color:${safeText(sender.color)}">
        <span>${safeText(initials)}</span>
      </div>
      <div class="sender-copy">
        <b>${safeText(sender.name)}</b>
        <small>${safeText(sender.role)}</small>
      </div>
      <span class="channel-icon" title="Kanal ${safeText(scenario.channel)}">
        ${iconSvg(scenario.channel)}
        <span>${safeText(scenario.channel)}</span>
      </span>
    </header>
    <div class="sim-message-meta">
      <b>${safeText(scenario.subject)}</b>
      <time>${safeText(scenario.time)}</time>
    </div>
    <div class="sim-message-body">
      ${messageParagraphs(scenario, 'sim-link-label')}
      ${linkLabel}
    </div>
    <footer class="sim-message-footer">
      <span>${iconSvg(scenario.channel)} ${safeText(scenario.channel)}</span>
    </footer>
  `;
}


// Function: renderScenarioMessage
function renderScenarioMessage(scenario) {
  if (scenario.channel === 'WhatsApp') return renderWhatsAppMessage(scenario);
  if (scenario.channel === 'SMS') return renderSmsMessage(scenario);
  if (scenario.channel === 'Email') return renderEmailMessage(scenario);
  if (scenario.channel === 'Notifikasi akun') return renderAccountNotification(scenario);
  if (scenario.channel === 'Website') return renderWebsitePreview(scenario);
  if (scenario.channel === 'QR Code') return renderQrCodeMessage(scenario);
  return renderLegacyMessage(scenario);
}


// Function: inspectPanel
function inspectPanel(scenario) {
  const sender = scenario.sender;
  const replyToRow = sender.replyTo
    ? html`<div><span>Reply-To</span><b>${safeText(sender.replyTo)}</b></div>`
    : '';
  return html`
    <div class="sim-inspector" id="sender-inspector" hidden>
      <div><span>Dari / pengirim</span><b>${safeText(sender.address)}</b></div>
      <div><span>Domain pengirim</span><b>${safeText(sender.domain)}</b></div>
      ${replyToRow}
      <div><span>Konteks</span><b>${safeText(scenario.context)}</b></div>
    </div>
  `;
}


// Function: linkPanel
function linkPanel(scenario) {
  if (!scenario.link) {
    return html`
      <div class="sim-inspector" id="link-inspector" hidden>
        <p>Pesan ini tidak menyertakan tautan. Periksa pengirim dan konteks.</p>
      </div>
    `;
  }
  let host = '';
  try {
    host = new URL(scenario.link.url).hostname;
  } catch (error) {
    host = 'URL tidak valid';
  }
  return html`
    <div class="sim-inspector link-inspector" id="link-inspector" hidden>
      <div><span>Teks yang terlihat</span><b>${safeText(scenario.link.label)}</b></div>
      <div><span>Tujuan simulasi</span><b>${safeText(scenario.link.url)}</b></div>
      <div><span>Domain tujuan</span><b>${safeText(host)}</b></div>
      <div><span>Domain yang diharapkan</span><b>${safeText(scenario.link.expectedDomain)}</b></div>
    </div>
  `;
}


// Function: sessionIntro
function sessionIntro(page) {
  if (!hasAccess('simulation')) {
    page.innerHTML = html`
      <section class="card locked-feature">
        <h2>Simulasi individu tidak tersedia pada akun perusahaan</h2>
        <p class="muted">Gunakan dashboard organisasi untuk mencatat latihan karyawan pada workspace yang terpisah.</p>
        <button class="primary" data-v="company">Buka dashboard perusahaan</button>
      </section>
    `;
    return;
  }
  const remaining = freeQuotaRemaining();
  const limitReached = remaining === 0;
  const quotaLabel = getSubscription().usage.count > 3
    ? getSubscription().usage.count + ' sesi tercatat · batas Free 3'
    : getSubscription().usage.count + '/3 sesi digunakan';
  const quotaNote = getSubscription().plan === 'Free'
    ? html`
      <div class="simulation-quota">
        <b>Kuota Free bulan ini</b>
        <span>${quotaLabel} · ${remaining} tersisa</span>
        <small>Kuota diperbarui ${formatDate(nextPeriodDate(new Date()))}. Satu sesi berisi lima skenario.</small>
      </div>
    `
    : html`
      <div class="simulation-quota">
        <b>${esc(activePlanLabel())}</b>
        <span>Simulasi tanpa batas selama paket aktif</span>
        <small>${getSubscription().expiresAt
          ? 'Paket berakhir ' + formatDate(getSubscription().expiresAt)
          : 'Data progres tetap terikat pada akun ini.'}</small>
      </div>
    `;
  const difficultyFact = hasAccess('advanced-scenarios')
    ? 'Easy · Medium · Hard'
    : 'Easy · Medium · Hard tersedia di Premium';
  const startAction = limitReached
    ? '<button class="primary" type="button" data-open-plan>Kuota habis · lihat paket</button>'
    : '<button class="primary" type="button" data-sim-action="start">Mulai sesi simulasi</button>';
  page.innerHTML = html`
    <section class="card session-intro">
      <span class="eyebrow">LATIHAN LOKAL · DATA FIKTIF</span>
      <h2>Latih penilaian, bukan refleks.</h2>
      <p class="muted">
        Satu sesi berisi lima contoh dari WhatsApp, email, SMS, notifikasi, halaman web, atau QR. Beberapa skenario juga memiliki lampiran. Pesan legitimate dan phishing dicampur; jawaban baru dibahas setelah Anda memilih.
      </p>
      <div class="session-facts">
        <span>5 skenario acak</span>
        <span>${difficultyFact}</span>
        <span>Tautan tidak membuka situs</span>
      </div>
      ${quotaNote}
      ${startAction}
    </section>
  `;
}


// Function: sessionSummary
function sessionSummary(page) {
  const session = state.session;
  const results = session.answers.filter(Boolean);
  const correct = results.filter(item => item.correct).length;
  const earnedXp = results.reduce((sum, item) => sum + item.xp, 0) + (Number(session.bonusXp) || 0);
  const bonusNote = Number(session.bonusXp) > 0
    ? html`<p class="muted session-bonus-note">Bonus sesi tanpa kesalahan: +${Number(session.bonusXp)} XP.</p>`
    : '';
  const restartAction = canStartSimulation()
    ? '<button class="primary" data-sim-action="restart">Mulai sesi baru</button>'
    : html`
      <div class="simulation-quota">
        <b>Kuota Free bulan ini sudah habis</b>
        <span>Progres dan hasil sesi ini tetap tersimpan.</span>
        <small>Kuota diperbarui ${formatDate(nextPeriodDate(new Date()))}.</small>
      </div>
      <button class="primary" data-open-plan>Lihat paket Premium</button>
    `;
  const reviewRows = results.map((result, index) => {
    const scenario = scenarioBank.find(item => item.id === session.ids[index]);
    const outcome = result.correct ? 'Tepat' : 'Perlu latihan';
    return html`
      <div class="activity">
        <i class="dot ${result.correct ? '' : 'bad'}"></i>
        <div>
          <b>${safeText(scenario ? scenario.title : 'Skenario')}</b>
          <br>
          <span class="muted">${safeText(scenario ? scenario.difficulty : '')} · ${outcome} · ${result.xp} XP</span>
        </div>
      </div>
    `;
  }).join('');
  page.innerHTML = html`
    <section class="card session-summary">
      <span class="eyebrow">SESI SELESAI</span>
      <h2>Hasil latihan Anda</h2>
      <p class="muted">Lima skenario dicatat satu kali. Pembahasan tersedia di riwayat profil akun ini.</p>
      ${bonusNote}
      <div class="grid three">
        <div>
          <span class="mini-score">${correct}/5</span>
          <br>
          <small class="muted">jawaban tepat</small>
        </div>
        <div>
          <span class="mini-score">${earnedXp}</span>
          <br>
          <small class="muted">XP sesi</small>
        </div>
        <div>
          <span class="mini-score">${state.streak}</span>
          <br>
          <small class="muted">streak saat ini</small>
        </div>
      </div>
      <div class="session-review">${reviewRows}</div>
      ${restartAction}
      <button class="ghost session-dashboard" data-sim-action="dashboard">Kembali ke dashboard</button>
    </section>
  `;
}


// Function: simulation
// Renders the case screen: the current scenario, inspection tools, and either the
// answer buttons or, once answered, the verdict panel with its stamp.
function simulation(page) {
  const session = state.session;
  if (!session) { sessionIntro(page); return; }
  if (session.complete) { sessionSummary(page); return; }
  const scenario = activeScenario();
  if (!scenario) { state.session = null; save(); sessionIntro(page); return; }
  const priorAnswer = session.answers[session.index];
  const progress = priorAnswer ? session.index + 1 : session.index;
  const messageMarkup = renderScenarioMessage(scenario);
  const answerMarkup = priorAnswer
    ? ''
    : html`
      <div class="choices">
        <button class="choice choice-phish" data-sim-action="answer" data-answer="phish">Phishing</button>
        <button class="choice choice-legit" data-sim-action="answer" data-answer="legit">Aman</button>
      </div>
    `;
  const isPhish = scenario.answer === 'phish';

  let feedbackMarkup = '';
  if (priorAnswer) {
    const verdictClass = (priorAnswer.correct ? 'is-correct' : 'is-wrong') + (isPhish ? '' : ' is-safe-case');
    const choiceLabel = priorAnswer.choice === 'phish' ? 'phishing' : 'aman';
    const outcomeLabel = priorAnswer.correct ? 'tepat, +' + priorAnswer.xp + ' XP' : 'meleset, streak kembali ke 0';
    const evidenceHeading = isPhish
      ? (priorAnswer.correct ? 'Bukti yang kamu tangkap' : 'Bukti yang terlewat')
      : (priorAnswer.correct ? 'Kenapa pesan ini aman' : 'Kenapa pesan ini sebenarnya aman');
    const clueItems = scenario.feedback.clues.map((clue, index) => html`
      <li><span class="pin" aria-hidden="true">${index + 1}</span>${safeText(clue)}</li>
    `).join('');
    const actionHeading = isPhish ? 'Tindakan aman' : 'Tetap verifikasi bila ragu';
    const nextLabel = session.index === 4 ? 'Tutup berkas sesi' : 'Kasus berikutnya';
    feedbackMarkup = html`
      <section class="case-verdict ${verdictClass}" id="result" aria-live="polite">
        <p class="verdict-line">Putusanmu: ${choiceLabel} · ${outcomeLabel}</p>
        <h3>${evidenceHeading}</h3>
        <p class="verdict-summary">${safeText(scenario.feedback.summary)}</p>
        <ol class="evidence-list">${clueItems}</ol>
        <div class="verdict-action">
          <b>${actionHeading}</b>
          <p>${safeText(scenario.feedback.action)}</p>
        </div>
        <button class="primary sim-next" data-sim-action="next">${nextLabel}</button>
      </section>
    `;
  }

  // One progress dot per case: answered (correct/wrong), current, or upcoming.
  const dots = Array.from({ length: 5 }, (_, index) => {
    const result = session.answers[index];
    const cls = result ? (result.correct ? 'is-correct' : 'is-wrong') : index === session.index ? 'is-current' : '';
    return html`<i class="case-dot ${cls}"></i>`;
  }).join('');
  const stamp = priorAnswer
    ? html`
      <div class="case-stamp ${isPhish ? 'is-phish' : 'is-safe'}" aria-hidden="true">
        ${isPhish ? 'Terbukti phishing' : 'Pesan asli'}
      </div>
    `
    : '';
  const stageModifier = priorAnswer ? ' is-answered' : '';
  const answeredCount = session.answers.filter(Boolean).length;
  const levelClass = safeText(String(scenario.difficulty).toLowerCase());
  const heading = priorAnswer ? safeText(scenario.title) : 'Aman atau phishing?';
  const linkButtonLabel = scenario.link ? 'Analisis tautan' : 'Periksa detail pesan';
  const answerPrompt = priorAnswer ? '' : '<p class="answer-prompt">Apa putusanmu?</p>';
  page.innerHTML = html`
    <div class="sim-stage${stageModifier}">
      <div class="sim-top">
        <span class="case-count">Kasus ${Math.min(session.index + 1, 5)} dari 5</span>
        <span class="case-dots" role="img" aria-label="${answeredCount} dari 5 kasus sudah diputus">${dots}</span>
        <button class="sim-exit" type="button" data-sim-action="dashboard">Simpan dan keluar</button>
      </div>
      <div class="case-layout">
        <section class="scenario-card">
          <div class="scenario-head">
            <p class="sim-kicker">
              <span>${safeText(scenario.channel)}</span>
              <span class="level-${levelClass}">${safeText(scenario.difficulty)}</span>
            </p>
            <h2>${heading}</h2>
          </div>
          <div class="case-evidence">
            <div class="sim-message message-host">${messageMarkup}</div>
            ${stamp}
          </div>
          <p class="sim-safe-note">Simulasi edukasi. Tautan dan lampiran tidak membuka apa pun.</p>
          <div class="inspection-actions">
            <button class="ghost" data-sim-action="inspect-sender" aria-expanded="false">
              Lihat pengirim & konteks
            </button>
            <button class="ghost" data-sim-action="analyze-link" aria-expanded="false">
              ${linkButtonLabel}
            </button>
          </div>
          ${inspectPanel(scenario)}
          ${linkPanel(scenario)}
          ${answerPrompt}
          ${answerMarkup}
        </section>
        ${feedbackMarkup}
      </div>
    </div>
  `;
}


// Function: updateBadges
function updateBadges() {
  if (!Array.isArray(state.badges)) state.badges = [];
  if (!state.badgeDates || typeof state.badgeDates !== 'object' || Array.isArray(state.badgeDates)) {
    state.badgeDates = {};
  }
  badgeDefinitions(state).filter(badge => badge.unlocked).forEach(badge => {
    if (!state.badges.includes(badge.id)) {
      state.badges.push(badge.id);
      state.badgeDates[badge.id] = new Date().toISOString();
    }
  });
}


// Function: completeSimulationSession
function completeSimulationSession(session) {
  if (!session || session.complete || session.index < 4 || !session.answers[session.index]) return false;
  session.complete = true;
  if (!session.bonusAwarded) {
    session.bonusAwarded = true;
    // A perfect five-out-of-five session earns a one-time bonus.
    if (session.answers.length === 5 && session.answers.every(answer => answer && answer.correct)) {
      const bonusXp = 25;
      const now = new Date().toISOString();
      session.bonusXp = bonusXp;
      session.earnedXp = (Number(session.earnedXp) || 0) + bonusXp;
      state.xp += bonusXp;
      state.xpEvents.unshift({ at: now, xp: bonusXp });
      state.scoreHistory.push({ at: now, score: score() });
      state.scoreHistory = state.scoreHistory.slice(-52);
    }
  }
  updateBadges();
  save();
  return true;
}


// Function: answer
function answer(choice) {
  const session = state.session;
  if (!hasAccess('simulation') || !session || session.complete || session.answers[session.index]) return;
  const scenario = activeScenario();
  if (!scenario) return;
  const correct = choice === scenario.answer;
  const earned = correct ? ({ Easy: 20, Medium: 35, Hard: 50 }[scenario.difficulty] || 0) : 0;
  const now = new Date();
  session.answers[session.index] = {
    choice: choice, correct: correct, xp: earned, category: scenario.category
  };
  session.earnedXp = (session.earnedXp || 0) + earned;
  state.total++;
  if (correct) {
    state.correct++;
    state.xp += earned;
    state.streak++;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    state.recognized[scenario.category] = (state.recognized[scenario.category] || 0) + 1;
    state.xpEvents.unshift({ at: now.toISOString(), xp: earned });
  } else {
    state.streak = 0;
    state.weak[scenario.category] = (state.weak[scenario.category] || 0) + 1;
  }
  state.history.unshift({
    title: scenario.title,
    ok: correct,
    cat: scenario.category,
    date: now.toLocaleString('id-ID'),
    at: now.toISOString(),
    difficulty: scenario.difficulty,
    scenarioId: scenario.id
  });
  updateBadges();
  state.scoreHistory.push({ at: now.toISOString(), score: score() });
  state.scoreHistory = state.scoreHistory.slice(-52);
  save();
  simulation(document.querySelector('#page'));
}


// Function: toggleInspector
function toggleInspector(id, button) {
  const panel = document.querySelector('#' + id);
  if (!panel) return;
  panel.hidden = !panel.hidden;
  button.setAttribute('aria-expanded', String(!panel.hidden));
  // Link cards inside the message keep their layout; only their action caption changes.
  const embeddedAction = button.querySelector('.sim-link-action');
  if (embeddedAction) {
    embeddedAction.textContent = panel.hidden ? 'Periksa tujuan' : 'Tutup detail';
    return;
  }
  button.textContent = panel.hidden
    ? (id === 'sender-inspector'
      ? 'Lihat pengirim & konteks'
      : (activeScenario() && activeScenario().link ? 'Analisis tautan' : 'Periksa detail pesan'))
    : 'Tutup detail';
}
