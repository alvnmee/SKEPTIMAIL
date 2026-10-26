// Function: createProgress
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


// Function: accuracy
function accuracy() {
  return state.total ? Math.round(state.correct / state.total * 100) : 0;
}


// Function: score
function score() {
  if (!state.total) return 0;
  return Math.min(100, Math.round((state.correct / state.total * 70) + state.xp / 12));
}


// Function: level
function level(xp) {
  return Math.floor((Number(xp === undefined ? state.xp : xp) || 0) / 200) + 1;
}


// Function: levelProgress
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


// Function: parseActivityTimestamp
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


// Function: localDayKey
function localDayKey(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}


// Function: learningActivity
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


// Function: learningStreak
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


// Function: badgeDefinitions
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
