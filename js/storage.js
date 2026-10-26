const ACCOUNTS_KEY = 'phishguard-accounts-v2';
const SESSION_KEY = 'phishguard-active-session-v2';
const LEGACY_STATE_KEY = 'phishguard-demo-v1';
const LEGACY_ROLE_KEY = 'pg-role';
const knownDemoNames = ['nadia pratama', 'raka wijaya', 'tiara p.', 'bagas m.', 'mila ananta'];
const knownDemoIds = ['nadia-pratama', 'raka-wijaya', 'tiara-p', 'bagas-m', 'mila-ananta'];

function parseStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
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

function save() {
  if (!currentAccount) return;
  currentAccount.progress = createProgress(state);
  const index = accounts.findIndex(account => account.id === currentAccount.id);
  if (index >= 0) accounts[index] = currentAccount;
  persistAccounts();
}
