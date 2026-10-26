// Function: normalizeSimulationTargets
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


// Function: normalizedAccount
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


// Function: currentPeriodKey
function currentPeriodKey(date) {
  const value = date || new Date();
  return value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0');
}


// Function: nextPeriodDate
function nextPeriodDate(date) {
  const value = new Date(date || new Date());
  return new Date(value.getFullYear(), value.getMonth() + 1, 1);
}


// Function: normalizeSubscription
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
