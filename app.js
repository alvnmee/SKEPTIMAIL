const ACCOUNTS_KEY = 'phishguard-accounts-v2';
const SESSION_KEY = 'phishguard-active-session-v2';
const LEGACY_STATE_KEY = 'phishguard-demo-v1';
const LEGACY_ROLE_KEY = 'pg-role';
const scenarioBank = window.phishGuardScenarios || [];
const knownDemoNames = ['nadia pratama', 'raka wijaya', 'tiara p.', 'bagas m.', 'mila ananta'];
const knownDemoIds = ['nadia-pratama', 'raka-wijaya', 'tiara-p', 'bagas-m', 'mila-ananta'];
let accounts = readAccounts();
let currentAccount = null;
let state = createProgress();
let role = null;
let view = 'dashboard';
let authMode = 'login';
let signupType = 'individual';
let leaderboardPeriod = 'all';
let accountMessage = '';
let planMessage = '';
let companyMessage = '';
let showEmployeeForm = false;
let trainingEmployeeId = '';
let startingSession = false;
let registrationDrafts = { individual: null, company: null };
let employeeTargetRowId = 0;

function parseStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}
function normalizeUsername(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/@.*$/, '').replace(/\s+/g, '-').replace(/[^a-z0-9._-]/g, '').replace(/^[._-]+|[._-]+$/g, '').slice(0, 32);
}
function createProgress(input) {
  const source = input && typeof input === 'object' ? input : {};
  return {
    ...source,
    xp: Math.max(0, Number(source.xp) || 0),
    correct: Math.max(0, Number(source.correct) || 0),
    total: Math.max(0, Number(source.total) || 0),
    streak: Math.max(0, Number(source.streak) || 0),
    maxStreak: Math.max(0, Number(source.maxStreak) || 0),
    history: Array.isArray(source.history) ? source.history : [],
    learningEvents: Array.isArray(source.learningEvents) ? source.learningEvents : [],
    weak: source.weak && typeof source.weak === 'object' ? source.weak : {},
    recognized: source.recognized && typeof source.recognized === 'object' ? source.recognized : {},
    badges: Array.isArray(source.badges) ? source.badges : [],
    selectedPlan: source.selectedPlan || 'Free',
    session: source.session && typeof source.session === 'object' ? source.session : null,
    previousSessionIds: Array.isArray(source.previousSessionIds) ? source.previousSessionIds : [],
    xpEvents: Array.isArray(source.xpEvents) ? source.xpEvents : [],
    scoreHistory: Array.isArray(source.scoreHistory) ? source.scoreHistory : []
  };
}
function normalizeSimulationTargets(value, accountRole) {
  if (!value || typeof value !== 'object') return null;
  const platforms = Array.isArray(value.platforms)
    ? [...new Set(value.platforms.filter(platform => ['WhatsApp', 'Email', 'SMS'].includes(platform)))]
    : [];
  const targets = value.targets && typeof value.targets === 'object' ? value.targets : value;
  const cleanTargets = {
    email: String(targets.email || '').trim().toLowerCase(),
    phone: String(targets.phone || '').trim()
  };
  if (accountRole === 'company') {
    const contacts = Array.isArray(value.employeeContacts) ? value.employeeContacts : [];
    return {
      scope: 'company',
      platforms: platforms,
      targets: cleanTargets,
      employeeContacts: contacts.filter(contact => contact && typeof contact === 'object').map(contact => ({
        name: String(contact.name || '').trim(),
        email: String(contact.email || '').trim().toLowerCase(),
        phone: String(contact.phone || '').trim(),
        division: String(contact.division || '').trim()
      })).filter(contact => contact.name || contact.email || contact.phone || contact.division),
      authorized: Boolean(value.authorized)
    };
  }
  return {
    scope: 'individual',
    platforms: platforms,
    targets: cleanTargets,
    authorized: Boolean(value.authorized)
  };
}
function normalizedAccount(account) {
  if (!account || typeof account !== 'object') return null;
  const id = normalizeUsername(account.id || account.username);
  if (!id) return null;
  const normalized = {
    ...account,
    id: id,
    username: normalizeUsername(account.username || id),
    displayName: String(account.displayName || account.name || id),
    email: String(account.email || '').trim().toLowerCase(),
    password: typeof account.password === 'string' ? account.password : '',
    needsPassword: Boolean(account.needsPassword),
    role: account.role === 'company' ? 'company' : 'individual',
    company: account.company && typeof account.company === 'object' ? account.company : null,
    simulationTargets: normalizeSimulationTargets(account.simulationTargets, account.role === 'company' ? 'company' : 'individual'),
    createdAt: account.createdAt || new Date(0).toISOString(),
    migrated: Boolean(account.migrated),
    progress: createProgress(account.progress)
  };
  normalized.subscription = normalizeSubscription(account.subscription, normalized);
  return normalized;
}
function currentPeriodKey(date) {
  const value = date || new Date();
  return value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0');
}
function nextPeriodDate(date) {
  const value = new Date(date || new Date());
  return new Date(value.getFullYear(), value.getMonth() + 1, 1);
}
function normalizeSubscription(source, account) {
  const owner = account || {};
  const ownerRole = owner.role === 'company' ? 'company' : 'individual';
  const raw = source && typeof source === 'object' ? source : {};
  let plan = ['Free', 'Premium', 'Company'].includes(raw.plan) ? raw.plan : 'Free';
  let status = raw.status === 'expired' ? 'expired' : 'active';
  let startedAt = raw.startedAt || owner.createdAt || new Date(0).toISOString();
  let expiresAt = raw.expiresAt || null;
  let previousPlan = raw.previousPlan || null;
  let previousStartedAt = raw.previousStartedAt || null;
  let previousExpiresAt = raw.previousExpiresAt || null;
  if (plan === 'Company' && ownerRole !== 'company') {
    plan = 'Free';
    status = 'active';
    expiresAt = null;
  }
  if (plan === 'Premium' && ownerRole !== 'individual') {
    plan = 'Free';
    status = 'active';
    expiresAt = null;
  }
  if (plan === 'Premium' && expiresAt && Date.parse(expiresAt) <= Date.now()) {
    previousPlan = 'Premium';
    previousStartedAt = startedAt;
    previousExpiresAt = expiresAt;
    plan = 'Free';
    status = 'expired';
    expiresAt = null;
    startedAt = new Date().toISOString();
  }
  const usageSource = raw.usage && typeof raw.usage === 'object' ? raw.usage : {};
  const periodKey = currentPeriodKey(new Date());
  const usageHistory = Array.isArray(usageSource.history) ? usageSource.history.slice(-24) : [];
  let usageCount = Math.max(0, Number(usageSource.count) || 0);
  let sessionIds = Array.isArray(usageSource.sessionIds) ? [...new Set(usageSource.sessionIds.filter(Boolean))] : [];
  if (!sessionIds.length && usageCount) sessionIds = Array.from({ length: usageCount }, (_, index) => 'legacy-session-' + index);
  if (String(usageSource.periodKey || '') !== periodKey) {
    if (usageSource.periodKey && (usageCount || sessionIds.length)) {
      usageHistory.push({ periodKey: String(usageSource.periodKey), count: Math.max(usageCount, sessionIds.length) });
    }
    usageCount = 0;
    sessionIds = [];
  }
  return {
    plan: plan,
    role: ownerRole,
    startedAt: startedAt,
    expiresAt: expiresAt,
    status: status,
    previousPlan: previousPlan,
    previousStartedAt: previousStartedAt,
    previousExpiresAt: previousExpiresAt,
    usage: {
      periodKey: periodKey,
      count: Math.max(usageCount, sessionIds.length),
      sessionIds: sessionIds,
      history: usageHistory.slice(-24)
    }
  };
}
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
function formatDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
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
function hasDemoEmail(email) {
  const address = String(email || '').trim().toLowerCase();
  const domain = address.split('@')[1] || '';
  return address.includes('@demo.') || domain.endsWith('.demo') || domain === 'demo';
}
function isDemoAccount(account) {
  const id = normalizeUsername(account.id || account.username || '');
  const email = String(account.email || '').toLowerCase();
  const displayName = String(account.displayName || account.name || '').trim().toLowerCase();
  const companyName = String(account.company && account.company.name || '').trim().toLowerCase();
  const demoId = /(^|[._-])demo($|[._-])/.test(id);
  const demoLabel = /\bdemo\b/.test(displayName) || /\bdemo\b/.test(companyName);
  const legacyCompanySeed = id === 'admin' && account.role === 'company' &&
    (!account.createdAt || !email || hasDemoEmail(email));
  return account.demo === true ||
    hasDemoEmail(email) || demoId || demoLabel || legacyCompanySeed ||
    knownDemoIds.includes(id) ||
    knownDemoNames.includes(displayName) || knownDemoNames.includes(companyName);
}
function readAccounts() {
  const stored = parseStored(ACCOUNTS_KEY, []);
  const list = Array.isArray(stored) ? stored : (stored && Array.isArray(stored.accounts) ? stored.accounts : []);
  const clean = list.filter(account => account && !isDemoAccount(account)).map(normalizedAccount).filter(Boolean);
  const needsSubscriptionMigration = list.some(account => !account || !account.subscription ||
    (account.subscription.plan === 'Premium' && account.subscription.expiresAt && Date.parse(account.subscription.expiresAt) <= Date.now()) ||
    (account.subscription.plan === 'Company' && account.role !== 'company') ||
    (account.subscription.plan === 'Premium' && account.role === 'company') ||
    (account.subscription.usage && account.subscription.usage.periodKey !== currentPeriodKey(new Date())));
  if ((clean.length !== list.length || needsSubscriptionMigration) && localStorage.getItem(ACCOUNTS_KEY)) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(clean));
  }
  return clean;
}
function persistAccounts() {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}
function legacyRecordIsDemo(record) {
  if (!record || typeof record !== 'object') return false;
  const explicitId = normalizeUsername(record.userId || record.username || record.accountId || record.id || '');
  const explicitEmail = String(record.email || '').toLowerCase();
  const explicitName = String(record.displayName || record.name || '').trim().toLowerCase();
  const explicitCompanyName = String(record.company && record.company.name || '').trim().toLowerCase();
  const explicitRole = record.role === 'company' || localStorage.getItem(LEGACY_ROLE_KEY) === 'company' ? 'company' : 'individual';
  const demoId = /(^|[._-])demo($|[._-])/.test(explicitId);
  const demoLabel = /\bdemo\b/.test(explicitName) || /\bdemo\b/.test(explicitCompanyName);
  const legacyCompanySeed = explicitId === 'admin' && explicitRole === 'company' &&
    (!record.createdAt || !explicitEmail || hasDemoEmail(explicitEmail));
  if (record.demo === true || hasDemoEmail(explicitEmail) || demoId || demoLabel || legacyCompanySeed) return true;
  if (explicitId && !knownDemoIds.includes(explicitId) && explicitId !== 'nadia') return false;
  const name = String(record.displayName || record.name || '').trim().toLowerCase();
  if (knownDemoNames.includes(name)) return true;
  return name === 'nadia' && Number(record.xp) === 420 && Number(record.total) === 10;
}
function migrateLegacyStorage() {
  const legacy = parseStored(LEGACY_STATE_KEY, null);
  const priorRole = localStorage.getItem(LEGACY_ROLE_KEY);
  if (legacyRecordIsDemo(legacy)) {
    localStorage.removeItem(LEGACY_STATE_KEY);
    localStorage.removeItem(LEGACY_ROLE_KEY);
    const activeId = normalizeUsername(localStorage.getItem(SESSION_KEY));
    if (knownDemoIds.includes(activeId)) localStorage.removeItem(SESSION_KEY);
    return;
  }
  if (!legacy || typeof legacy !== 'object') {
    if (priorRole) localStorage.removeItem(LEGACY_ROLE_KEY);
    return;
  }
  const storedId = legacy.userId || legacy.username || legacy.accountId || legacy.id ||
    localStorage.getItem('phishguard-user-id') || localStorage.getItem('pg-user-id') ||
    localStorage.getItem('pg-username') || legacy.email || legacy.displayName || legacy.name;
  const id = normalizeUsername(storedId);
  if (!id) return;
  let account = accounts.find(item => item.id === id);
  if (!account) {
    const migratedRole = legacy.role === 'company' || priorRole === 'company' ? 'company' : 'individual';
    const displayName = String(legacy.displayName || legacy.name || (legacy.company && legacy.company.name) || id);
    account = normalizedAccount({
      id: id,
      username: id,
      displayName: displayName,
      email: legacy.email || localStorage.getItem('pg-email') || '',
      password: typeof legacy.password === 'string' ? legacy.password : '',
      needsPassword: !legacy.password,
      role: migratedRole,
      company: legacy.company || null,
      createdAt: legacy.createdAt || new Date().toISOString(),
      migrated: true,
      progress: legacy.progress || legacy
    });
    accounts.push(account);
  }
  if (priorRole && account && !localStorage.getItem(SESSION_KEY)) localStorage.setItem(SESSION_KEY, account.id);
  localStorage.removeItem(LEGACY_STATE_KEY);
  localStorage.removeItem(LEGACY_ROLE_KEY);
  persistAccounts();
}
function restoreSession() {
  const activeId = localStorage.getItem(SESSION_KEY);
  currentAccount = accounts.find(account => account.id === activeId && !isDemoAccount(account)) || null;
  if (!currentAccount) {
    if (activeId) localStorage.removeItem(SESSION_KEY);
    state = createProgress();
    role = null;
    return;
  }
  currentAccount.progress = createProgress(currentAccount.progress);
  state = currentAccount.progress;
  role = currentAccount.role;
  if (role === 'company') view = 'company';
}
migrateLegacyStorage();
restoreSession();

function save() {
  if (!currentAccount) return;
  currentAccount.progress = createProgress(state);
  const index = accounts.findIndex(account => account.id === currentAccount.id);
  if (index >= 0) accounts[index] = currentAccount;
  persistAccounts();
}
function accuracy() {
  return state.total ? Math.round(state.correct / state.total * 100) : 0;
}
function score() {
  if (!state.total) return 0;
  return Math.min(100, Math.round((state.correct / state.total * 70) + state.xp / 12));
}
function level(xp) {
  return Math.floor((Number(xp === undefined ? state.xp : xp) || 0) / 200) + 1;
}
function levelProgress(xp) {
  const totalXp = Math.max(0, Number(xp === undefined ? state.xp : xp) || 0);
  const currentLevel = level(totalXp);
  const levelStartXp = (currentLevel - 1) * 200;
  const nextLevelXp = currentLevel * 200;
  const earnedInLevel = totalXp - levelStartXp;
  return {
    level: currentLevel,
    currentXp: totalXp,
    levelStartXp: levelStartXp,
    nextLevelXp: nextLevelXp,
    xpToNext: nextLevelXp - totalXp,
    percent: Math.min(100, Math.max(0, earnedInLevel / (nextLevelXp - levelStartXp) * 100))
  };
}
function parseActivityTimestamp(item) {
  if (!item || typeof item !== 'object') return null;
  if (item.at) {
    const timestamp = Date.parse(item.at);
    if (Number.isFinite(timestamp)) return new Date(timestamp);
  }
  const raw = String(item.date || '').trim();
  const localDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2})[.:](\d{2})(?:[.:](\d{2}))?)?$/.exec(raw);
  if (localDate) {
    const parsed = new Date(Number(localDate[3]), Number(localDate[2]) - 1, Number(localDate[1]), Number(localDate[4] || 0), Number(localDate[5] || 0), Number(localDate[6] || 0));
    if (parsed.getFullYear() === Number(localDate[3]) && parsed.getMonth() === Number(localDate[2]) - 1 && parsed.getDate() === Number(localDate[1])) return parsed;
  }
  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}
function localDayKey(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}
function learningActivity(progress) {
  const source = progress || state;
  const events = [];
  (Array.isArray(source.history) ? source.history : []).forEach(item => {
    const at = parseActivityTimestamp(item);
    if (at) events.push({ at: at, type: 'simulation' });
  });
  (Array.isArray(source.learningEvents) ? source.learningEvents : []).forEach(item => {
    const at = parseActivityTimestamp(item);
    if (at && item.type === 'quiz') events.push({ at: at, type: 'quiz' });
  });
  return events.filter(event => event.at.getTime() <= Date.now());
}
function learningStreak(progress, activityEvents) {
  const events = activityEvents || learningActivity(progress);
  const days = [...new Set(events.map(event => localDayKey(event.at)))].sort();
  if (!days.length) return { current: 0, record: 0, activeDays: days.length };
  const serials = days.map(day => {
    const parts = day.split('-').map(Number);
    return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
  });
  let record = 0;
  let run = 0;
  let previous = null;
  serials.forEach(serial => {
    run = previous !== null && serial === previous + 1 ? run + 1 : 1;
    record = Math.max(record, run);
    previous = serial;
  });
  const today = new Date();
  const todaySerial = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000);
  const lastSerial = serials[serials.length - 1];
  let current = 0;
  if (lastSerial >= todaySerial - 1 && lastSerial <= todaySerial) {
    current = 1;
    for (let index = serials.length - 2; index >= 0 && serials[index] === serials[index + 1] - 1; index--) current++;
  }
  return { current: current, record: record, activeDays: days.length };
}
function badgeDefinitions(progress) {
  const source = progress || state;
  const history = Array.isArray(source.history) ? source.history : [];
  const correctLinks = history.filter(item => item.ok && (item.cat || item.category) === 'Fake links').length;
  const correctImpersonations = history.filter(item => item.ok && (item.cat || item.category) === 'Impersonation').length;
  return [
    { id: 'hunter', icon: '<path d="M12 3 19 6v5c0 4.5-2.9 7.6-7 10-4.1-2.4-7-5.5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/>', name: 'Phishing Hunter', description: 'Bangun ketelitian lewat keputusan simulasi yang tepat.', criterion: 'Jawab 3 skenario simulasi dengan benar.', progress: Math.max(0, Number(source.correct) || 0), target: 3 },
    { id: 'link', icon: '<path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1"/><path d="m9 15 6-6"/>', name: 'Link Detective', description: 'Periksa domain dan tujuan tautan sebelum memercayainya.', criterion: 'Kenali 2 skenario kategori tautan palsu dengan benar.', progress: correctLinks, target: 2 },
    { id: 'imp', icon: '<path d="M12 3 19 6v5c0 4.5-2.9 7.6-7 10-4.1-2.4-7-5.5-7-10V6l7-3Z"/><path d="M9 10h.01M15 10h.01M9 14c1.7 1.5 4.3 1.5 6 0"/>', name: 'Impersonation Expert', description: 'Pastikan identitas pengirim sesuai kanal dan konteksnya.', criterion: 'Kenali 2 skenario impersonasi dengan benar.', progress: correctImpersonations, target: 2 },
    { id: 'streak', icon: '<path d="M12 3c1 3-1 4.5-1 6.5 0 1.2.8 2 1.8 2 1.6 0 2.2-1.8 2-3.2 2.2 1.8 3.7 4.1 3.7 6.6a6.5 6.5 0 0 1-13 0c0-3.6 2.4-6.8 6.5-11.9Z"/><path d="M10 17.5a2 2 0 0 0 4 0c0-.9-.7-1.8-2-3-1.3 1.2-2 2.1-2 3Z"/>', name: 'Perfect Streak', description: 'Pertahankan fokus dalam rangkaian jawaban yang tepat.', criterion: 'Berikan 3 jawaban benar berturut-turut.', progress: Math.max(0, Number(source.streak) || 0), target: 3 }
  ].map(badge => ({ ...badge, progress: Math.min(badge.target, badge.progress), unlocked: badge.id === 'streak' ? (Number(source.maxStreak) || 0) >= badge.target : badge.progress >= badge.target }));
}
function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || '?').slice(0, 2)).toUpperCase();
}
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
    '<div><span class="streak-record" aria-hidden="true">↗</span><span><small>Rekor streak belajar</small><b>' + streak.record + ' hari</b></span></div></div>' +
    '<p class="calendar-footnote">Satu hari dihitung sekali, meski ada beberapa jawaban pada hari yang sama. Kuis tercatat saat selesai; kuis tidak menambah XP simulasi.</p></section>';
}
function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}
function safeText(value) {
  return esc(value);
}
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
      '<div class="target-safety-note" role="note">Registrasi hanya menyimpan konfigurasi target secara lokal. Tidak ada pesan yang dikirim dan simulasi belum dijalankan.</div></div>' :
      '<div class="target-safety-note" role="note">Registrasi hanya menyimpan konfigurasi target secara lokal. Tidak ada pesan yang dikirim dan simulasi belum dijalankan.</div>') +
    '<label class="consent target-authorization"><input name="targetAuthorization" type="checkbox" value="yes" aria-describedby="target-authorization-error"> <span>' + authorization + '</span></label>' +
    '<small class="field-error target-authorization-error" id="target-authorization-error" data-error-for="targetAuthorization" aria-live="polite"></small>' +
    '<p class="target-authorization-caveat">Pernyataan ini dicatat sebagai bagian dari prototype dan tidak memverifikasi persetujuan atau kewenangan secara hukum.</p></section>';
}
function authSwitchText() {
  return authMode === 'login'
    ? 'Belum punya akun? <button type="button" class="auth-inline-link" id="auth-switch">Daftar akun</button>'
    : 'Sudah punya akun? <button type="button" class="auth-inline-link" id="auth-switch">Masuk</button>';
}
function form(type) {
  const container = document.querySelector('#form');
  const switchText = authSwitchText();
  if (type === 'login') {
    container.innerHTML =
      '<form id="authForm" class="auth-form compact"><div class="notice">Gunakan ID pengguna atau email dan kata sandi yang dibuat saat registrasi. Akun demo lama tidak lagi tersedia.</div>' +
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
function showFormError(message) {
  const messageElement = document.querySelector('#formmsg');
  if (messageElement) messageElement.textContent = message;
}
function clearRegistrationErrors(formElement) {
  formElement.querySelectorAll('[data-error-for]').forEach(error => { error.textContent = ''; });
  formElement.querySelectorAll('[aria-invalid="true"]').forEach(input => input.removeAttribute('aria-invalid'));
  formElement.querySelectorAll('[data-row-error]').forEach(error => { error.textContent = ''; });
}
function setRegistrationFieldError(formElement, name, message) {
  const error = formElement.querySelector('[data-error-for="' + name + '"]');
  if (error) error.textContent = message;
  formElement.querySelectorAll('[name="' + name + '"]').forEach(input => input.setAttribute('aria-invalid', 'true'));
}
function validEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}
function validInternationalPhone(value) {
  return /^\+[1-9]\d{7,14}$/.test(String(value || '').replace(/[\s()-]/g, ''));
}
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
function validateRegistrationForm(formElement, type, fields, targets) {
  clearRegistrationErrors(formElement);
  let valid = true;
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
function shell() {
  const individual = role === 'individual';
  const navigation = individual
    ? [['dashboard', 'Dashboard'], ['simulation', 'Simulasi'], ['game', 'Pencapaian'], ['profile', 'Profil & Laporan'], ['education', 'Edukasi'], ['subscription', 'Paket']]
    : [['company', 'Company Dashboard'], ['education', 'Edukasi'], ['subscription', 'Paket']];
  document.querySelector('#app').innerHTML =
    '<div class="shell' + (individual ? '' : ' company-shell') + '"><aside class="sidebar"><div class="side-brand brand">◈ Phish<b>Guard</b></div><nav class="nav">' +
    navigation.map(item => '<button data-v="' + item[0] + '" class="' + (item[0] === view ? 'active' : '') + '">' + item[1] + '</button>').join('') +
    '<button data-v="logout">Keluar</button></nav><div class="side-foot">Akun dan progres tersimpan lokal pada perangkat ini.</div></aside>' +
    '<main class="main"><div class="topbar"><div><p class="eyebrow">' + (individual ? 'personal learning space' : 'organization workspace') + '</p><h1 id="title"></h1></div>' +
    '<div class="user"><div class="avatar">' + esc((currentAccount.displayName || currentAccount.username).charAt(0).toUpperCase()) + '</div>' +
    '<span class="name">' + esc(currentAccount.displayName) + '<small class="identity-id">@' + esc(currentAccount.username) + '</small></span></div></div><div id="page"></div></main></div>';
  document.querySelectorAll('[data-v]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.v === 'logout') {
      save();
      localStorage.removeItem(SESSION_KEY);
      currentAccount = null;
      state = createProgress();
      role = null;
      view = 'dashboard';
      accountMessage = 'Anda telah keluar. Akun dan progres tetap tersimpan di browser.';
      authMode = 'login';
      login();
      return;
    }
    view = button.dataset.v;
    app();
  }));
}
function app() {
  if (!currentAccount || !role) {
    login();
    return;
  }
  shell();
  const page = document.querySelector('#page');
  const titles = {
    dashboard: 'Ringkasan keamanan Anda',
    simulation: 'Simulasi phishing aman',
    game: 'Pencapaian & peringkat',
    profile: 'Profil & laporan training',
    company: 'Dashboard perusahaan',
    education: 'Tren & edukasi',
    subscription: 'Paket PhishGuard'
  };
  if (role === 'company' && view !== 'company' && view !== 'education' && view !== 'subscription') view = 'company';
  document.querySelector('#title').textContent = titles[view] || titles.dashboard;
  const pages = { dashboard, simulation, game, profile, company, education, subscription };
  (pages[view] || pages.dashboard)(page);
}
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
    return '<article class="card achievement-badge ' + (badge.unlocked ? 'is-unlocked' : 'is-locked') + '"><div class="badge-topline"><span class="badge-icon" aria-hidden="true"><svg viewBox="0 0 24 24">' + badge.icon + '</svg></span><span class="badge-status ' + (badge.unlocked ? 'status-open' : 'status-locked') + '">' + status + '</span></div>' +
      '<div><h3>' + badge.name + '</h3><p class="badge-description">' + badge.description + '</p></div><p class="badge-criterion"><b>Kriteria</b><span>' + badge.criterion + '</span></p>' +
      '<div class="badge-progress-copy"><span>' + (badge.unlocked ? 'Syarat terpenuhi' : 'Progres') + '</span><b>' + value + '/' + badge.target + '</b></div><div class="progress badge-progress" role="progressbar" aria-label="Progres ' + badge.name + '" aria-valuemin="0" aria-valuemax="' + badge.target + '" aria-valuenow="' + value + '"><span style="width:' + percent + '%"></span></div></article>';
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
    '<div class="company-toolbar"><div><h2>Ringkasan organisasi</h2><p class="muted">Data demo bersifat lokal dan tidak mewakili pengiriman simulasi sungguhan.</p></div><button class="primary" type="button" data-company-action="toggle-add">Tambah karyawan</button></div>' + formMarkup +
    '<p id="companymsg" class="feedback" aria-live="polite">' + esc(companyMessage) + '</p>' +
    '<div class="grid two company-reports"><section class="card"><div class="section-title"><h2>Kerentanan per departemen</h2><span class="tag">hasil tersimpan</span></div>' +
    '<div class="table-wrap"><table><thead><tr><th>Departemen</th><th>Jawaban</th><th>Belum tepat</th></tr></thead><tbody>' + departmentRows + '</tbody></table></div><p class="muted">' + (results.length ? 'Tingkat kerentanan = jawaban yang belum tepat ÷ seluruh hasil latihan.' : 'Belum ada hasil simulasi; statistik departemen akan muncul setelah hasil dicatat.') + '</p></section>' +
    '<section class="card"><div class="section-title"><h2>Kategori yang perlu dilatih</h2></div>' + (categoryRows.length ? '<ol class="company-category-list">' + categoryRows.map(item => '<li><span>' + safeText(item[0]) + '</span><b>' + item[1] + ' belum tepat</b></li>').join('') + '</ol>' : '<p class="muted empty-state">' + (results.length ? 'Belum ada jawaban yang keliru. Kategori akan dicatat dari hasil latihan berikutnya.' : 'Data belum tersedia. Tambahkan karyawan dan catat hasil latihan untuk membangun ringkasan.') + '</p>') +
    '<p class="muted">Akurasi keseluruhan: ' + (accuracyRate === null ? 'belum tersedia' : accuracyRate + '%') + '</p></section></div>' +
    '<section class="card company-table-card"><div class="section-title"><div><h2>Peserta & hasil latihan</h2><p class="muted">' + (employees.length ? 'Hasil per individu hanya tersimpan pada workspace organisasi ini.' : 'Belum ada data karyawan.') + '</p></div><button class="ghost" type="button" data-action="download-company-report" ' + (employees.length ? '' : 'disabled') + '>Unduh laporan CSV</button></div>' +
    '<div class="table-wrap"><table><thead><tr><th>Karyawan</th><th>Departemen</th><th>Akurasi latihan</th><th>Hasil terakhir</th><th>Aksi</th></tr></thead><tbody>' + employeeRows + '</tbody></table></div></section>';
}
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
const educationTopics = [
  {
    id: 'impersonation', title: 'Impersonation', visual: 'identity',
    summary: 'Penipu membangun kesan sebagai rekan, vendor, HR, atau layanan yang Anda kenal.',
    example: 'Pesan dari “staf vendor Sagara” meminta perubahan rekening tagihan melalui alamat balasan baru.',
    mechanism: 'Pelaku meniru nama, gaya bahasa, foto profil, atau konteks percakapan agar permintaan terasa rutin. Identitas yang tampak akrab belum tentu berasal dari pemiliknya.',
    signals: ['Alamat pengirim atau nomor berbeda dari catatan sebelumnya.', 'Permintaan baru mengubah alur kerja, rekening, atau kontak.', 'Ada dorongan untuk merahasiakan permintaan dari rekan lain.'],
    mistake: 'Menganggap nama dan foto profil cukup untuk membuktikan identitas.',
    prevention: 'Hubungi orang atau vendor melalui nomor dan alamat yang sudah tersimpan, bukan detail kontak di pesan baru.',
    response: 'Jangan teruskan pembayaran atau dokumen. Konfirmasikan perubahan lewat kanal kedua yang telah dikenal dan laporkan akun tiruan.'
  },
  {
    id: 'fake-links', title: 'Fake links', visual: 'link',
    summary: 'Alamat yang ditampilkan dapat berbeda dari tujuan sebenarnya atau memakai domain tiruan.',
    example: 'Pesan menyebut “Portal Mitra Sagara”, tetapi alamat yang tercetak adalah `https://mitra-sagara-update.example`.',
    mechanism: 'Tautan tiruan meniru kata atau susunan domain yang familier. Nama merek di jalur URL tidak membuktikan bahwa domain induknya resmi.',
    signals: ['Domain induk tidak cocok dengan alamat yang biasa Anda gunakan.', 'Ejaan, tanda hubung, atau subdomain terasa tidak wajar.', 'Teks tautan menjanjikan satu layanan, tetapi alamat tujuan mengarah ke konteks lain.'],
    mistake: 'Menilai tautan dari teks tombol atau simbol gembok saja.',
    prevention: 'Buka layanan melalui bookmark atau aplikasi resmi. Jika ragu, ketik alamat yang sudah Anda ketahui secara manual.',
    response: 'Jangan buka tautan. Bila sudah dibuka, jangan isi data apa pun dan tutup halaman; gunakan perangkat atau kanal resmi untuk memeriksa akun.'
  },
  {
    id: 'urgency', title: 'Urgency tactics', visual: 'clock',
    summary: 'Tekanan waktu atau ancaman kehilangan akses membuat orang melewati pemeriksaan rutin.',
    example: 'Pesan fiktif “Pusat Akun Sagara” meminta tindakan sebelum pukul 17.00, tetapi tidak menjelaskan alasan atau jalur bantuan resmi.',
    mechanism: 'Batas waktu, ancaman pemblokiran, hadiah yang akan berakhir, atau permintaan rahasia dipakai untuk mempercepat keputusan. Tenggat yang masuk akal juga bisa muncul pada pesan sah, jadi periksa konteksnya.',
    signals: ['Ancaman atau hadiah menggantikan penjelasan yang dapat diverifikasi.', 'Pengirim meminta keputusan tanpa memberi waktu memeriksa.', 'Pesan menyuruh mengabaikan prosedur atau merahasiakan tindakan.'],
    mistake: 'Menganggap semua pesan mendesak pasti phishing, atau sebaliknya mengikuti tenggat tanpa verifikasi.',
    prevention: 'Pisahkan urgensi dari bukti. Periksa pengirim, tujuan, dan prosedur lewat layanan yang biasa digunakan.',
    response: 'Berhenti sejenak. Hubungi bagian terkait melalui direktori resmi dan simpan pesan sebagai bukti bila perlu dilaporkan.'
  },
  {
    id: 'credentials', title: 'Credential requests', visual: 'key',
    summary: 'Permintaan kata sandi, PIN, OTP, atau persetujuan MFA berisiko mengambil alih akun.',
    example: 'Akun bantuan fiktif di WhatsApp meminta kode verifikasi enam angka agar “tiket dapat ditutup”.',
    mechanism: 'Pelaku meminta rahasia secara langsung atau mengarahkan korban ke formulir tiruan. Kode sekali pakai dapat memberi akses walau kata sandi tidak diketahui.',
    signals: ['Ada permintaan OTP, PIN, kata sandi, atau kode pemulihan.', 'Notifikasi MFA muncul tanpa Anda memulai proses masuk.', 'Formulir dibuka dari pesan yang tidak diminta.'],
    mistake: 'Membagikan kode karena penelepon sudah mengetahui nama atau nomor tiket.',
    prevention: 'Jangan pernah membagikan kode keamanan. Mulai proses masuk hanya dari aplikasi atau halaman yang dibuka sendiri.',
    response: 'Tolak permintaan, batalkan notifikasi masuk yang tidak Anda mulai, ganti kata sandi dari situs resmi, lalu beri tahu dukungan tepercaya.'
  },
  {
    id: 'qr-phishing', title: 'QR phishing', visual: 'qr',
    summary: 'Kode QR dapat menyamarkan alamat tujuan, terutama pada poster atau lampiran yang tidak diminta.',
    example: 'Stiker fiktif “pembaruan parkir” menutupi QR resmi dan mengarah ke `parkir-akses.example`.',
    mechanism: 'QR hanya cara lain untuk membuka URL. Setelah dipindai, halaman tetap perlu diperiksa sebelum informasi dimasukkan.',
    signals: ['Stiker terlihat menimpa kode asli atau tidak sesuai tempatnya.', 'Alamat hasil pindai tidak cocok dengan layanan yang dimaksud.', 'Halaman meminta login atau pembayaran yang tidak relevan.'],
    mistake: 'Menganggap kode QR aman karena tercetak di tempat umum.',
    prevention: 'Pratinjau alamat sebelum membuka. Untuk pembayaran atau akun, gunakan aplikasi yang sudah terpasang.',
    response: 'Tutup halaman dan jangan lanjutkan. Laporkan kode yang mencurigakan kepada pengelola lokasi melalui kontak resmi.'
  },
  {
    id: 'attachments', title: 'Malicious attachments', visual: 'file',
    summary: 'Lampiran yang tidak diharapkan dapat menyamarkan file berbahaya sebagai dokumen biasa.',
    example: 'Email tagihan fiktif melampirkan `Rincian_Biaya.html` padahal percakapan sebelumnya tidak menyebut dokumen.',
    mechanism: 'Nama file dan ikon dokumen tidak menunjukkan isi sebenarnya. Pelaku sering memakai arsip, formulir, atau dokumen yang meminta tindakan tambahan.',
    signals: ['Lampiran tidak sesuai konteks atau tidak pernah diminta.', 'Nama file menggandakan ekstensi atau memakai tipe yang tidak biasa.', 'Pengirim mendorong Anda mengaktifkan fitur atau mengunduh aplikasi.'],
    mistake: 'Membuka lampiran hanya karena nama pengirim tampak dikenal.',
    prevention: 'Konfirmasikan dokumen lewat percakapan sebelumnya. Perbarui perangkat lunak keamanan dan jangan aktifkan konten yang tidak diperlukan.',
    response: 'Jangan buka atau teruskan file. Laporkan email. Jika telanjur dibuka, putuskan koneksi bila ada perilaku aneh dan minta bantuan tim IT.'
  },
  {
    id: 'account-takeover', title: 'Account takeover', visual: 'account',
    summary: 'Akun dapat diambil alih setelah kata sandi atau faktor pemulihan berhasil dicuri.',
    example: 'Pemberitahuan fiktif dari aplikasi “RuangSaku” menyebut ada perangkat baru dan menyarankan pengguna membuka aplikasi sendiri.',
    mechanism: 'Kredensial yang bocor dipakai untuk masuk, mengganti detail pemulihan, atau menyamar sebagai pemilik akun. Peringatan login bisa sah, tetapi tautan dalam pesan tetap perlu diperiksa.',
    signals: ['Ada sesi, perangkat, atau perubahan pemulihan yang tidak dikenal.', 'Anda menerima permintaan MFA yang tidak dimulai sendiri.', 'Email pemulihan atau notifikasi keamanan tiba-tiba berhenti.'],
    mistake: 'Membalas pesan peringatan atau menekan tautan di dalamnya tanpa memeriksa aplikasi.',
    prevention: 'Aktifkan MFA, gunakan kata sandi unik, dan tinjau sesi aktif dari pengaturan aplikasi yang dibuka langsung.',
    response: 'Gunakan perangkat tepercaya untuk mengamankan akun, akhiri sesi asing, perbarui faktor pemulihan, dan hubungi dukungan resmi.'
  },
  {
    id: 'social-engineering', title: 'Social engineering', visual: 'people',
    summary: 'Manipulasi percakapan memancing informasi sedikit demi sedikit tanpa terlihat seperti serangan teknis.',
    example: 'Penelepon fiktif mengaku mengatur jadwal wawancara dan meminta foto kartu identitas untuk “mencocokkan data”.',
    mechanism: 'Pelaku memanfaatkan rasa sungkan, kepercayaan, atau keinginan membantu. Informasi kecil dapat digabungkan untuk menebak jawaban pemulihan atau menyusun penipuan berikutnya.',
    signals: ['Permintaan data pribadi tidak sebanding dengan tujuan.', 'Penanya menghindari identifikasi atau jalur resmi.', 'Informasi diminta lewat percakapan pribadi yang tidak diharapkan.'],
    mistake: 'Memberi informasi karena pertanyaannya terasa ringan atau pewawancara terdengar meyakinkan.',
    prevention: 'Tanyakan alasan dan dasar permintaan. Bagikan data minimum melalui kanal organisasi yang terverifikasi.',
    response: 'Hentikan percakapan, jangan kirim dokumen, dan verifikasi undangan melalui kontak resmi organisasi.'
  }
];

const educationQuizBank = [
  {
    id: 'vendor-reply', channel: 'Email', category: 'Impersonation', difficulty: 'Menengah',
    title: 'Pembaruan tagihan vendor Sagara', sender: 'Mitra Sagara', address: 'tagihan@mitra-sagara.example', reply: 'billing-update.example',
    time: 'Hari ini · 09.14', context: 'Percakapan sebelumnya memakai alamat balasan vendor yang berbeda.',
    body: 'Mohon periksa ringkasan tagihan periode ini. Jika ada perubahan data pembayaran, balas email ini sebelum pemrosesan berikutnya.',
    answer: 'phish',
    reason: 'Alamat balasan memakai domain lain dari pengirim dan berbeda dari percakapan sebelumnya. Permintaan perubahan pembayaran perlu verifikasi terpisah.',
    action: 'Jangan membalas atau mengubah pembayaran dari email. Hubungi vendor melalui nomor yang sudah tersimpan.'
  },
  {
    id: 'hr-benefit', channel: 'Email', category: 'Urgency tactics', difficulty: 'Menengah',
    title: 'Jadwal pemilihan benefit karyawan', sender: 'Tim People Sagara', address: 'people@ruang-sagara.example', reply: 'people@ruang-sagara.example',
    time: 'Senin · 10.20', context: 'Tim HR sebelumnya mengumumkan jadwal pembaruan benefit di portal internal.',
    body: 'Pemilihan benefit tersedia sampai Jumat. Buka portal internal melalui bookmark perusahaan untuk melihat pilihan. Pesan ini tidak meminta balasan atau kode keamanan.',
    answer: 'legit',
    reason: 'Batas waktunya sesuai konteks pengumuman sebelumnya, alamat pengirim dan balasan konsisten, serta pesan meminta pengguna membuka portal yang sudah dikenal tanpa tautan baru.',
    action: 'Tetap buka portal melalui bookmark atau intranet yang biasa digunakan. Jika ragu, konfirmasi ke HR lewat direktori perusahaan.'
  },
  {
    id: 'support-otp', channel: 'WhatsApp', category: 'Credential requests', difficulty: 'Mudah',
    title: 'Tindak lanjut tiket layanan', sender: 'Pusat Bantuan RuangSaku', address: '+62 811-2000-1010', reply: 'Nomor baru, belum tersimpan',
    time: 'Hari ini · 14.02', context: 'Tidak ada tiket bantuan yang sedang Anda ajukan.',
    body: 'Agar tiket bisa kami tutup, mohon kirim enam angka kode verifikasi yang baru masuk ke ponsel Anda.',
    answer: 'phish',
    reason: 'Pesan meminta kode verifikasi. Dukungan yang sah tidak memerlukan OTP untuk menutup tiket, dan konteks tiketnya tidak Anda mulai.',
    action: 'Jangan kirim kode. Blokir atau laporkan nomor, lalu hubungi bantuan melalui aplikasi resmi.'
  },
  {
    id: 'parcel-status', channel: 'SMS', category: 'Pesan legitimate', difficulty: 'Menengah',
    title: 'Pembaruan status pengiriman', sender: 'LacakAja Express', address: 'Info pengiriman', reply: 'Tidak ada permintaan balasan',
    time: 'Hari ini · 11.36', context: 'Anda memang sedang menunggu paket; nomor resi cocok dengan bukti pembelian.',
    body: 'Paket Anda tiba di hub kota tujuan. Jadwal antar berikutnya dapat dilihat dengan membuka aplikasi LacakAja yang sudah terpasang. Tidak ada biaya tambahan yang diminta.',
    answer: 'legit',
    reason: 'Informasi cocok dengan pesanan yang sedang ditunggu dan tidak meminta pembayaran atau data. Pesan mengarahkan ke aplikasi yang sudah terpasang, bukan ke tautan baru.',
    action: 'Periksa status langsung di aplikasi. Pesan aman pun tetap perlu dicocokkan dengan transaksi yang Anda kenal.'
  },
  {
    id: 'shared-doc', channel: 'Email', category: 'Fake links', difficulty: 'Sulit',
    title: 'Dokumen evaluasi bersama', sender: 'Dina dari Tim Operasi', address: 'dina@ruang-sagara.example', reply: 'dina@ruang-sagara.example',
    time: 'Hari ini · 08.47', context: 'Dina sedang menyiapkan evaluasi, tetapi biasanya dokumen dibagikan lewat drive perusahaan.',
    body: 'Saya sudah merapikan catatan evaluasi. Silakan buka pratinjau lokal ini sebelum rapat: `https://drive-ruang-sagara.example/view/brief`',
    answer: 'phish',
    reason: 'Nama pengirim terlihat cocok, tetapi domain `drive-ruang-sagara.example` bukan domain drive internal yang biasa digunakan. Konteks dokumen tidak membuktikan tujuan tautan aman.',
    action: 'Jangan buka alamat tersebut. Tanyakan kepada Dina melalui chat kerja atau buka drive perusahaan dari bookmark.'
  },
  {
    id: 'office-maintenance', channel: 'Notifikasi akun', category: 'Urgency tactics', difficulty: 'Sulit',
    title: 'Jadwal pemeliharaan ruang kerja', sender: 'Operasional Sagara', address: 'ops@ruang-sagara.example', reply: 'ops@ruang-sagara.example',
    time: 'Hari ini · 13.10', context: 'Perawatan jaringan telah diumumkan pada kalender kantor minggu lalu.',
    body: 'Akses jaringan lantai dua dijadwalkan terhenti pukul 18.00 selama pemeliharaan. Jadwal dan ruang terdampak tercantum di kalender kerja. Tidak ada tindakan akun yang diperlukan.',
    answer: 'legit',
    reason: 'Pesan mendesak dalam arti waktunya dekat, tetapi sesuai pengumuman kalender, pengirim konsisten, dan tidak meminta kredensial atau tindakan di luar prosedur.',
    action: 'Cocokkan dengan kalender kerja. Tenggat waktu saja tidak cukup untuk menyimpulkan pesan phishing.'
  },
  {
    id: 'fake-qr', channel: 'Website / QR', category: 'Fake links', difficulty: 'Menengah',
    title: 'QR pembaruan parkir', sender: 'Informasi Parkir Gedung', address: 'Poster di area parkir', reply: 'Tidak tersedia',
    time: 'Ditemukan di lobi', context: 'Stiker QR terlihat menutupi sebagian kode lama pada mesin parkir.',
    body: 'Setelah dipindai, pratinjau alamat menunjukkan `https://parkir-akses.example/renew`. Halaman meminta nomor identitas dan pembayaran untuk mempertahankan tarif.',
    answer: 'phish',
    reason: 'Stiker menutupi kode yang sudah ada, domain hasil pindai belum dikenal, dan halaman meminta data serta pembayaran yang tidak dapat diverifikasi dari mesin parkir.',
    action: 'Jangan lanjutkan. Tutup halaman dan tanyakan kepada petugas gedung melalui meja informasi yang dikenal.'
  },
  {
    id: 'account-alert', channel: 'Notifikasi akun', category: 'Account takeover', difficulty: 'Menengah',
    title: 'Peringatan perangkat baru', sender: 'Keamanan RuangSaku', address: 'Notifikasi dalam aplikasi', reply: 'Tidak ada balasan',
    time: 'Hari ini · 07.55', context: 'Notifikasi terlihat saat aplikasi RuangSaku dibuka dari ikon yang biasa Anda gunakan.',
    body: 'Perangkat baru masuk ke akun Anda. Jika bukan Anda, buka Pengaturan lalu pilih Keamanan untuk meninjau sesi aktif. Kami tidak meminta kode lewat pesan.',
    answer: 'legit',
    reason: 'Peringatan muncul di dalam aplikasi yang dibuka sendiri dan tidak meminta OTP atau membuka tautan luar. Tetap periksa sesi aktif dari pengaturan resmi.',
    action: 'Tinjau sesi aktif di aplikasi. Jika Anda tidak mengenali perangkat, akhiri sesi asing dan perbarui kata sandi.'
  }
];

let educationState = null;
function ensureEducationState() {
  if (!educationState || educationState.accountId !== (currentAccount && currentAccount.id)) {
    educationState = {
      accountId: currentAccount && currentAccount.id,
      selectedLessonId: null,
      checklist: [false, false, false, false, false],
      quizStarted: false,
      quizItems: [],
      quizIndex: 0,
      quizScore: 0,
      quizAnswer: null,
      quizComplete: false,
      quizRunId: null
    };
  }
  return educationState;
}

function educationLessonDetail(topic) {
  if (!topic) return '';
  return `<section class="edu-detail" id="edu-detail" aria-labelledby="edu-detail-title">
    <div class="edu-detail-top"><div><p class="eyebrow">PANDUAN PRAKTIS</p><h3 id="edu-detail-title" tabindex="-1">${esc(topic.title)}</h3></div>
      <button type="button" class="ghost" data-edu-action="back-lessons">Kembali ke materi</button></div>
    <p class="edu-detail-lead">${esc(topic.mechanism)}</p>
    <div class="edu-detail-grid">
      <article><span class="edu-detail-index">Contoh fiktif</span><p>${esc(topic.example)}</p></article>
      <article><span class="edu-detail-index">Tanda yang diperiksa</span><ul>${topic.signals.map(signal => `<li>${esc(signal)}</li>`).join('')}</ul></article>
      <article><span class="edu-detail-index">Kesalahan umum</span><p>${esc(topic.mistake)}</p></article>
      <article><span class="edu-detail-index">Pencegahan</span><p>${esc(topic.prevention)}</p></article>
      <article class="edu-detail-response"><span class="edu-detail-index">Jika sudah terlanjur</span><p>${esc(topic.response)}</p></article>
    </div>
  </section>`;
}

function educationLessonButton(topic) {
  return `<button type="button" class="edu-learn-link" data-edu-action="open-lesson" data-lesson="${topic.id}" aria-label="Pelajari lebih lanjut tentang ${esc(topic.title)}">Pelajari lebih lanjut <span aria-hidden="true">↗</span></button>`;
}

function educationLessonLibrary() {
  const topic = id => educationTopics.find(item => item.id === id);
  const featured = topic('impersonation');
  const fakeLinks = topic('fake-links');
  const urgency = topic('urgency');
  const credentials = topic('credentials');
  const additional = educationTopics.filter(item => !['impersonation', 'fake-links', 'urgency', 'credentials'].includes(item.id));
  return `<div class="edu-library-featured">
    <article class="edu-feature lesson-visual-${featured.visual}">
      <div class="edu-topic-art" data-edu-visual="${featured.visual}" aria-hidden="true"><span></span><i></i><b></b></div>
      <div class="edu-feature-copy"><span class="edu-topic-kicker">Pola identitas</span><h3>${featured.title}</h3><p>${featured.summary}</p>
        <p class="edu-practice"><b>Yang perlu dicermati</b><br>Nama yang akrab belum membuktikan siapa pengirim sebenarnya.</p>${educationLessonButton(featured)}</div>
    </article>
    <div class="edu-lesson-rail">
      ${[fakeLinks, urgency].map(item => `<article class="edu-mini-lesson lesson-visual-${item.visual}">
        <div class="edu-topic-art" data-edu-visual="${item.visual}" aria-hidden="true"><span></span><i></i><b></b></div>
        <div><span class="edu-topic-kicker">${item.title === 'Fake links' ? 'Tujuan tautan' : 'Tekanan keputusan'}</span><h3>${item.title}</h3><p>${item.summary}</p>${educationLessonButton(item)}</div>
      </article>`).join('')}
    </div>
  </div>
  <article class="edu-credential lesson-visual-${credentials.visual}">
    <div class="edu-topic-art" data-edu-visual="${credentials.visual}" aria-hidden="true"><span></span><i></i><b></b></div>
    <div><span class="edu-topic-kicker">Rahasia akun</span><h3>${credentials.title}</h3><p>${credentials.summary}</p>
      <p class="edu-practice"><b>Ingat:</b> OTP dan kode pemulihan tidak dibagikan kepada siapa pun.</p></div>${educationLessonButton(credentials)}
  </article>
  <div class="edu-more-lessons"><div class="edu-subhead"><h3>Jelajahi pola lainnya</h3><p>Variasi kanal dan cara manipulasi yang juga patut dikenali.</p></div>
    <div class="edu-topic-list">${additional.map(item => `<article class="edu-topic-row lesson-visual-${item.visual}">
      <div class="edu-topic-art" data-edu-visual="${item.visual}" aria-hidden="true"><span></span><i></i><b></b></div>
      <div><h4>${item.title}</h4><p>${item.summary}</p>${educationLessonButton(item)}</div>
    </article>`).join('')}</div>
  </div>`;
}

function educationQuizMarkup() {
  const state = ensureEducationState();
  if (state.quizComplete) {
    return `<div class="edu-quiz-result" aria-live="polite"><div class="edu-result-mark" aria-hidden="true">${state.quizScore >= 4 ? '✓' : '↻'}</div>
      <p class="edu-topic-kicker">Kuis selesai</p><h3>${state.quizScore} dari 5 jawaban tepat</h3>
      <p>${state.quizScore >= 4 ? 'Bagus. Tetap verifikasi konteks sebelum bertindak.' : 'Tinjau kembali materi yang relevan, lalu coba putaran baru dengan contoh yang berbeda.'}</p>
      <button type="button" class="primary" data-edu-action="quiz-retry">Ulangi dengan contoh lain</button>
      <p class="edu-quiz-note">Skor ini hanya untuk sesi kuis edukasi dan tidak mengubah XP simulasi.</p></div>`;
  }
  if (!state.quizStarted) {
    return `<div class="edu-quiz-start"><div class="edu-quiz-start-visual" aria-hidden="true"><span></span><i></i><b></b></div>
      <div><p class="edu-topic-kicker">Latihan singkat · 5 pertanyaan</p><h3>Uji cara Anda membaca konteks</h3>
        <p>Periksa pengirim, alamat, dan alasan permintaan. Ada pesan aman dengan tenggat wajar, jadi jangan menilai dari satu petunjuk saja.</p>
        <button type="button" class="primary" data-edu-action="quiz-start">Mulai kuis</button>
        <p class="edu-quiz-note">Semua skenario fiktif. Jawaban kuis tidak mengubah XP atau riwayat simulasi.</p></div></div>`;
  }
  const question = state.quizItems[state.quizIndex];
  const number = state.quizIndex + 1;
  const answered = state.quizAnswer !== null;
  const correct = answered && state.quizAnswer === question.answer;
  const options = `<div class="edu-quiz-options" role="group" aria-label="Pilih klasifikasi pesan">
    <button type="button" class="edu-answer ${answered && question.answer === 'phish' ? 'is-correct' : ''} ${answered && state.quizAnswer === 'phish' && !correct ? 'is-wrong' : ''}" data-edu-action="quiz-answer" data-answer="phish" ${answered ? 'disabled' : ''}><span class="edu-answer-icon" aria-hidden="true">!</span><span><b>Phishing</b><small>Ada indikasi pesan berisiko</small></span></button>
    <button type="button" class="edu-answer ${answered && question.answer === 'legit' ? 'is-correct' : ''} ${answered && state.quizAnswer === 'legit' && !correct ? 'is-wrong' : ''}" data-edu-action="quiz-answer" data-answer="legit" ${answered ? 'disabled' : ''}><span class="edu-answer-icon" aria-hidden="true">✓</span><span><b>Legitimate</b><small>Pesan sesuai konteks dan prosedur</small></span></button>
  </div>`;
  const feedback = answered ? `<div class="edu-quiz-feedback ${correct ? 'is-good' : 'is-bad'}" aria-live="polite">
    <div class="edu-feedback-title"><b>${correct ? 'Jawaban tepat' : 'Perlu ditinjau kembali'}</b><span>Jawaban: ${question.answer === 'phish' ? 'Phishing' : 'Legitimate'}</span></div>
    <p>${esc(question.reason)}</p><p><b>Langkah aman:</b> ${esc(question.action)}</p>
    <button type="button" class="primary" data-edu-action="quiz-next">${number === 5 ? 'Lihat hasil' : 'Pertanyaan berikutnya'} <span aria-hidden="true">→</span></button></div>` : '';
  return `<div class="edu-quiz-header"><div><p class="edu-topic-kicker">Pertanyaan ${number} dari 5</p><h3>Apakah pesan ini phishing atau legitimate?</h3></div>
    <div class="edu-quiz-progress" role="progressbar" aria-label="Progres kuis" aria-valuemin="1" aria-valuemax="5" aria-valuenow="${number}"><span style="width:${number * 20}%"></span></div></div>
    <div class="edu-quiz-layout"><article class="edu-message" aria-label="Contoh pesan simulasi">
      <div class="edu-message-head"><div class="edu-message-avatar" aria-hidden="true">${esc(question.sender.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase())}</div>
        <div><b>${esc(question.sender)}</b><small>${esc(question.channel)} · ${esc(question.time)}</small></div><span class="edu-channel-label">${esc(question.channel)}</span></div>
      <h4>${esc(question.title)}</h4><div class="edu-message-meta"><span>Dari: <b>${esc(question.address)}</b></span><span>Balas ke: <b>${esc(question.reply)}</b></span></div>
      <p class="edu-message-context"><b>Konteks</b> ${esc(question.context)}</p><p class="edu-message-body">${esc(question.body).replace(/`([^`]+)`/g, '<code>$1</code>')}</p>
      <p class="edu-sim-notice">Contoh fiktif untuk pembelajaran. Alamat tidak membuka situs.</p></article>
      <aside class="edu-quiz-decision"><p class="edu-topic-kicker">Analisis Anda</p><p class="muted">Jangan terburu-buru. Cocokkan identitas, tujuan, dan konteks pesan.</p>${options}${feedback}</aside></div>`;
}

function renderEducationQuiz() {
  const target = document.querySelector('#edu-quiz-content');
  if (target) target.innerHTML = educationQuizMarkup();
}

function education(page) {
  const state = ensureEducationState();
  const categoryCounts = educationQuizBank.reduce((counts, question) => {
    counts[question.category] = (counts[question.category] || 0) + 1;
    return counts;
  }, {});
  const distribution = ['Impersonation', 'Fake links', 'Urgency tactics', 'Credential requests', 'QR phishing',
    'Malicious attachments', 'Account takeover', 'Social engineering', 'Pesan legitimate']
    .map(category => [category, categoryCounts[category] || 0]);
  const maximum = Math.max(...distribution.map(item => item[1]));
  const indicators = [
    ['Alamat tidak cocok konteks', 'Periksa domain induk dan alamat balasan, bukan nama tampilan saja.'],
    ['Meminta informasi rahasia', 'Kata sandi, OTP, PIN, dan kode pemulihan tidak untuk dibagikan.'],
    ['Menekan untuk bertindak', 'Tenggat perlu diuji bersama bukti dan prosedur yang dikenal.'],
    ['Lampiran atau QR tak terduga', 'Pratinjau tujuan dan konfirmasikan konteks sebelum membuka.']
  ];
  const checklist = [
    ['Periksa identitas pengirim', 'Cocokkan alamat, nomor, dan hubungan dengan konteks pesan.'],
    ['Periksa domain dan tujuan tautan', 'Nama tombol tidak selalu sama dengan alamat tujuan.'],
    ['Nilai alasan dan konteks permintaan', 'Apakah tindakan tersebut wajar dan memang Anda mulai?'],
    ['Verifikasi lewat kanal yang dikenal', 'Gunakan aplikasi, nomor, atau direktori yang sudah tersimpan.'],
    ['Jangan bagikan password atau OTP', 'Pihak tepercaya tidak membutuhkan kode keamanan rahasia Anda.']
  ];
  const detail = educationTopics.find(topic => topic.id === state.selectedLessonId);
  page.innerHTML = `<div class="edu-page">
    <section class="edu-hero" aria-labelledby="edu-hero-title">
      <div class="edu-hero-copy"><h2 id="edu-hero-title">Tren &amp; Edukasi Keamanan Siber</h2>
        <p>Pelajari pola penipuan digital, periksa petunjuknya, lalu latih keputusan yang lebih aman dalam contoh lokal.</p>
        <div class="edu-hero-actions"><button type="button" class="primary" data-edu-action="scroll-lessons">Mulai Belajar <span aria-hidden="true">→</span></button>
          <button type="button" class="ghost" data-edu-action="scroll-quiz">Uji Kemampuan <span aria-hidden="true">↗</span></button></div>
      </div><figure class="edu-hero-art"><img src="assets/education/phishguard-education-hero.png" alt="Ilustrasi pesan mencurigakan yang disaring oleh perisai digital untuk pembelajaran keamanan." width="1536" height="1024"></figure>
    </section>

    <section class="edu-summary" aria-labelledby="edu-summary-title">
      <div class="edu-section-head"><div><p class="eyebrow">RINGKASAN MATERI</p><h2 id="edu-summary-title">Pola yang dipelajari</h2>
        <p>Distribusi contoh edukasi dan indikator yang dibahas di halaman ini.</p></div><span class="edu-demo-label"><i aria-hidden="true"></i>Data demo</span></div>
      <p class="edu-demo-caption">Jumlah pertanyaan dalam bank kuis prototype, bukan frekuensi serangan atau statistik ancaman aktual.</p>
      <div class="edu-summary-layout"><figure class="edu-distribution" aria-labelledby="edu-chart-title">
        <figcaption><h3 id="edu-chart-title">Pertanyaan kuis per kategori</h3><p>Jumlah contoh fiktif yang tersedia untuk latihan.</p></figcaption>
        <div class="edu-bars" role="list">${distribution.map(([label, count]) => `<div class="edu-bar-row" role="listitem" aria-label="${label}: ${count} contoh demo">
          <span>${label}</span><div class="edu-bar-track" aria-hidden="true"><i style="width:${count / maximum * 100}%"></i></div><b>${count}</b></div>`).join('')}</div>
        <p class="edu-chart-foot">Data demo · Kategori dengan 0 belum memiliki soal kuis</p></figure>
        <div class="edu-indicators"><div class="edu-indicator-heading"><h3>Indikator yang perlu dilatih</h3><p>Gunakan beberapa petunjuk sekaligus, bukan satu tanda saja.</p></div>
          ${indicators.map((item, index) => `<article class="edu-indicator"><span class="edu-indicator-mark mark-${index + 1}" aria-hidden="true">${['@', '!', '↗', '□'][index]}</span><div><h4>${item[0]}</h4><p>${item[1]}</p></div></article>`).join('')}</div></div>
    </section>

    <section class="edu-lessons" id="edu-lessons" aria-labelledby="edu-lessons-title">
      <div class="edu-section-head"><div><p class="eyebrow">PERPUSTAKAAN BELAJAR</p><h2 id="edu-lessons-title" tabindex="-1">Materi belajar</h2>
        <p>Kenali pola utama dan cara memeriksanya secara praktis.</p></div><span class="edu-count">8 topik fiktif</span></div>
      ${detail ? educationLessonDetail(detail) : ''}${educationLessonLibrary()}
    </section>

    <section class="edu-quiz" id="edu-quiz" aria-labelledby="edu-quiz-title">
      <div class="edu-section-head"><div><p class="eyebrow">LATIHAN INTERAKTIF</p><h2 id="edu-quiz-title" tabindex="-1">Uji kemampuan</h2>
        <p>Contoh beragam untuk melatih analisis, bukan sekadar menebak kata kunci.</p></div><span class="edu-count">5 pertanyaan · fiktif</span></div>
      <div id="edu-quiz-content">${educationQuizMarkup()}</div>
    </section>

    <section class="edu-checklist" aria-labelledby="edu-checklist-title">
      <div class="edu-check-main"><div class="edu-section-head"><div><p class="eyebrow">KEBIASAAN AMAN</p><h2 id="edu-checklist-title">Jeda sebelum merespons</h2>
        <p>Gunakan pemeriksaan singkat ini sebelum membalas, mengklik, atau membagikan informasi.</p></div><span class="edu-check-count" id="edu-check-count" aria-live="polite">${state.checklist.filter(Boolean).length} dari 5 diperiksa</span></div>
        <div class="edu-check-progress" role="progressbar" aria-label="Checklist keamanan" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${state.checklist.filter(Boolean).length}"><span id="edu-check-progress-fill" style="width:${state.checklist.filter(Boolean).length * 20}%"></span></div>
        <div class="edu-check-list">${checklist.map(([title, description], index) => `<label class="edu-check-row ${state.checklist[index] ? 'checked' : ''}">
          <input type="checkbox" data-edu-check="${index}" ${state.checklist[index] ? 'checked' : ''}><span class="edu-check-box" aria-hidden="true"></span>
          <span class="edu-check-copy"><b>${title}</b><small>${description}</small></span></label>`).join('')}</div>
      </div><aside class="edu-check-aside"><div class="edu-check-illustration" aria-hidden="true"><span></span><i></i><b></b></div>
        <h3>Berhenti sejenak, lihat konteks.</h3><p>Identitas yang dikenal, tenggat, dan tautan tetap perlu diperiksa dari jalur yang Anda percaya.</p>
        <span class="edu-check-reminder">Latihan ini tidak menyimpan data pribadi.</span></aside>
    </section>
  </div>`;
}

function beginEducationQuiz() {
  const state = ensureEducationState();
  const phishing = shuffled(educationQuizBank.filter(question => question.answer === 'phish')).slice(0, 2);
  const legitimate = shuffled(educationQuizBank.filter(question => question.answer === 'legit')).slice(0, 2);
  const remaining = shuffled(educationQuizBank.filter(question => ![...phishing, ...legitimate].some(chosen => chosen.id === question.id))).slice(0, 1);
  state.quizItems = shuffled([...phishing, ...legitimate, ...remaining]);
  state.quizIndex = 0;
  state.quizScore = 0;
  state.quizAnswer = null;
  state.quizComplete = false;
  state.quizStarted = true;
  state.quizRunId = currentAccount.id + '-quiz-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  renderEducationQuiz();
}

function syncEducationChecklist() {
  const state = ensureEducationState();
  const inputs = [...document.querySelectorAll('[data-edu-check]')];
  if (!inputs.length) return;
  state.checklist = inputs.map(input => input.checked);
  inputs.forEach(input => input.closest('.edu-check-row').classList.toggle('checked', input.checked));
  const checked = state.checklist.filter(Boolean).length;
  const counter = document.querySelector('#edu-check-count');
  const progress = document.querySelector('.edu-check-progress');
  const fill = document.querySelector('#edu-check-progress-fill');
  if (counter) counter.textContent = `${checked} dari 5 diperiksa`;
  if (progress) progress.setAttribute('aria-valuenow', String(checked));
  if (fill) fill.style.width = `${checked * 20}%`;
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
  page.innerHTML = '<div class="notice">Aktivasi paket adalah simulasi lokal untuk presentasi. Tidak ada pembayaran, penagihan, atau data kartu yang diproses.</div>' +
    '<section class="card active-package"><div><span class="eyebrow">STATUS AKUN · ' + (currentAccount.role === 'company' ? 'PERUSAHAAN' : 'INDIVIDU') + '</span><h2>' + esc(activePlanLabel()) + '</h2><p class="muted">' + expiryStatus + (subscriptionData.status === 'expired' ? ' · Premium berakhir ' + formatDate(subscriptionData.previousExpiresAt) + '; progres tetap tersimpan.' : '') + '</p>' + freeUsage + '</div><span class="tag">' + (subscriptionData.status === 'active' ? 'Aktif' : 'Kembali ke Free') + '</span></section>' +
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
function shuffled(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}
function chooseSession() {
  const availableScenarios = hasAccess('advanced-scenarios')
    ? scenarioBank
    : scenarioBank.filter(item => item.difficulty !== 'Hard');
  if (availableScenarios.length < 5) throw new Error('Scenario bank cannot form a five-scenario session for this package.');
  const valid = [];
  function visit(start, chosen) {
    if (chosen.length === 5) {
      const difficulties = new Set(chosen.map(item => item.difficulty));
      const channels = new Set(chosen.map(item => item.channel));
      const phishing = chosen.filter(item => item.answer === 'phish').length;
      const difficultyMixIsValid = hasAccess('advanced-scenarios') ? difficulties.size === 3 : difficulties.size >= 1 && !difficulties.has('Hard');
      if (difficultyMixIsValid && channels.size >= 4 && phishing >= 2 && phishing <= 4) valid.push(chosen);
      return;
    }
    for (let index = start; index < availableScenarios.length; index++) visit(index + 1, [...chosen, availableScenarios[index]]);
  }
  visit(0, []);
  if (!valid.length) throw new Error('Scenario bank cannot form a valid five-scenario session.');
  const priority = set => hasAccess('risk-report')
    ? set.reduce((sum, scenario) => sum + Math.max(0, (state.weak[scenario.category] || 0) - (state.recognized[scenario.category] || 0) * 0.5), 0)
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
  const sessionId = currentAccount.id + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
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
function iconSvg(channel) {
  const paths = {
    WhatsApp: '<path d="M20.2 11.5a8.1 8.1 0 0 1-12 7.1L4 20l1.3-4A8.1 8.1 0 1 1 20.2 11.5Z"/><path d="M8.4 8.1c.3-.4.6-.4.9-.1l1 1.4c.2.3.1.6-.1.8l-.5.6c.5 1 1.3 1.8 2.4 2.3l.6-.7c.2-.2.5-.3.8-.1l1.4.7c.3.2.4.5.2.9-.4.8-1.1 1.2-2 1.2-2.5-.2-5.7-3.2-5.9-5.6-.1-.7.4-1.2 1.2-1.4Z"/>',
    Email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    SMS: '<path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8 8 0 0 1-4-.9L4 20l1.5-3.4A7.2 7.2 0 0 1 4 12c0-4.1 3.6-7 8-7s8 2.5 8 6.5Z"/><path d="M8 11h8M8 14h5"/>',
    Website: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    'Notifikasi akun': '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>'
  };
  return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (paths[channel] || paths.Email) + '</svg>';
}
function activeScenario() {
  if (!state.session) return null;
  return scenarioBank.find(item => item.id === state.session.ids[state.session.index]) || null;
}
function scenarioAttachment(scenario) {
  if (scenario.attachment && scenario.attachment.name) return scenario.attachment;
  const label = scenario.link ? String(scenario.link.label || '') : '';
  const match = label.match(/(?:^|[\s:·])([^/\\\s:·]+\.(?:pdf|apk|zip|png|jpe?g|webp|docx?))$/i);
  if (!match || !/\b(unggah|lampiran|terlampir|file)\b/i.test(scenario.message || '')) return null;
  const extension = match[1].split('.').pop().toUpperCase();
  return { name: match[1], type: extension, size: scenario.attachmentSize || '' };
}
function messageParagraphs(scenario, linkClass) {
  const label = scenario.link && scenario.link.label ? safeText(scenario.link.label) : '';
  return String(scenario.message || '').split(/\n\s*\n/).map(paragraph => {
    let content = safeText(paragraph).replace(/\n/g, '<br>');
    if (label) content = content.split(label).join('<span class="' + linkClass + '">' + label + '</span>');
    return '<p>' + content + '</p>';
  }).join('');
}
function simulatedLinkCard(scenario, variant) {
  if (!scenario.link) return '';
  let host = '';
  try { host = new URL(scenario.link.url).hostname; } catch (error) { host = scenario.sender.domain || ''; }
  return '<button type="button" class="simulated-link-card ' + variant + '" data-sim-action="analyze-link" aria-controls="link-inspector" aria-expanded="false" aria-label="Analisis tautan simulasi: ' + safeText(scenario.link.label) + '"><span class="sim-link-mark" aria-hidden="true">↗</span>' +
    '<span class="simulated-link-copy"><b>' + safeText(scenario.link.label) + '</b><small>' + safeText(host) + '</small><small class="sim-link-action">Periksa tujuan</small></span></button>';
}
function scenarioAddress(scenario) {
  try {
    const url = new URL(scenario.link.url);
    return url.hostname + url.pathname + url.search;
  } catch (error) {
    return scenario.sender.domain || scenario.sender.address || '';
  }
}
function simulatedAttachmentCard(scenario, variant) {
  const file = scenarioAttachment(scenario);
  if (!file) return '';
  const type = String(file.type || String(file.name).split('.').pop() || 'FILE').toUpperCase();
  const typeClass = type.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const size = file.size ? ' · ' + safeText(file.size) : '';
  return '<div class="simulated-attachment ' + variant + '" role="group" aria-label="Lampiran simulasi ' + safeText(file.name) + '"><span class="attachment-type' + (typeClass ? ' attachment-' + typeClass : '') + '" aria-hidden="true">' + safeText(type) +
    '</span><span class="attachment-copy"><b>' + safeText(file.name) + '</b><small>' + safeText(type) + ' · lampiran simulasi' + size + '</small></span><span class="attachment-preview">Pratinjau</span></div>';
}
function renderWhatsAppMessage(scenario) {
  const sender = scenario.sender;
  const initials = sender.initials || sender.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  const hasInlineLink = scenario.link && String(scenario.message).includes(scenario.link.label);
  const attachment = simulatedAttachmentCard(scenario, 'wa-attachment');
  const link = !hasInlineLink && !attachment ? simulatedLinkCard(scenario, 'wa-link') : '';
  return '<div class="message-app whatsapp-app"><header class="whatsapp-toolbar"><span class="app-back" aria-hidden="true">‹</span><span class="app-avatar" style="--sender-color:' + safeText(sender.color) + '">' + safeText(initials) +
    '</span><span class="app-contact"><b>' + safeText(sender.name) + '</b><small>' + safeText(sender.address || sender.role) + '</small></span><span class="app-name">WhatsApp</span><span class="app-info" aria-hidden="true">i</span></header>' +
    '<section class="whatsapp-chat" aria-label="Percakapan WhatsApp simulasi"><div class="chat-day-label">PESAN SIMULASI</div><div class="whatsapp-bubble">' +
    '<div class="chat-message-copy">' + messageParagraphs(scenario, 'message-inline-link') + '</div>' + attachment + link + '<div class="bubble-meta"><time>' + safeText(scenario.time) + '</time><span class="message-checks" aria-hidden="true">✓✓</span></div></div></section>' +
    '</div>';
}
function renderSmsMessage(scenario) {
  const sender = scenario.sender;
  const initials = sender.initials || sender.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  const hasInlineLink = scenario.link && String(scenario.message).includes(scenario.link.label);
  return '<div class="message-app sms-app"><header class="sms-toolbar"><span class="app-back" aria-hidden="true">‹</span><span class="app-avatar" style="--sender-color:' + safeText(sender.color) + '">' + safeText(initials) +
    '</span><span class="app-contact"><b>' + safeText(sender.name) + '</b><small>' + safeText(sender.address || sender.role) + '</small></span><span class="sms-info" aria-hidden="true">⋮</span></header>' +
    '<section class="sms-chat" aria-label="SMS simulasi"><div class="sms-time-divider"><span>Pesan masuk</span><time>' + safeText(scenario.time) + '</time></div><div class="sms-bubble">' +
    messageParagraphs(scenario, 'message-inline-link') + (!hasInlineLink ? simulatedLinkCard(scenario, 'sms-link') : '') + simulatedAttachmentCard(scenario, 'sms-attachment') + '</div></section>' +
    '</div>';
}
function renderEmailMessage(scenario) {
  const sender = scenario.sender;
  const initials = sender.initials || sender.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  const hasInlineLink = scenario.link && String(scenario.message).includes(scenario.link.label);
  const link = scenario.link && !hasInlineLink ? simulatedLinkCard(scenario, 'email-link') : '';
  return '<div class="message-app email-app"><div class="email-app-bar"><span class="email-app-mark" aria-hidden="true">✉</span><span>Email</span><span class="email-demo-label">KOTAK MASUK</span></div><article class="email-paper" aria-label="Email simulasi"><div class="email-subject-row"><h3>' +
    safeText(scenario.subject) + '</h3><span class="email-more" aria-hidden="true">⋮</span></div><div class="email-sender-row"><span class="app-avatar" style="--sender-color:' + safeText(sender.color) + '">' + safeText(initials) + '</span><span class="email-sender-copy"><b>' +
    safeText(sender.name) + '</b><small>' + safeText(sender.address) + '</small></span><time>' + safeText(scenario.time) + '</time></div><p class="email-to-line">kepada saya <span aria-hidden="true">⌄</span></p><div class="email-body-copy">' +
    messageParagraphs(scenario, 'message-inline-link') + link + simulatedAttachmentCard(scenario, 'email-attachment') + '</div></article></div>';
}
function renderAccountNotification(scenario) {
  const sender = scenario.sender;
  const initials = sender.initials || sender.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  const hasInlineLink = scenario.link && String(scenario.message).includes(scenario.link.label);
  const link = scenario.link && !hasInlineLink ? simulatedLinkCard(scenario, 'notification-link') : '';
  return '<div class="message-app account-notification-app"><div class="notification-device-label">NOTIFIKASI</div><article class="account-notification" aria-label="Notifikasi keamanan simulasi">' +
    '<header class="notification-app-header"><span class="notification-app-icon" aria-hidden="true">' + iconSvg('Notifikasi akun') + '</span><span class="notification-app-name"><b>' +
    safeText(sender.name) + '</b><small>' + safeText(sender.role) + '</small></span><time>' + safeText(scenario.time) + '</time></header><div class="notification-content"><div class="notification-kind">PEMBERITAHUAN KEAMANAN</div><h3>' +
    safeText(scenario.title) + '</h3><p class="notification-subject">' + safeText(scenario.subject) + '</p><div class="notification-copy">' + messageParagraphs(scenario, 'message-inline-link') + '</div>' + link +
    '<div class="notification-service"><span class="app-avatar" style="--sender-color:' + safeText(sender.color) + '">' + safeText(initials) + '</span><span><small>LAYANAN</small><b>' +
    safeText(sender.domain || sender.address) + '</b></span><span class="notification-status">Simulasi</span></div></div></article></div>';
}
function websiteLoginPreview() {
  return '<div class="website-login-preview" role="group" aria-label="Formulir login simulasi nonaktif"><span class="website-form-kicker">MASUK KE PORTAL</span><label>Email pengguna<input type="email" disabled autocomplete="off" placeholder="nama@organisasi.example"></label>' +
    '<label>Kata sandi<input type="password" disabled autocomplete="off" placeholder="Tidak menerima kata sandi"></label><button type="button" disabled>Masuk · nonaktif</button><small>Pratinjau visual saja. Kolom ini tidak menerima atau menyimpan data.</small></div>';
}
function renderWebsitePreview(scenario) {
  const sender = scenario.sender;
  const initials = sender.initials || sender.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  const loginContext = /login|masuk|password|kata sandi|kredensial/i.test([scenario.title, scenario.subject, scenario.message].join(' '));
  return '<div class="message-app website-app"><header class="browser-chrome"><div class="browser-controls" aria-hidden="true"><span>‹</span><span>›</span><span>↻</span></div><div class="browser-address"><span class="browser-globe" aria-hidden="true">◎</span><span>' +
    safeText(scenarioAddress(scenario)) + '</span></div><span class="browser-preview-tag">PRATINJAU LOKAL</span></header><section class="website-page" aria-label="Halaman website simulasi"><header class="website-brandbar"><span class="website-brand-icon" style="--sender-color:' + safeText(sender.color) + '">' +
    safeText(initials) + '</span><span class="website-brand-copy"><b>' + safeText(sender.name) + '</b><small>' + safeText(sender.role) + '</small></span><span class="website-nav-label">Portal</span></header><main class="website-content"><span class="website-page-kicker">' +
    safeText(scenario.subject) + '</span><h3>' + safeText(scenario.title) + '</h3><div class="website-message-copy">' + messageParagraphs(scenario, 'message-inline-link') + '</div>' +
    (loginContext ? websiteLoginPreview() : '') + '<div class="website-preview-status"><span class="preview-status-dot"></span><span><b>Lingkungan simulasi edukasi</b><small>Alamat hanya ditampilkan sebagai teks. Halaman tidak terhubung ke layanan atau mengirim data.</small></span></div></main></section></div>';
}
function renderLegacyMessage(scenario) {
  const sender = scenario.sender;
  const initials = sender.initials || sender.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  return '<header class="sim-sender"><div class="sender-avatar" style="--sender-color:' + safeText(sender.color) + '"><span>' + safeText(initials) +
    '</span></div><div class="sender-copy"><b>' + safeText(sender.name) + '</b><small>' + safeText(sender.role) + '</small></div><span class="channel-icon" title="Kanal ' +
    safeText(scenario.channel) + '">' + iconSvg(scenario.channel) + '<span>' + safeText(scenario.channel) + '</span></span></header><div class="sim-message-meta"><b>' +
    safeText(scenario.subject) + '</b><time>' + safeText(scenario.time) + '</time></div><div class="sim-message-body">' + messageParagraphs(scenario, 'sim-link-label') +
    (scenario.link ? '<p class="sim-link-label">Teks tautan dalam pesan: <span>' + safeText(scenario.link.label) + '</span></p>' : '') + '</div>' +
    '<footer class="sim-message-footer"><span>' + iconSvg(scenario.channel) + ' ' + safeText(scenario.channel) + '</span></footer>';
}
function renderScenarioMessage(scenario) {
  if (scenario.channel === 'WhatsApp') return renderWhatsAppMessage(scenario);
  if (scenario.channel === 'SMS') return renderSmsMessage(scenario);
  if (scenario.channel === 'Email') return renderEmailMessage(scenario);
  if (scenario.channel === 'Notifikasi akun') return renderAccountNotification(scenario);
  if (scenario.channel === 'Website') return renderWebsitePreview(scenario);
  return renderLegacyMessage(scenario);
}
function inspectPanel(scenario) {
  const sender = scenario.sender;
  return '<div class="sim-inspector" id="sender-inspector" hidden><div><span>Dari / pengirim</span><b>' + safeText(sender.address) +
    '</b></div><div><span>Domain pengirim</span><b>' + safeText(sender.domain) + '</b></div>' +
    (sender.replyTo ? '<div><span>Reply-To</span><b>' + safeText(sender.replyTo) + '</b></div>' : '') +
    '<div><span>Konteks</span><b>' + safeText(scenario.context) + '</b></div></div>';
}
function linkPanel(scenario) {
  if (!scenario.link) {
    return '<div class="sim-inspector" id="link-inspector" hidden><p>Pesan ini tidak menyertakan tautan. Periksa pengirim dan konteks.</p></div>';
  }
  let host = '';
  try { host = new URL(scenario.link.url).hostname; } catch (error) { host = 'URL tidak valid'; }
  return '<div class="sim-inspector link-inspector" id="link-inspector" hidden><div><span>Teks yang terlihat</span><b>' + safeText(scenario.link.label) +
    '</b></div><div><span>Tujuan simulasi</span><b>' + safeText(scenario.link.url) + '</b></div><div><span>Domain tujuan</span><b>' + safeText(host) +
    '</b></div><div><span>Domain yang diharapkan</span><b>' + safeText(scenario.link.expectedDomain) +
    '</b></div><small>Alamat ditampilkan sebagai teks lokal. Tidak ada tautan yang dibuka.</small></div>';
}
function sessionIntro(page) {
  if (!hasAccess('simulation')) {
    page.innerHTML = '<section class="card locked-feature"><h2>Simulasi individu tidak tersedia pada akun perusahaan</h2><p class="muted">Gunakan dashboard organisasi untuk mencatat latihan karyawan pada workspace yang terpisah.</p><button class="primary" data-v="company">Buka dashboard perusahaan</button></section>';
    return;
  }
  const remaining = freeQuotaRemaining();
  const limitReached = remaining === 0;
  const quotaLabel = getSubscription().usage.count > 3
    ? getSubscription().usage.count + ' sesi tercatat · batas Free 3'
    : getSubscription().usage.count + '/3 sesi digunakan';
  const quotaNote = getSubscription().plan === 'Free'
    ? '<div class="simulation-quota"><b>Kuota Free bulan ini</b><span>' + quotaLabel + ' · ' + remaining + ' tersisa</span><small>Kuota diperbarui ' + formatDate(nextPeriodDate(new Date())) + '. Satu sesi berisi lima skenario.</small></div>'
    : '<div class="simulation-quota"><b>' + esc(activePlanLabel()) + '</b><span>Simulasi tanpa batas selama paket aktif</span><small>' + (getSubscription().expiresAt ? 'Paket berakhir ' + formatDate(getSubscription().expiresAt) : 'Data progres tetap terikat pada akun ini.') + '</small></div>';
  page.innerHTML = '<section class="card session-intro"><span class="eyebrow">LATIHAN LOKAL · DATA FIKTIF</span><h2>Latih penilaian, bukan refleks.</h2>' +
    '<p class="muted">Satu sesi berisi lima contoh dari WhatsApp, email, SMS, notifikasi, dan halaman web. Pesan legitimate dan phishing dicampur; jawaban baru dibahas setelah Anda memilih.</p>' +
    '<div class="session-facts"><span>5 skenario acak</span><span>' + (hasAccess('advanced-scenarios') ? 'Easy · Medium · Hard' : 'Easy · Medium · Hard tersedia di Premium') + '</span><span>Tautan tidak membuka situs</span></div>' + quotaNote +
    (limitReached ? '<button class="primary" type="button" data-open-plan>Kuota habis · lihat paket</button>' : '<button class="primary" type="button" data-sim-action="start">Mulai sesi simulasi</button>') + '</section>';
}
function sessionSummary(page) {
  const session = state.session;
  const results = session.answers.filter(Boolean);
  const correct = results.filter(item => item.correct).length;
  const earnedXp = results.reduce((sum, item) => sum + item.xp, 0);
  const restartAction = canStartSimulation()
    ? '<button class="primary" data-sim-action="restart">Mulai sesi baru</button>'
    : '<div class="simulation-quota"><b>Kuota Free bulan ini sudah habis</b><span>Progres dan hasil sesi ini tetap tersimpan.</span><small>Kuota diperbarui ' + formatDate(nextPeriodDate(new Date())) + '.</small></div><button class="primary" data-open-plan>Lihat paket Premium</button>';
  page.innerHTML = '<section class="card session-summary"><span class="eyebrow">SESI SELESAI</span><h2>Hasil latihan Anda</h2>' +
    '<p class="muted">Lima skenario dicatat satu kali. Pembahasan tersedia di riwayat profil akun ini.</p><div class="grid three">' +
    '<div><span class="mini-score">' + correct + '/5</span><br><small class="muted">jawaban tepat</small></div><div><span class="mini-score">' + earnedXp +
    '</span><br><small class="muted">XP sesi</small></div><div><span class="mini-score">' + state.streak + '</span><br><small class="muted">streak saat ini</small></div></div>' +
    '<div class="session-review">' + results.map((result, index) => {
      const scenario = scenarioBank.find(item => item.id === session.ids[index]);
      return '<div class="activity"><i class="dot ' + (result.correct ? '' : 'bad') + '"></i><div><b>' + safeText(scenario ? scenario.title : 'Skenario') +
        '</b><br><span class="muted">' + safeText(scenario ? scenario.difficulty : '') + ' · ' + (result.correct ? 'Tepat' : 'Perlu latihan') + ' · ' + result.xp + ' XP</span></div></div>';
    }).join('') + '</div>' + restartAction +
    '<button class="ghost session-dashboard" data-sim-action="dashboard">Kembali ke dashboard</button></section>';
}
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
    ? '<div class="choices"><button class="choice ' + (priorAnswer.choice === 'phish' ? 'choice-phish' : 'choice-legit') + '" disabled aria-disabled="true">' + (priorAnswer.choice === 'phish' ? 'Tandai phishing' : 'Tandai legitimate') + '</button></div>'
    : '<div class="choices"><button class="choice choice-phish" data-sim-action="answer" data-answer="phish">Tandai phishing</button>' +
      '<button class="choice choice-legit" data-sim-action="answer" data-answer="legit">Tandai legitimate</button></div>';
  const feedbackMarkup = priorAnswer
    ? '<section class="card feedback-card show ' + (priorAnswer.correct ? '' : 'wrong') + '" id="result" aria-live="polite"><h3>' +
      (priorAnswer.correct ? 'Jawaban tepat' : 'Belum tepat, pelajari indikatornya') + '</h3><p>' + safeText(scenario.feedback.summary) + '</p><p class="answer-result">' +
      (priorAnswer.correct ? '+' + priorAnswer.xp + ' XP · skor dan progres diperbarui' : '0 XP · streak direset, kategori dicatat untuk latihan adaptif') +
      '</p><b>Indikator yang perlu diperhatikan</b><ul class="flags">' + scenario.feedback.clues.map(clue => '<li>' + safeText(clue) + '</li>').join('') +
      '</ul><p><b>' + (scenario.answer === 'phish' ? 'Tindakan aman' : 'Tetap verifikasi bila ragu') + ':</b> ' + safeText(scenario.feedback.action) +
      '</p><button class="primary" data-sim-action="next">' + (session.index === 4 ? 'Lihat ringkasan sesi' : 'Lanjut ke skenario berikutnya') + '</button></section>'
    : '';
  page.innerHTML = '<div class="grid simulate-layout"><section class="card scenario-card"><div class="scenario-head"><div><span class="eyebrow">' +
    safeText(scenario.channel) + ' · ' + safeText(scenario.difficulty) + '</span><h2>' + safeText(scenario.title) + '</h2></div>' +
    '<span class="tag">' + (priorAnswer ? safeText(scenario.category) : 'Kategori belum diungkap') + '</span></div><div class="simulation-status"><span>SIMULASI EDUKASI</span><small>Tautan tidak membuka situs atau layanan</small></div><div class="sim-message message-host">' + messageMarkup +
    '</div><div class="inspection-actions"><button class="ghost" data-sim-action="inspect-sender" aria-expanded="false">Lihat pengirim & konteks</button>' +
    '<button class="ghost" data-sim-action="analyze-link" aria-expanded="false">' + (scenario.link ? 'Analisis tautan' : 'Periksa detail pesan') + '</button></div>' +
    inspectPanel(scenario) + linkPanel(scenario) + '<p class="muted answer-prompt">Menurut Anda, pesan simulasi ini phishing atau legitimate?</p>' + answerMarkup + feedbackMarkup +
    '</section><aside class="card session-aside"><span class="eyebrow">PROGRES SESI</span><div class="mini-score">' + progress +
    '<small> / 5</small></div><div class="progress"><span style="width:' + (progress / 5 * 100) + '%"></span></div><div class="difficulty-list">' +
    '<span class="' + (scenario.difficulty === 'Easy' ? 'current' : '') + '">Easy</span><span class="' + (scenario.difficulty === 'Medium' ? 'current' : '') +
    '">Medium</span><span class="' + (scenario.difficulty === 'Hard' ? 'current' : '') + '">Hard</span></div><h3>Periksa sebelum percaya</h3>' +
    '<p class="muted">Cocokkan identitas, domain, konteks, serta tindakan yang diminta. Beberapa contoh aman juga dapat memiliki tenggat waktu yang wajar.</p>' +
    '<div class="demo-safety">Latihan lokal. Jangan pernah memasukkan data pribadi atau kata sandi sungguhan.</div></aside></div>';
}
function updateBadges() {
  badgeDefinitions(state).filter(badge => badge.unlocked).forEach(badge => {
    if (!state.badges.includes(badge.id)) state.badges.push(badge.id);
  });
}
function answer(choice) {
  const session = state.session;
  if (!hasAccess('simulation') || !session || session.complete || session.answers[session.index]) return;
  const scenario = activeScenario();
  if (!scenario) return;
  const correct = choice === scenario.answer;
  const earned = correct ? 50 : 0;
  const now = new Date();
  session.answers[session.index] = { choice: choice, correct: correct, xp: earned, category: scenario.category };
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
function toggleInspector(id, button) {
  const panel = document.querySelector('#' + id);
  if (!panel) return;
  panel.hidden = !panel.hidden;
  button.setAttribute('aria-expanded', String(!panel.hidden));
  const embeddedAction = button.querySelector('.sim-link-action');
  if (embeddedAction) {
    embeddedAction.textContent = panel.hidden ? 'Periksa tujuan' : 'Tutup detail';
    return;
  }
  button.textContent = panel.hidden
    ? (id === 'sender-inspector' ? 'Lihat pengirim & konteks' : (activeScenario() && activeScenario().link ? 'Analisis tautan' : 'Periksa detail pesan'))
    : 'Tutup detail';
}
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
function beginCompanyRegistration() {
  if (currentAccount) save();
  localStorage.removeItem(SESSION_KEY);
  currentAccount = null;
  state = createProgress();
  role = null;
  view = 'dashboard';
  authMode = 'register';
  signupType = 'company';
  planMessage = '';
  companyMessage = '';
  login();
}
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
document.querySelector('#app').addEventListener('click', event => {
  // Renders can replace the clicked control between the two clicks of a double-click.
  // Ignore click sequences after the first so the second event cannot hit a new action.
  if (event.detail > 1) return;
  const planControl = event.target.closest('[data-plan]');
  if (planControl) {
    activatePlan(planControl.dataset.plan);
    return;
  }
  const planAction = event.target.closest('[data-plan-action]');
  if (planAction) {
    if (planAction.dataset.planAction === 'cancel') closePlanConfirmation();
    if (planAction.dataset.planAction === 'confirm') applyPlan(planAction.dataset.confirmPlan);
    if (planAction.dataset.planAction === 'company-registration') beginCompanyRegistration();
    if (planAction.dataset.planAction === 'premium-individual') {
      planMessage = 'Premium hanya tersedia untuk peran individu. Untuk organisasi, aktifkan Company Plan pada akun perusahaan ini.';
      subscription(document.querySelector('#page'));
    }
    return;
  }
  const planLink = event.target.closest('[data-open-plan]');
  if (planLink) {
    view = 'subscription';
    app();
    return;
  }
  const companyControl = event.target.closest('[data-company-action]');
  if (companyControl) {
    handleCompanyAction(companyControl);
    return;
  }
  const button = event.target.closest('[data-sim-action]');
  if (!button) return;
  const action = button.dataset.simAction;
  if (action === 'start' || action === 'restart') {
    if (startingSession || button.disabled) return;
    button.disabled = true;
    if (!startSession()) {
      simulation(document.querySelector('#page'));
      return;
    }
    simulation(document.querySelector('#page'));
    return;
  }
  if (action === 'answer') {
    if (state.session && state.session.answers[state.session.index]) return;
    button.disabled = true;
    answer(button.dataset.answer);
    return;
  }
  if (action === 'next') {
    const session = state.session;
    if (!session || !session.answers[session.index]) return;
    button.disabled = true;
    if (session.index >= 4) session.complete = true;
    else session.index++;
    save();
    simulation(document.querySelector('#page'));
    return;
  }
  if (action === 'inspect-sender' || action === 'analyze-link') {
    toggleInspector(action === 'inspect-sender' ? 'sender-inspector' : 'link-inspector', button);
    return;
  }
  if (action === 'dashboard') {
    view = role === 'company' ? 'company' : 'dashboard';
    app();
  }
});
document.querySelector('#app').addEventListener('click', event => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  if (control.dataset.action === 'leaderboard-period') {
    leaderboardPeriod = control.dataset.period === 'week' ? 'week' : 'all';
    game(document.querySelector('#page'));
  }
  if (control.dataset.action === 'download-company-report') downloadCompanyReport();
});
document.querySelector('#app').addEventListener('click', event => {
  const control = event.target.closest('[data-edu-action]');
  if (!control) return;
  const action = control.dataset.eduAction;
  const state = ensureEducationState();
  const scrollTo = (selector, focusSelector) => {
    const target = document.querySelector(selector);
    if (!target) return;
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    const focusTarget = focusSelector ? document.querySelector(focusSelector) : target;
    if (focusTarget) window.setTimeout(() => focusTarget.focus({ preventScroll: true }), reducedMotion ? 0 : 280);
  };
  if (action === 'scroll-lessons') {
    scrollTo('#edu-lessons', '#edu-lessons-title');
    return;
  }
  if (action === 'scroll-quiz') {
    scrollTo('#edu-quiz', '#edu-quiz-title');
    return;
  }
  if (action === 'open-lesson') {
    if (!educationTopics.some(topic => topic.id === control.dataset.lesson)) return;
    state.selectedLessonId = control.dataset.lesson;
    education(document.querySelector('#page'));
    scrollTo('#edu-detail', '#edu-detail-title');
    return;
  }
  if (action === 'back-lessons') {
    state.selectedLessonId = null;
    education(document.querySelector('#page'));
    scrollTo('#edu-lessons', '#edu-lessons-title');
    return;
  }
  if (action === 'quiz-start' || action === 'quiz-retry') {
    if (control.disabled) return;
    control.disabled = true;
    beginEducationQuiz();
    return;
  }
  if (action === 'quiz-answer') {
    if (!state.quizStarted || state.quizComplete || state.quizAnswer !== null) return;
    const question = state.quizItems[state.quizIndex];
    if (!question || !['phish', 'legit'].includes(control.dataset.answer)) return;
    control.disabled = true;
    state.quizAnswer = control.dataset.answer;
    if (state.quizAnswer === question.answer) state.quizScore++;
    renderEducationQuiz();
    return;
  }
  if (action === 'quiz-next') {
    if (!state.quizStarted || state.quizComplete || state.quizAnswer === null) return;
    control.disabled = true;
    if (state.quizIndex >= state.quizItems.length - 1) {
      state.quizComplete = true;
      const progress = currentAccount && currentAccount.progress;
      if (progress && !Array.isArray(progress.learningEvents)) progress.learningEvents = [];
      if (progress && state.quizRunId && !progress.learningEvents.some(item => item.id === state.quizRunId)) {
        progress.learningEvents.push({ id: state.quizRunId, type: 'quiz', at: new Date().toISOString() });
        save();
      }
    }
    else {
      state.quizIndex++;
      state.quizAnswer = null;
    }
    renderEducationQuiz();
  }
});
document.querySelector('#app').addEventListener('change', event => {
  if (event.target.matches('[data-edu-check]')) syncEducationChecklist();
});
document.querySelector('#app').addEventListener('submit', event => {
  const formElement = event.target.closest('[data-company-form]');
  if (!formElement) return;
  event.preventDefault();
  submitCompanyForm(formElement);
});

app();
