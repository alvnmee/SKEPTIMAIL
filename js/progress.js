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
    badgeDates: source.badgeDates && typeof source.badgeDates === 'object' && !Array.isArray(source.badgeDates)
      ? source.badgeDates
      : {},
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
  // Older records store a local "d/m/yyyy, hh.mm(.ss)" string instead of an ISO timestamp.
  const localDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2})[.:](\d{2})(?:[.:](\d{2}))?)?$/.exec(raw);
  if (localDate) {
    const parsed = new Date(
      Number(localDate[3]),
      Number(localDate[2]) - 1,
      Number(localDate[1]),
      Number(localDate[4] || 0),
      Number(localDate[5] || 0),
      Number(localDate[6] || 0)
    );
    // Reject dates that rolled over, such as 31/2/2024.
    if (parsed.getFullYear() === Number(localDate[3]) &&
      parsed.getMonth() === Number(localDate[2]) - 1 &&
      parsed.getDate() === Number(localDate[1])) return parsed;
  }
  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}


// Function: localDayKey
function localDayKey(date) {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
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
  // The current streak only counts if the last active day was today or yesterday.
  if (lastSerial >= todaySerial - 1 && lastSerial <= todaySerial) {
    current = 1;
    for (let index = serials.length - 2; index >= 0 && serials[index] === serials[index + 1] - 1; index--) {
      current++;
    }
  }
  return { current: current, record: record, activeDays: days.length };
}


// Function: badgeDefinitions
function badgeDefinitions(progress) {
  const source = progress || state;
  const history = Array.isArray(source.history) ? source.history : [];
  const storedBadges = new Set(Array.isArray(source.badges) ? source.badges : []);
  const badgeDates = source.badgeDates && typeof source.badgeDates === 'object' ? source.badgeDates : {};
  const scenarioById = new Map(scenarioBank.map(scenario => [scenario.id, scenario]));
  const seenCorrect = new Set();
  // First correct answer per known scenario.
  const correctScenarios = history.filter(item => {
    if (!item || !item.ok || !scenarioById.has(item.scenarioId) || seenCorrect.has(item.scenarioId)) {
      return false;
    }
    seenCorrect.add(item.scenarioId);
    return true;
  }).map(item => ({ result: item, scenario: scenarioById.get(item.scenarioId) }));
  const correctPhishing = correctScenarios.filter(item => item.scenario.answer === 'phish');
  const correctLegitimate = correctScenarios.filter(item => item.scenario.answer === 'legit');
  const phishingCategories = new Set(correctPhishing.map(item => item.scenario.category));
  const correctHard = new Set(correctScenarios
    .filter(item => item.scenario.difficulty === 'Hard')
    .map(item => item.scenario.id));
  const correctLinks = history.filter(item => item.ok && (item.cat || item.category) === 'Fake links').length;
  const correctImpersonations = history
    .filter(item => item.ok && (item.cat || item.category) === 'Impersonation').length;
  const completedScenarios = new Set(history
    .filter(item => item && scenarioById.has(item.scenarioId))
    .map(item => item.scenarioId)).size;
  const simulationTotal = Math.max(completedScenarios, Number(source.total) || 0);
  const simulationCorrect = Math.max(0, Number(source.correct) || 0);
  const simulationAccuracy = simulationTotal ? Math.round(simulationCorrect / simulationTotal * 100) : 0;
  const dailyStreak = learningStreak(source).record;
  const correctTotal = correctScenarios.length;
  const session = source.session && typeof source.session === 'object' ? source.session : null;
  const perfectSessionComplete = Boolean(session && session.complete && Array.isArray(session.answers) &&
    session.answers.length === 5 && session.answers.every(answer => answer && answer.correct));
  const badges = [
    {
      id: 'hunter',
      icon: html`
        <path d="M12 3 19 6v5c0 4.5-2.9 7.6-7 10-4.1-2.4-7-5.5-7-10V6l7-3Z"/>
        <path d="m9 12 2 2 4-4"/>`,
      name: 'Phishing Hunter',
      description: 'Bangun ketelitian lewat keputusan simulasi yang tepat.',
      criterion: 'Jawab 3 skenario simulasi dengan benar.',
      progress: Math.max(0, Number(source.correct) || 0),
      target: 3
    },
    {
      id: 'link',
      icon: html`
        <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/>
        <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1"/>
        <path d="m9 15 6-6"/>`,
      name: 'Link Detective',
      description: 'Periksa domain dan tujuan tautan sebelum memercayainya.',
      criterion: 'Kenali 2 skenario kategori tautan palsu dengan benar.',
      progress: correctLinks,
      target: 2
    },
    {
      id: 'imp',
      icon: html`
        <path d="M12 3 19 6v5c0 4.5-2.9 7.6-7 10-4.1-2.4-7-5.5-7-10V6l7-3Z"/>
        <path d="M9 10h.01M15 10h.01M9 14c1.7 1.5 4.3 1.5 6 0"/>`,
      name: 'Impersonation Expert',
      description: 'Pastikan identitas pengirim sesuai kanal dan konteksnya.',
      criterion: 'Kenali 2 skenario impersonasi dengan benar.',
      progress: correctImpersonations,
      target: 2
    },
    {
      id: 'streak',
      icon: html`
        <path d="M12 3c1 3-1 4.5-1 6.5 0 1.2.8 2 1.8 2 1.6 0 2.2-1.8 2-3.2 2.2 1.8 3.7 4.1 3.7 6.6a6.5 6.5 0 0 1-13 0c0-3.6 2.4-6.8 6.5-11.9Z"/>
        <path d="M10 17.5a2 2 0 0 0 4 0c0-.9-.7-1.8-2-3-1.3 1.2-2 2.1-2 3Z"/>`,
      name: 'Perfect Streak',
      description: 'Pertahankan fokus dalam rangkaian jawaban yang tepat.',
      criterion: 'Berikan 3 jawaban benar berturut-turut.',
      progress: Math.max(0, Number(source.streak) || 0),
      target: 3
    },
    {
      id: 'first-defender',
      icon: html`
        <path d="M12 3 19 6v5c0 4.5-2.9 7.6-7 10-4.1-2.4-7-5.5-7-10V6l7-3Z"/>
        <path d="m8.5 12 2.2 2.2 4.8-5"/>`,
      name: 'First Defender',
      description: 'Langkah pertama untuk mengenali pesan berisiko.',
      criterion: 'Selesaikan satu skenario simulasi.',
      progress: history.length,
      target: 1
    },
    {
      id: 'sharp-eye',
      icon: html`
        <circle cx="12" cy="12" r="8"/>
        <circle cx="12" cy="12" r="3"/>
        <path d="m19 5 2-2M5 19l-2 2"/>`,
      name: 'Sharp Eye',
      description: 'Tajam mengenali pesan phishing dari berbagai skenario.',
      criterion: 'Identifikasi 5 skenario phishing berbeda dengan benar.',
      progress: correctPhishing.length,
      target: 5
    },
    {
      id: 'perfect-accuracy',
      icon: html`
        <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>
        <path d="m9 12 2 2 4-4"/>`,
      name: 'Perfect Accuracy',
      description: 'Selesaikan satu sesi simulasi tanpa satu pun jawaban keliru.',
      criterion: 'Dapatkan 5 dari 5 jawaban tepat dalam satu sesi lengkap.',
      progress: storedBadges.has('perfect-accuracy') ? 1 : 0,
      target: 1
    },
    {
      id: 'consistency-keeper',
      icon: html`
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 7v5l3 2M8 3 6 5M16 3l2 2"/>`,
      name: 'Consistency Keeper',
      description: 'Kebiasaan latihan yang konsisten membantu membangun ketelitian.',
      criterion: 'Berlatih selama 7 hari berturut-turut.',
      progress: dailyStreak,
      target: 7
    },
    {
      id: 'pattern-hunter',
      icon: html`
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/>
        <path d="M14 14h2v2h-2zM18 14h2v6h-6v-2"/>`,
      name: 'Pattern Hunter',
      description: 'Kenali ancaman lewat beragam pola, bukan satu petunjuk saja.',
      criterion: 'Identifikasi 5 kategori indikator phishing berbeda dengan benar.',
      progress: phishingCategories.size,
      target: 5
    },
    {
      id: 'elite-analyst',
      icon: html`
        <path d="M4 19h16M6 16V9m6 7V5m6 11v-4"/>
        <path d="m4 7 5-3 4 2 6-4"/>`,
      name: 'Elite Analyst',
      description: 'Uji pertimbangan Anda pada skenario yang membutuhkan pemeriksaan cermat.',
      criterion: 'Identifikasi 10 skenario Hard berbeda dengan benar.',
      progress: correctHard.size,
      target: 10
    },
    {
      id: 'trust-evaluator',
      icon: html`
        <path d="M12 3 19 6v5c0 4.5-2.9 7.6-7 10-4.1-2.4-7-5.5-7-10V6l7-3Z"/>
        <path d="M8 12h8M12 8v8"/>`,
      name: 'Trust Evaluator',
      description: 'Bedakan pesan berisiko dari komunikasi yang sesuai konteks.',
      criterion: 'Klasifikasikan 10 skenario berbeda dengan benar, mencakup phishing dan legitimate.',
      progress: correctTotal,
      target: 10,
      progressDetail: 'Phishing ' + correctPhishing.length + ' · legitimate ' + correctLegitimate.length
    },
    {
      id: 'cyber-guardian',
      icon: html`
        <path d="M12 3 19 6v5c0 4.5-2.9 7.6-7 10-4.1-2.4-7-5.5-7-10V6l7-3Z"/>
        <path d="M12 8v4l2.5 1.5M9 2h6"/>`,
      name: 'Cyber Guardian',
      description: 'Tunjukkan ketelitian yang konsisten di seluruh bank skenario.',
      criterion: 'Selesaikan 30 skenario berbeda dengan akurasi minimal 90%.',
      progress: completedScenarios,
      target: 30,
      progressDetail: 'Akurasi saat ini ' + simulationAccuracy + '% · syarat 90%'
    }
  ];
  const unlockedById = {
    'hunter': Number(source.correct) >= 3,
    'link': correctLinks >= 2,
    'imp': correctImpersonations >= 2,
    'streak': Number(source.maxStreak) >= 3,
    'first-defender': history.length >= 1,
    'sharp-eye': correctPhishing.length >= 5,
    'perfect-accuracy': perfectSessionComplete,
    'consistency-keeper': dailyStreak >= 7,
    'pattern-hunter': phishingCategories.size >= 5,
    'elite-analyst': correctHard.size >= 10,
    'trust-evaluator': correctTotal >= 10 && correctPhishing.length > 0 && correctLegitimate.length > 0,
    'cyber-guardian': completedScenarios >= 30 && simulationAccuracy >= 90
  };
  return badges.map(badge => {
    const isStored = storedBadges.has(badge.id);
    const progressValue = Math.max(0, Math.min(badge.target, isStored ? badge.target : Number(badge.progress) || 0));
    if (badge.id === 'trust-evaluator') badge.progressDetail += ' · perlu keduanya';
    return {
      ...badge,
      progress: progressValue,
      unlocked: isStored || Boolean(unlockedById[badge.id]),
      acquiredAt: badgeDates[badge.id] || ''
    };
  });
}
