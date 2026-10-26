// Shared mutable state for the classic-script application.
// Account and progress data are populated by app.js after dependencies load.
let accounts = [];
let currentAccount = null;
let state = null;
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
