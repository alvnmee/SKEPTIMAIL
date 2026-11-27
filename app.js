const scenarioBank = window.skeptimailScenarios || [];
accounts = readAccounts();
state = createProgress();

migrateLegacyStorage();
restoreSession();


// Function: shell
function shell() {
  const individual = role === 'individual';
  const navigation = individual
    ? [['dashboard', 'Dashboard'], ['simulation', 'Simulasi'], ['game', 'Pencapaian'], ['profile', 'Profil & Laporan'], ['education', 'Edukasi'], ['subscription', 'Paket']]
    : [['company', 'Company Dashboard'], ['education', 'Edukasi'], ['subscription', 'Paket']];
  document.querySelector('#app').innerHTML =
    '<div class="shell' + (individual ? '' : ' company-shell') + '"><aside class="sidebar"><div class="side-brand"><img class="side-brand-logo" src="assets/skeptimail-logo-light.svg" alt="Skeptimail"></div><nav class="nav">' +
    navigation.map(item => '<button data-v="' + item[0] + '" class="' + (item[0] === view ? 'active' : '') + '">' + item[1] + '</button>').join('') +
    '<button data-v="logout">Keluar</button></nav></aside>' +
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


// Function: app
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
    subscription: 'Paket Skeptimail'
  };
  if (role === 'company' && view !== 'company' && view !== 'education' && view !== 'subscription') view = 'company';
  document.querySelector('#title').textContent = titles[view] || titles.dashboard;
  const pages = { dashboard, simulation, game, profile, company, education, subscription };
  (pages[view] || pages.dashboard)(page);
}


// Function: beginCompanyRegistration
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
    if (!session || session.complete || !session.answers[session.index]) return;
    button.disabled = true;
    if (session.index >= 4) completeSimulationSession(session);
    else {
      session.index++;
      save();
    }
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
document.querySelector('#app').addEventListener('submit', event => {
  const formElement = event.target.closest('[data-company-form]');
  if (!formElement) return;
  event.preventDefault();
  submitCompanyForm(formElement);
});

app();
