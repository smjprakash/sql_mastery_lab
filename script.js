/* =========================================================
   SQL MASTERY LAB
   Professional Student Practice Application
   ========================================================= */

/* =========================================================
   SUPABASE CONFIGURATION
   ========================================================= */

const SUPABASE_URL =
  "https://bhvbxxrdwggqrlrtqbqi.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_DTJqWhC47yTkTRIgMcNNzQ_dUjjy9hf";

const PASSWORD_RESET_REDIRECT_URL =
  "https://sqlmastery-blue.vercel.app/";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


/* =========================================================
   GLOBAL APPLICATION STATE
   ========================================================= */

let currentUser = null;
let currentProfile = null;

let selectedLoginType = "student";

let db = null;

let currentLevel = 0;
let currentQuestion = 0;

let progress = {
  name: "",
  solved: {}
};

const STORAGE_KEY =
  "kgcas_sql_mastery_progress_v1";

const PROGRESS_TABLE = "student_progress";

let authMode = "login"; // "login" or "signup"
let passwordRecoveryInProgress = false;


/* =========================================================
   DOM HELPER
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}


/* =========================================================
   LOGIN
   ========================================================= */

const studentLoginTab =
  $("studentLoginTab");

const adminLoginTab =
  $("adminLoginTab");

const loginMessage =
  $("loginMessage");

const loginBtn =
  $("loginBtn");

function clearLoginCredentials() {
  $("loginEmail").value = "";
  $("loginPassword").value = "";
}

supabaseClient.auth.onAuthStateChange(
  event => {
    if (event === "PASSWORD_RECOVERY") {
      selectedLoginType = "student";
      setPasswordRecoveryMode(true);
    }
  }
);


if (studentLoginTab) {

  studentLoginTab.addEventListener(
    "click",
    () => {

      if (selectedLoginType !== "student") {
        clearLoginCredentials();
      }

      selectedLoginType = "student";
      $("signupName").value = "";

      studentLoginTab.classList.add(
        "active"
      );

      adminLoginTab?.classList.remove(
        "active"
      );

      setAuthMode("login");

      $("authToggleRow")
        ?.classList.remove("hidden");

      if (loginMessage) {
        loginMessage.textContent = "";
        loginMessage.className =
          "login-message";
      }

    }
  );

}


if (adminLoginTab) {

  adminLoginTab.addEventListener(
    "click",
    () => {

      if (selectedLoginType !== "admin") {
        clearLoginCredentials();
      }

      selectedLoginType = "admin";
      $("signupName").value = "";

      adminLoginTab.classList.add(
        "active"
      );

      studentLoginTab?.classList.remove(
        "active"
      );

      setAuthMode("login");

      $("authToggleRow")
        ?.classList.add("hidden");

      if (loginMessage) {
        loginMessage.textContent = "";
        loginMessage.className =
          "login-message";
      }

    }
  );

}


/* =========================================================
   LOGIN FUNCTION
   ========================================================= */

async function loginUser() {

  const email =
    $("loginEmail")?.value.trim();

  const password =
    $("loginPassword")?.value || "";

  if (!email || !password) {

    if (loginMessage) {

      loginMessage.textContent =
        "Please enter both email and password.";

      loginMessage.className =
        "login-message error";

    }

    return;
  }


  if (loginBtn) {

    loginBtn.disabled = true;
    loginBtn.classList.add("loading");

  }


  if (loginMessage) {

    loginMessage.textContent =
      "Authenticating...";

    loginMessage.className =
      "login-message info";

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });


    if (error) {
      throw error;
    }


    currentUser =
      data.user;


    await loadUserProfile();

  }

  catch (error) {

    console.error(
      "Login error:",
      error
    );


    if (loginMessage) {

      loginMessage.textContent =
        friendlyAuthError(error);

      loginMessage.className =
        "login-message error";

    }

  }

  finally {

    if (loginBtn) {

      loginBtn.disabled = false;
      loginBtn.classList.remove(
        "loading"
      );

    }

  }

}


function friendlyAuthError(error) {

  const message =
    String(
      error?.message ||
      "Unable to sign in."
    );


  if (
    /invalid login credentials/i
      .test(message)
  ) {

    return (
      "Invalid email or password. If you just signed up, " +
      "confirm your email using the link sent to your inbox, " +
      "then try again."
    );

  }


  if (
    /email not confirmed/i
      .test(message)
  ) {

    return (
      "Please confirm your email address " +
      "before signing in."
    );

  }


  return message;

}


/* LOGIN BUTTON */

if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    () => {

      if (authMode === "signup") {
        signUpUser();
      }

      else {
        loginUser();
      }

    }
  );

}


/* =========================================================
   LOGIN / SIGNUP MODE TOGGLE
   ========================================================= */

function setAuthMode(mode) {

  authMode = mode;

  const isSignup =
    mode === "signup";

  document
    .querySelectorAll(".signup-only")
    .forEach(
      el => el.classList.toggle("hidden", !isSignup)
    );

  if (loginBtn) {

    loginBtn.querySelector("span")
      ? (loginBtn.querySelector("span").textContent =
          isSignup ? "Create account" : "Sign in")
      : (loginBtn.textContent =
          isSignup ? "Create account" : "Sign in");

  }

  const toggleText = $("authToggleText");
  const toggleLink = $("authToggleLink");

  if (toggleText && toggleLink) {

    toggleText.textContent =
      isSignup
        ? "Already have an account?"
        : "New student?";

    toggleLink.textContent =
      isSignup ? "Back to Sign In" : "Sign Up";

  }

  $("forgotPasswordBtn")
    ?.classList.toggle(
      "hidden",
      selectedLoginType !== "student" ||
      isSignup ||
      passwordRecoveryInProgress
    );

  if (loginMessage) {
    loginMessage.textContent = "";
    loginMessage.className = "login-message";
  }

}


function setPasswordRecoveryMode(enabled) {

  passwordRecoveryInProgress = enabled;

  $("loginTabs")
    ?.classList.toggle("hidden", enabled);

  $("loginForm")
    ?.classList.toggle("hidden", enabled);

  $("passwordRecoveryForm")
    ?.classList.toggle("hidden", !enabled);

  const title = $("loginCardTitle");
  const description = $("loginCardDescription");

  if (title) {
    title.textContent =
      enabled ? "Reset your password" : "Welcome back";
  }

  if (description) {
    description.textContent = enabled
      ? "Choose a new password for your student account."
      : "Sign in to continue your SQL journey.";
  }

  if (loginMessage) {
    loginMessage.textContent = "";
    loginMessage.className = "login-message";
  }

}


async function requestPasswordReset() {

  if (selectedLoginType !== "student" || authMode !== "login") {
    return;
  }

  const emailInput = $("loginEmail");
  const email = emailInput?.value.trim() || "";
  const forgotPasswordBtn = $("forgotPasswordBtn");

  if (!email) {
    if (loginMessage) {
      loginMessage.textContent =
        "Enter your student email address first.";
      loginMessage.className = "login-message error";
    }

    emailInput?.focus();
    return;
  }

  if (emailInput && !emailInput.reportValidity()) {
    return;
  }

  if (forgotPasswordBtn) {
    forgotPasswordBtn.disabled = true;
  }

  if (loginMessage) {
    loginMessage.textContent = "Sending password reset email...";
    loginMessage.className = "login-message info";
  }

  try {
    const { error } =
      await supabaseClient.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: PASSWORD_RESET_REDIRECT_URL
        }
      );

    if (error) {
      throw error;
    }

    if (loginMessage) {
      loginMessage.textContent =
        "If an account exists for this email, a password reset link has been sent.";
      loginMessage.className = "login-message info";
    }
  }
  catch (error) {
    console.error("Password reset request failed:", error);

    if (loginMessage) {
      loginMessage.textContent = friendlyAuthError(error);
      loginMessage.className = "login-message error";
    }
  }
  finally {
    if (forgotPasswordBtn) {
      forgotPasswordBtn.disabled = false;
    }
  }

}


async function saveNewPassword() {

  const password = $("newPassword")?.value || "";
  const confirmPassword = $("confirmNewPassword")?.value || "";
  const saveButton = $("saveNewPasswordBtn");

  if (password.length < 6) {
    if (loginMessage) {
      loginMessage.textContent =
        "Password must be at least 6 characters.";
      loginMessage.className = "login-message error";
    }
    return;
  }

  if (password !== confirmPassword) {
    if (loginMessage) {
      loginMessage.textContent = "Passwords do not match.";
      loginMessage.className = "login-message error";
    }
    return;
  }

  if (saveButton) {
    saveButton.disabled = true;
  }

  if (loginMessage) {
    loginMessage.textContent = "Updating your password...";
    loginMessage.className = "login-message info";
  }

  try {
    const { data, error } =
      await supabaseClient.auth.updateUser({ password });

    if (error) {
      throw error;
    }

    currentUser = data.user;
    selectedLoginType = "student";
    setPasswordRecoveryMode(false);
    await loadUserProfile();
  }
  catch (error) {
    console.error("Password update failed:", error);

    if (loginMessage) {
      loginMessage.textContent = friendlyAuthError(error);
      loginMessage.className = "login-message error";
    }
  }
  finally {
    if (saveButton) {
      saveButton.disabled = false;
    }
  }

}


$("authToggleLink")?.addEventListener(
  "click",
  () => {
    setAuthMode(authMode === "signup" ? "login" : "signup");
  }
);

$("forgotPasswordBtn")?.addEventListener(
  "click",
  requestPasswordReset
);

$("saveNewPasswordBtn")?.addEventListener(
  "click",
  saveNewPassword
);


/* =========================================================
   SIGNUP FUNCTION
   ========================================================= */

async function signUpUser() {

  const fullName =
    $("signupName")?.value.trim() || "";

  const email =
    $("loginEmail")?.value.trim() || "";

  const password =
    $("loginPassword")?.value || "";

  const confirmPassword =
    $("signupConfirmPassword")?.value || "";

  if (!fullName || !email || !password) {

    if (loginMessage) {
      loginMessage.textContent =
        "Please fill in your name, email and password.";
      loginMessage.className = "login-message error";
    }

    return;
  }

  if (password.length < 6) {

    if (loginMessage) {
      loginMessage.textContent =
        "Password must be at least 6 characters.";
      loginMessage.className = "login-message error";
    }

    return;
  }

  if (password !== confirmPassword) {

    if (loginMessage) {
      loginMessage.textContent =
        "Passwords do not match.";
      loginMessage.className = "login-message error";
    }

    return;
  }

  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.classList.add("loading");
  }

  if (loginMessage) {
    loginMessage.textContent = "Creating your account...";
    loginMessage.className = "login-message info";
  }

  try {

    const { data, error } =
      await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });

    if (error) {
      throw error;
    }

    // Fallback in case the DB trigger (see supabase_setup.sql)
    // hasn't been installed yet — safe no-op otherwise.
    if (data.user) {

      await supabaseClient
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            email,
            full_name: fullName,
            role: "student"
          },
          { onConflict: "id", ignoreDuplicates: true }
        );

    }

    if (data.session) {

      // Email confirmation is disabled on this project — log straight in.
      currentUser = data.user;
      await loadUserProfile();

    }

    else {

      if (loginMessage) {

        loginMessage.textContent =
          "Account created! Please check your email to confirm your address, then sign in.";

        loginMessage.className = "login-message info";

      }

      setAuthMode("login");

    }

  }

  catch (error) {

    console.error("Signup error:", error);

    if (loginMessage) {
      loginMessage.textContent = friendlyAuthError(error);
      loginMessage.className = "login-message error";
    }

  }

  finally {

    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.classList.remove("loading");
    }

  }

}


/* ENTER KEY */

$("loginPassword")?.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {
      loginUser();
    }

  }
);


/* =========================================================
   LOAD USER PROFILE
   ========================================================= */

async function loadUserProfile() {

  if (!currentUser) {
    return;
  }


  let profileResult =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

  if (
    profileResult.error?.code === "PGRST116" &&
    selectedLoginType === "student"
  ) {
    const { error: createProfileError } =
      await supabaseClient
        .from("profiles")
        .upsert(
          {
            id: currentUser.id,
            email: currentUser.email,
            full_name:
              currentUser.user_metadata?.full_name || "",
            role: "student"
          },
          { onConflict: "id", ignoreDuplicates: true }
        );

    if (createProfileError) {
      console.error(
        "Profile creation failed:",
        createProfileError
      );
    }
    else {
      profileResult =
        await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
    }
  }

  const { data, error } = profileResult;


  if (error || !data) {

    console.error(
      "Profile lookup failed:",
      error
    );


    await supabaseClient.auth.signOut();

    currentUser = null;
    currentProfile = null;


    if (loginMessage) {

      loginMessage.textContent =
        "Login succeeded, but no matching " +
        "profile was found. Please ask the " +
        "administrator to create your profile.";

      loginMessage.className =
        "login-message error";

    }

    return;
  }


  currentProfile =
    data;


  const role =
    String(
      data.role || ""
    ).toLowerCase();


  if (
    role !== selectedLoginType
  ) {

    await supabaseClient.auth.signOut();

    currentUser = null;
    currentProfile = null;


    if (loginMessage) {

      loginMessage.textContent =
        `This account is registered as ${
          role || "another role"
        }. Please choose the correct login option.`;

      loginMessage.className =
        "login-message error";

    }

    return;
  }


  if (loginMessage) {

    loginMessage.textContent = "";

  }


  if (role === "student") {

    await pullProgressFromCloud();

    showStudentLandingPage();

  }

  else if (role === "admin") {

    showAdminDashboard();

  }

}


/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

function hideAllPages() {

  $("loginPage")
    ?.classList.add("hidden");

  $("landingPage")
    ?.classList.add("hidden");

  $("labApp")
    ?.classList.add("hidden");

  $("adminPage")
    ?.classList.add("hidden");

}


/* =========================================================
   STUDENT LANDING PAGE
   ========================================================= */

function showStudentLandingPage() {

  hideAllPages();


  $("landingPage")
    ?.classList.remove("hidden");


  const fullName =
    currentProfile?.full_name || "";


  const input =
    $("landingStudentName");


  if (
    input &&
    !input.value
  ) {

    input.value =
      fullName;

  }


  const welcome =
    $("landingWelcome");


  if (welcome) {

    welcome.textContent =
      fullName
        ? `Welcome, ${fullName}`
        : "Welcome, learner";

  }

}


/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

function showAdminDashboard() {

  hideAllPages();


  $("adminPage")
    ?.classList.remove("hidden");


  const name =
    currentProfile?.full_name ||
    currentUser?.email ||
    "Administrator";


  const email =
    currentUser?.email ||
    "—";


  if ($("adminName")) {

    $("adminName").textContent =
      name;

  }


  if ($("adminEmail")) {

    $("adminEmail").textContent =
      email;

  }


  if ($("adminQuestionCount")) {

    $("adminQuestionCount").textContent =
      getTotalQuestions();

  }


  if ($("adminStudentCount")) {

    $("adminStudentCount").textContent =
      "—";

  }


  loadAdminStudentReport();

}


/* =========================================================
   ADMIN: STUDENT PROGRESS REPORT
   ========================================================= */

let adminReportRows = [];

async function fetchAllSupabaseRows(createQuery) {

  const rows = [];
  const pageSize = 500;

  for (let offset = 0; ; offset += pageSize) {

    const { data, error } =
      await createQuery()
        .range(offset, offset + pageSize - 1);

    if (error) {
      throw error;
    }

    const page = data || [];
    rows.push(...page);

    if (page.length < pageSize) {
      return rows;
    }

  }

}


async function loadAdminStudentReport() {

  const tableBody = $("adminStudentTableBody");
  const emptyState = $("adminStudentTableEmpty");

  if (tableBody) {
    tableBody.innerHTML =
      `<tr><td colspan="5" class="admin-table-loading">Loading students…</td></tr>`;
  }

  try {

    const students =
      await fetchAllSupabaseRows(
        () => supabaseClient
          .from("profiles")
          .select("id, full_name, email")
          .eq("role", "student")
          .order("full_name", { ascending: true })
          .order("id", { ascending: true })
      );

    const progressRows =
      await fetchAllSupabaseRows(
        () => supabaseClient
          .from(PROGRESS_TABLE)
          .select("student_id, question_key, solved")
          .order("id", { ascending: true })
      );

    const solvedQuestionsByStudent = {};

    progressRows.forEach(
      row => {

        if (!row.solved) {
          return;
        }

        if (!solvedQuestionsByStudent[row.student_id]) {
          solvedQuestionsByStudent[row.student_id] = [];
        }

        solvedQuestionsByStudent[row.student_id].push(
          row.question_key
        );

      }
    );

    adminReportRows =
      students.map(
        student => {

          const solvedQuestions =
            (solvedQuestionsByStudent[student.id] || [])
              .map(migrateQuestionKey)
              .filter(Boolean)
              .filter((questionKey, index, keys) => keys.indexOf(questionKey) === index)
              .sort();

          const solved =
            solvedQuestions.length;

          const completedLevels =
            levels.filter(
              (level, levelIndex) =>
                level.questions.every(
                  (_, questionIndex) =>
                    solvedQuestions.includes(
                      getQuestionKey(levelIndex, questionIndex)
                    )
                )
            ).length;

          const total =
            getTotalQuestions();

          const percentage =
            total === 0
              ? 0
              : Math.round((solved / total) * 100);

          return {
            name: student.full_name || "—",
            email: student.email || "—",
            solved,
            completedLevels,
            solvedQuestions,
            total,
            percentage
          };

        }
      );

    if ($("adminStudentCount")) {
      $("adminStudentCount").textContent =
        String(adminReportRows.length);
    }

    renderAdminStudentTable();

  }

  catch (error) {

    console.error("Admin report load failed:", error);

    if (tableBody) {
      tableBody.innerHTML =
        `<tr><td colspan="5" class="admin-table-loading">Could not load student data.</td></tr>`;
    }

  }

}


function renderAdminStudentTable() {

  const tableBody = $("adminStudentTableBody");
  const emptyState = $("adminStudentTableEmpty");

  if (!tableBody) {
    return;
  }

  if (!adminReportRows.length) {

    tableBody.innerHTML = "";

    if (emptyState) {
      emptyState.classList.remove("hidden");
    }

    return;
  }

  if (emptyState) {
    emptyState.classList.add("hidden");
  }

  tableBody.innerHTML =
    adminReportRows.map(
      row => `
        <tr>
          <td>
            <strong>${escapeHtml(row.name)}</strong>
          </td>
          <td>${escapeHtml(row.email)}</td>
          <td>
            <div class="admin-progress-cell">
              <div class="pc-bar"><div style="width:${row.percentage}%"></div></div>
              <span>${row.percentage}%</span>
            </div>
          </td>
          <td>${row.completedLevels} / ${levels.length}</td>
          <td>${row.solved} / ${row.total}</td>
        </tr>
      `
    ).join("");

}


function downloadStudentProgressCSV() {

  if (!adminReportRows.length) {
    return;
  }

  const header =
    [
      "Name",
      "Email",
      "Challenges completed",
      "Levels completed",
      "Total",
      "Percentage",
      "Solved question keys"
    ];

  const lines =
    adminReportRows.map(
      row => [
        row.name,
        row.email,
        row.solved,
        `${row.completedLevels} / ${levels.length}`,
        row.total,
        row.percentage + "%",
        row.solvedQuestions.join("; ")
      ]
        .map(
          value => `"${String(value).replace(/"/g, '""')}"`
        )
        .join(",")
    );

  const csv =
    [header.join(","), ...lines].join("\n");

  const blob =
    new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download =
    `sql_mastery_lab_student_progress_${new Date().toISOString().slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

}


$("adminRefreshBtn")
  ?.addEventListener("click", loadAdminStudentReport);

$("adminExportBtn")
  ?.addEventListener("click", downloadStudentProgressCSV);


/* =========================================================
   LOGOUT
   ========================================================= */

async function signOutUser() {

  try {

    await supabaseClient.auth.signOut();

  }

  catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }

  finally {

    currentUser = null;
    currentProfile = null;

    hideAllPages();


    $("loginPage")
      ?.classList.remove("hidden");


    if ($("loginPassword")) {

      $("loginPassword").value = "";

    }


    if ($("loginMessage")) {

      $("loginMessage").textContent = "";

    }

  }

}


/* =========================================================
   RESTORE LOGIN SESSION
   ========================================================= */

async function restoreSession() {

  try {

    const {
      data
    } =
      await supabaseClient
        .auth
        .getSession();

    if (passwordRecoveryInProgress) {
      return;
    }

    if (
      !data?.session?.user
    ) {

      return;

    }


    currentUser =
      data.session.user;


    /*
       Determine the role from the profile.
       This avoids forcing the user to manually
       select Student/Admin after refreshing.
    */

    const {
      data: profile
    } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();


    if (!profile) {

      return;

    }


    currentProfile =
      profile;


    const role =
      String(
        profile.role || ""
      ).toLowerCase();


    selectedLoginType =
      role;


    if (role === "student") {

      await pullProgressFromCloud();

      showStudentLandingPage();

    }

    else if (role === "admin") {

      showAdminDashboard();

    }

  }

  catch (error) {

    console.error(
      "Session restore failed:",
      error
    );

  }

}


/* =========================================================
   CLOUD PROGRESS SYNC
   ========================================================= */

async function pullProgressFromCloud() {

  if (!currentUser) {
    return;
  }

  try {

    const { data, error } =
      await supabaseClient
        .from(PROGRESS_TABLE)
        .select("question_key, solved")
        .eq("student_id", currentUser.id);

    if (error) {
      throw error;
    }

    const cloudSolved = {};

    (data || []).forEach(
      row => {

        if (row.solved) {
          const questionKey =
            migrateQuestionKey(row.question_key);

          if (questionKey) {
            cloudSolved[questionKey] = true;
          }
        }

      }
    );

    progress.solved = cloudSolved;

    saveProgress();

    renderLevelNav();
    renderQuestion();
    updateProgressUI();

  }

  catch (error) {

    console.error(
      "Cloud progress fetch failed:",
      error
    );

  }

}


async function pushProgressToCloud(questionKey) {

  if (!currentUser) {
    return;
  }

  try {

    const { error } =
      await supabaseClient
        .from(PROGRESS_TABLE)
        .upsert(
          {
            student_id: currentUser.id,
            question_key: questionKey,
            solved: true,
            solved_at: new Date().toISOString()
          },
          { onConflict: "student_id,question_key" }
        );

    if (error) {
      throw error;
    }

  }

  catch (error) {

    console.error(
      "Cloud progress save failed:",
      error
    );

  }

}


/* =========================================================
   DATABASE SCHEMA
   ========================================================= */

const schema = window.SQL_SCHEMA;


/* =========================================================
   LEVEL DATA
   ========================================================= */

const levels = [

  {
    id: 1,
    title: "Foundation",
    topic: "SELECT, DISTINCT, ORDER BY, LIMIT and OFFSET",
    questions: [
      { difficulty: "Easy", question: "Display the names of all customers in alphabetical order.", answer: "SELECT CustomerName FROM Customers ORDER BY CustomerName;", hint: "Select CustomerName and sort it in ascending order." },
      { difficulty: "Medium", question: "Display each unique product category, arranged alphabetically.", answer: "SELECT DISTINCT Category FROM Products ORDER BY Category;", hint: "Combine DISTINCT with ORDER BY." },
      { difficulty: "Hard", question: "Display the product names and prices ranked fourth through sixth by price, from highest to lowest.", answer: "SELECT ProductName, Price FROM Products ORDER BY Price DESC LIMIT 3 OFFSET 3;", hint: "Sort by descending price, then skip three rows and return the next three." }
    ]

  },


  {
    id: 2,
    title: "Filtering",
    topic: "WHERE and Comparison Operators",
    questions: [
      { difficulty: "Easy", question: "Display customers who live in Chennai.", answer: "SELECT * FROM Customers WHERE city = 'Chennai';", hint: "Use WHERE to compare city with the text value 'Chennai'." },
      { difficulty: "Medium", question: "Display the names and ages of customers who are at least 30 years old. Arrange your output in ascending order of age.", answer: "SELECT CustomerName, age FROM Customers WHERE age >= 30 ORDER BY age;", hint: "Use >= and return only the requested columns." },
      { difficulty: "Hard", question: "Display products priced from 3,000 through 60,000, ordered from the least expensive. Include the product name and price in the query", answer: "SELECT ProductName, Price FROM Products WHERE Price >= 3000 AND Price <= 60000 ORDER BY Price;", hint: "Use both comparison operators to include the two price limits." }
    ]

  },


  {
    id: 3,
    title: "Logical Operators",
    topic: "Between And operators, IN, OR, AND and NOT",
    questions: [
      { difficulty: "Easy", question: "Display the quantity sold along with the sale id and date of sales for the products which were sold in February 2024.", answer: "SELECT saleID,saleDate,quantity FROM sales WHERE saleDate  between '2024-02-01' and '2024-02-29';", hint: "Use BETWEEN to specify the date range." },
      { difficulty: "Medium", question: "Display customers who live in Chennai or Bangalore and are older than 25.", answer: "SELECT * FROM Customers WHERE (city = 'Chennai' OR city = 'Bangalore') AND age > 25;", hint: "Use parentheses so the age condition applies to either city." },
      { difficulty: "Hard", question: "Find the name and age of the oldest male customer from Chennai.", answer: "SELECT name,age FROM Customers WHERE gender = 'M' AND  city = 'Chennai' ORDER BY age DESC LIMIT 1;", hint: "Combine AND with NOT and a comparison." }
    ]

  }

];


levels.push(
  {
    id: 4,
    title: "Pattern Matching",
    topic: "LIKE and Wildcards",
    questions: [
      { difficulty: "Easy", question: "Display products whose names start with Laptop.", answer: "SELECT * FROM Products WHERE ProductName LIKE 'Laptop%';", hint: "Use LIKE with % after the starting text." },
      { difficulty: "Medium", question: "Display the names of products ending with Monitor that cost more than 20,000, ordered alphabetically.", answer: "SELECT ProductName FROM Products WHERE ProductName LIKE '%Monitor' AND Price > 20000 ORDER BY ProductName;", hint: "Use LIKE to match the ending, add a price condition with AND, then sort by product name." },
      { difficulty: "Hard", question: "Display details of sales done on fifth of every month.Arrange your result in descending order of quantity sold", answer: "SELECT * FROM sales WHERE saleDate LIKE '%-05  ORDER BY Quantity desc;", hint: "Use LIKE to match dates ending in '-05', then ORDER BY Quantity DESC." }
    ]
  },
  {
    id: 5,
    title: "Set and Range Filters",
    topic: "IN and BETWEEN",
    questions: [
      { difficulty: "Easy", question: "Display products in the Laptop or Monitor categories using an IN filter.", answer: "SELECT * FROM Products WHERE Category IN ('Laptop', 'Monitor');", hint: "Use IN with both category values." },
      { difficulty: "Medium", question: "Display customers aged from 25 through 32, inclusive, ordered by age.", answer: "SELECT CustomerName, age FROM Customers WHERE age BETWEEN 25 AND 32 ORDER BY age;", hint: "BETWEEN includes both boundary values." },
      { difficulty: "Hard", question: "Display names and prices of products in the Laptop or Monitor categories that cost from 15,000 through 70,000. Sort by price, then name.", answer: "SELECT ProductName, Price FROM Products WHERE Category IN ('Laptop', 'Monitor') AND Price BETWEEN 15000 AND 70000 ORDER BY Price, ProductName;", hint: "Combine IN and BETWEEN, then sort by both requested columns." }
    ]
  },
  {
    id: 15,
    title: "Window Functions",
    topic: "ROW_NUMBER, RANK, SUM OVER and PARTITION BY",
    questions: [
      { difficulty: "Easy", question: "Display each sale ID and quantity with a row number, ordered from the largest quantity to the smallest.", answer: "SELECT SaleID, Quantity, ROW_NUMBER() OVER (ORDER BY Quantity DESC, SaleID) AS row_num FROM Sales ORDER BY row_num;", hint: "Use ROW_NUMBER() OVER with an ORDER BY inside the window." },
      { difficulty: "Medium", question: "Rank each customer's sales by quantity from highest to lowest. Show the customer ID, sale ID, quantity, and rank.", answer: "SELECT CustomerID, SaleID, Quantity, RANK() OVER (PARTITION BY CustomerID ORDER BY Quantity DESC) AS quantity_rank FROM Sales ORDER BY CustomerID, quantity_rank;", hint: "Partition the window by CustomerID and use RANK() with descending quantity." },
      { difficulty: "Hard", question: "For each sale, show the running total quantity for that customer in sale-date order.", answer: "SELECT CustomerID, SaleID, SaleDate, Quantity, SUM(Quantity) OVER (PARTITION BY CustomerID ORDER BY SaleDate, SaleID ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_quantity FROM Sales ORDER BY CustomerID, SaleDate, SaleID;", hint: "Use SUM() OVER, partition by customer, and specify a cumulative window frame." }
    ]
  },
  {
    id: 7,
    title: "Aggregate Functions",
    topic: "COUNT, SUM, AVG, MIN and MAX",
    questions: [
      { difficulty: "Easy", question: "Count how many products are in the Products table. Name the result product_count.", answer: "SELECT COUNT(*) AS product_count FROM Products;", hint: "COUNT(*) counts table rows." },
      { difficulty: "Medium", question: "Show the average, lowest, and highest product prices as average_price, lowest_price, and highest_price.", answer: "SELECT AVG(Price) AS average_price, MIN(Price) AS lowest_price, MAX(Price) AS highest_price FROM Products;", hint: "Use AVG, MIN, and MAX in the same SELECT." },
      { difficulty: "Hard", question: "Show the total units sold and the number of sales records as total_units and sale_count.", answer: "SELECT SUM(Quantity) AS total_units, COUNT(*) AS sale_count FROM Sales;", hint: "Use two aggregate functions in the same SELECT." }
    ]
  },
  {
    id: 8,
    title: "Grouping Rows",
    topic: "GROUP BY",
    questions: [
      { difficulty: "Easy", question: "Count the customers in each city and sort by city.", answer: "SELECT city, COUNT(*) AS customer_count FROM Customers GROUP BY city ORDER BY city;", hint: "Group by city before counting." },
      { difficulty: "Medium", question: "Show the average product price for each category, from highest average to lowest.", answer: "SELECT Category, AVG(Price) AS average_price FROM Products GROUP BY Category ORDER BY average_price DESC;", hint: "Group by Category and sort by the aggregate alias." },
      { difficulty: "Hard", question: "Show the total quantity sold for each customer who made a sale, from greatest quantity to least.", answer: "SELECT CustomerID, SUM(Quantity) AS total_quantity FROM Sales GROUP BY CustomerID ORDER BY total_quantity DESC, CustomerID;", hint: "Group sales by CustomerID and use SUM." }
    ]
  },
  {
    id: 9,
    title: "Filtering Groups",
    topic: "HAVING",
    questions: [
      { difficulty: "Easy", question: "Show cities with at least two customers and their customer counts.", answer: "SELECT city, COUNT(*) AS customer_count FROM Customers GROUP BY city HAVING COUNT(*) >= 2 ORDER BY city;", hint: "Use HAVING to filter the grouped count." },
      { difficulty: "Medium", question: "Show product categories whose average price is greater than 10,000.", answer: "SELECT Category, AVG(Price) AS average_price FROM Products GROUP BY Category HAVING AVG(Price) > 10000 ORDER BY average_price DESC;", hint: "Filter the grouped average with HAVING." },
      { difficulty: "Hard", question: "Show customers whose total purchased quantity is at least two, with their total quantity, ordered by customer ID.", answer: "SELECT CustomerID, SUM(Quantity) AS total_quantity FROM Sales GROUP BY CustomerID HAVING SUM(Quantity) >= 2 ORDER BY CustomerID;", hint: "Group by customer and apply the threshold with HAVING." }
    ]
  },
  {
    id: 10,
    title: "Aliases and Calculations",
    topic: "Column Aliases and Arithmetic Expressions",
    questions: [
      { difficulty: "Easy", question: "Display every customer name under the heading customer_name.", answer: "SELECT CustomerName AS customer_name FROM Customers;", hint: "Use AS to give the output column an alias." },
      { difficulty: "Medium", question: "For each product, show its name and price after adding 10%, under the heading price_with_markup. Sort by product name.", answer: "SELECT ProductName, Price * 1.10 AS price_with_markup FROM Products ORDER BY ProductName;", hint: "Multiply Price by 1.10 and assign the expression an alias." },
      { difficulty: "Hard", question: "For each sale, show its ID and the sale value (quantity times product price) as sale_value, highest value first.", answer: "SELECT Sales.SaleID, Sales.Quantity * Products.Price AS sale_value FROM Sales JOIN Products ON Sales.ProductID = Products.ProductID ORDER BY sale_value DESC;", hint: "Join sales to products, multiply quantity by price, and sort by the calculated alias." }
    ]
  },
  {
    id: 11,
    title: "Matching Records",
    topic: "INNER JOIN",
    questions: [
      { difficulty: "Easy", question: "Display each sale ID with the name of the customer who made it.", answer: "SELECT Sales.SaleID, Customers.CustomerName FROM Sales INNER JOIN Customers ON Sales.CustomerID = Customers.customerID ORDER BY Sales.SaleID;", hint: "Match Sales.CustomerID to Customers.customerID." },
      { difficulty: "Medium", question: "Display sale IDs with their product names and quantities, ordered by sale ID.", answer: "SELECT Sales.SaleID, Products.ProductName, Sales.Quantity FROM Sales INNER JOIN Products ON Sales.ProductID = Products.ProductID ORDER BY Sales.SaleID;", hint: "Join Sales and Products on ProductID." },
      { difficulty: "Hard", question: "Display the customer name, product name, and quantity for each sale, ordered by sale ID.", answer: "SELECT Customers.CustomerName, Products.ProductName, Sales.Quantity FROM Sales INNER JOIN Customers ON Sales.CustomerID = Customers.customerID INNER JOIN Products ON Sales.ProductID = Products.ProductID ORDER BY Sales.SaleID;", hint: "Join Sales to both Customers and Products." }
    ]
  },
  {
    id: 12,
    title: "Keeping Unmatched Rows",
    topic: "LEFT JOIN",
    questions: [
      { difficulty: "Easy", question: "List every customer and any matching sale ID, keeping customers without sales.", answer: "SELECT Customers.CustomerName, Sales.SaleID FROM Customers LEFT JOIN Sales ON Customers.customerID = Sales.CustomerID ORDER BY Customers.customerID;", hint: "Start from Customers and LEFT JOIN Sales." },
      { difficulty: "Medium", question: "Find customers who have not made a purchase.", answer: "SELECT Customers.CustomerName FROM Customers LEFT JOIN Sales ON Customers.customerID = Sales.CustomerID WHERE Sales.SaleID IS NULL;", hint: "Keep all customers, then filter for the missing joined sale ID." },
      { difficulty: "Hard", question: "List every customer and the number of sales they made, including customers with zero sales, ordered by customer ID.", answer: "SELECT Customers.customerID, Customers.CustomerName, COUNT(Sales.SaleID) AS sale_count FROM Customers LEFT JOIN Sales ON Customers.customerID = Sales.CustomerID GROUP BY Customers.customerID, Customers.CustomerName ORDER BY Customers.customerID;", hint: "Use LEFT JOIN and count a Sales column so unmatched rows count as zero." }
    ]
  },
  {
    id: 13,
    title: "Combining Tables",
    topic: "Joining Three Tables",
    questions: [
      { difficulty: "Easy", question: "Show each sale ID, customer name, and product name by joining all three tables.", answer: "SELECT Sales.SaleID, Customers.CustomerName, Products.ProductName FROM Sales JOIN Customers ON Sales.CustomerID = Customers.customerID JOIN Products ON Sales.ProductID = Products.ProductID ORDER BY Sales.SaleID;", hint: "Connect Sales to Customers and Products using their IDs." },
      { difficulty: "Medium", question: "Show customer names and product names for sales of Laptop-category products.", answer: "SELECT Customers.CustomerName, Products.ProductName FROM Sales JOIN Customers ON Sales.CustomerID = Customers.customerID JOIN Products ON Sales.ProductID = Products.ProductID WHERE Products.Category = 'Laptop' ORDER BY Customers.CustomerName;", hint: "Join all three tables, then filter the product category." },
      { difficulty: "Hard", question: "Calculate each customer's total purchase value using quantity times product price; show customer name and total_value, highest first.", answer: "SELECT Customers.CustomerName, SUM(Sales.Quantity * Products.Price) AS total_value FROM Sales JOIN Customers ON Sales.CustomerID = Customers.customerID JOIN Products ON Sales.ProductID = Products.ProductID GROUP BY Customers.customerID, Customers.CustomerName ORDER BY total_value DESC;", hint: "Join all three tables, sum the line values, and group by customer." }
    ]
  },
  {
    id: 14,
    title: "Nested Queries",
    topic: "Subqueries",
    questions: [
      { difficulty: "Easy", question: "Find products priced above the average product price.", answer: "SELECT ProductName, Price FROM Products WHERE Price > (SELECT AVG(Price) FROM Products) ORDER BY Price;", hint: "Compare Price to a scalar AVG subquery." },
      { difficulty: "Medium", question: "Find customers older than the average customer age, ordered by age.", answer: "SELECT CustomerName, age FROM Customers WHERE age > (SELECT AVG(age) FROM Customers) ORDER BY age;", hint: "Calculate the average age in a subquery." },
      { difficulty: "Hard", question: "Find every product tied for the highest price.", answer: "SELECT ProductName, Price FROM Products WHERE Price = (SELECT MAX(Price) FROM Products);", hint: "Compare each price to a subquery that returns the maximum price." }
    ]
  },
  {
    id: 16,
    title: "Conditional Results",
    topic: "CASE Expressions",
    questions: [
      { difficulty: "Easy", question: "Show each product name and label its stock as Low when below 20, otherwise Available.", answer: "SELECT ProductName, CASE WHEN Stock < 20 THEN 'Low' ELSE 'Available' END AS stock_status FROM Products ORDER BY ProductID;", hint: "Use CASE WHEN Stock < 20 and provide an ELSE label." },
      { difficulty: "Medium", question: "Show each customer name and label them Senior when age is at least 30, otherwise Junior. Order by name.", answer: "SELECT CustomerName, CASE WHEN age >= 30 THEN 'Senior' ELSE 'Junior' END AS age_group FROM Customers ORDER BY CustomerName;", hint: "Build the label with a CASE expression." },
      { difficulty: "Hard", question: "For each product category, count products priced at 50,000 or more as premium_count and all others as standard_count.", answer: "SELECT Category, SUM(CASE WHEN Price >= 50000 THEN 1 ELSE 0 END) AS premium_count, SUM(CASE WHEN Price < 50000 THEN 1 ELSE 0 END) AS standard_count FROM Products GROUP BY Category ORDER BY Category;", hint: "Use conditional SUM expressions and group by category." }
    ]
  },
  {
    id: 17,
    title: "String, Numeric and Date Functions",
    topic: "UPPER, LENGTH, ROUND, ABS, DATE and STRFTIME",
    questions: [
      { difficulty: "Easy", question: "Display customer names in uppercase.", answer: "SELECT UPPER(CustomerName) AS customer_name FROM Customers ORDER BY CustomerName;", hint: "Apply UPPER() to CustomerName." },
      { difficulty: "Medium", question: "Show each product name and its character count, longest names first.", answer: "SELECT ProductName, LENGTH(ProductName) AS name_length FROM Products ORDER BY name_length DESC, ProductName;", hint: "Use LENGTH() to count characters, then sort by the result." },
      { difficulty: "Hard", question: "Display each sale's ID, date, and the year of that date. Exclude sales without a date.", answer: "SELECT SaleID, SaleDate, STRFTIME('%Y', SaleDate) AS sale_year FROM Sales WHERE SaleDate IS NOT NULL ORDER BY SaleDate;", hint: "Extract the year with STRFTIME('%Y', SaleDate) and filter out NULL dates." }
    ]
  }
);

const additionalQuestions = [
  [0, "Easy", "Display all product names.", "SELECT ProductName FROM Products;", "Select the ProductName column from Products."],
  [0, "Easy", "Display every sale ID and quantity.", "SELECT SaleID, Quantity FROM Sales;", "Select the two requested columns from Sales."],
  [0, "Medium", "Show the four least expensive products with their names and prices.", "SELECT ProductName, Price FROM Products ORDER BY Price LIMIT 4;", "Sort Price ascending and limit the result to four rows."],
  [0, "Medium", "Display customer names and ages, oldest first and alphabetically for ties.", "SELECT CustomerName, age FROM Customers ORDER BY age DESC, CustomerName;", "Sort by age descending, then by name ascending."],
  [0, "Hard", "Display product names and prices ranked fourth through sixth from least to most expensive.", "SELECT ProductName, Price FROM Products ORDER BY Price LIMIT 3 OFFSET 3;", "Sort by price ascending, skip three rows, and return three."],
  [0, "Hard", "Display the two most expensive products, showing only their names.", "SELECT ProductName FROM Products ORDER BY Price DESC LIMIT 2;", "Sort by descending price, then limit to two rows."],

  [1, "Easy", "Display male customers who are at least 30 years old.", "SELECT * FROM Customers WHERE gender = 'M' AND age >= 30;", "Filter for male customers and use >= to require an age of at least 30."],
  [1, "Easy", "Find the cheapest product priced below 20,000. Show its name and price.", "SELECT ProductName, Price FROM Products WHERE Price < 20000 ORDER BY Price LIMIT 1;", "Filter prices below 20,000, sort from lowest to highest, and return the first row."],
  [1, "Medium", "Display customer names for customers from Chennai who are at least 25 years old.", "SELECT CustomerName FROM Customers WHERE city = 'Chennai' AND age >= 25;", "Use both city and age conditions."],
  [1, "Medium", "Display products with stock less than 20 or a price greater than 60,000.", "SELECT * FROM Products WHERE Stock < 20 OR Price > 60000;", "Combine the two comparisons with OR."],
  [1, "Hard", "Display names and ages of female customers aged 25 or older, ordered from oldest to youngest.", "SELECT CustomerName, age FROM Customers WHERE gender = 'F' AND age >= 25 ORDER BY age DESC;", "Filter on both gender and age, then sort descending by age."],
  [1, "Hard", "Display the name, price and stock of products costing less than 60,000 except those with stock below 20.", "SELECT ProductName, Price, Stock FROM Products WHERE Price < 60000 AND Stock >= 20 ORDER BY Price;", "Use both conditions to exclude low-stock products."],

  [2, "Easy", "Find the saleid and productid of the products whose saleid is not known.", "SELECT saleid, productID  FROM Customers WHERE saledate is null;", "Compare the saledate column to NULL."],
  [2, "Easy", "Display customers who are either male or older than 35.", "SELECT * FROM Customers WHERE gender = 'M' OR age > 35;", "Use OR so either condition can match."],
  [2, "Medium", "Display the details of Laptops and Monitors.", "SELECT * FROM Products WHERE category IN ('Laptop','Monitor');", "Use IN operator instead of OR."],
  [2, "Medium", "Display customers who are older than 30 and do not live in Mumbai.", "SELECT * FROM Customers WHERE age > 30 AND NOT city = 'Mumbai';", "Combine the age filter with NOT on the city."],
  [2, "Hard", "Display customers who live in Chennai or Bangalore, are younger than 35, and are female.", "SELECT * FROM Customers WHERE (city = 'Chennai' OR city = 'Bangalore') AND age < 35 AND gender = 'F';", "Group the city alternatives, then apply both remaining conditions."],
  [2, "Hard", "Display products that are laptops priced above 60,000 or monitors priced above 20,000.", "SELECT ProductName, Category, Price FROM Products WHERE (Category = 'Laptop' AND Price > 60000) OR (Category = 'Monitor' AND Price > 20000);", "Use parentheses to pair each category with its own price condition."],

  [3, "Easy", "Find the names of the customers whose names ends with 'ma'", "SELECT customerName FROM customers WHERE Name LIKE '%ma';", "Use percent signs on both sides to match text anywhere in the name."],
  [3, "Easy", "Display the details of sales done in the year 2024.", "SELECT * FROM sales WHERE saledate LIKE '2024%';", "Place wildcards before  the matching text."],
  [3, "Medium", "Display product names with a three-character category-independent prefix followed by a space and Inch.", "SELECT ProductName FROM Products WHERE ProductName LIKE '___ Inch%';", "Each underscore matches one character; % matches the rest."],
  [3, "Medium", "Display products whose names contain the letter o and whose category is not Laptop.", "SELECT ProductName, Category FROM Products WHERE ProductName LIKE '%o%' AND Category <> 'Laptop';", "Combine a contains pattern with a category exclusion."],
  [3, "Hard", "Display names of the customers that contain an e and a.", "SELECT customerName FROM customers WHERE custoemrName LIKE '%e%a%';", "Use two LIKE predicates."],
  [3, "Hard", "Display products whose names contain a space and end with a digit.", "SELECT ProductName FROM Products WHERE ProductName LIKE '% %' AND ProductName GLOB '*[0-9]';", "Combine LIKE for the space with GLOB and a digit range."],

  [4, "Easy", "Display customers whose ages are between 25 and 30 inclusive.", "SELECT * FROM Customers WHERE age BETWEEN 25 AND 30;", "Use BETWEEN with the two age limits."],
  [4, "Easy", "Display products in the Accessories or Mobile categories.", "SELECT * FROM Products WHERE Category IN ('Accessories', 'Mobile');", "List both category values inside IN."],
  [4, "Medium", "Display products priced between 1,000 and 20,000 inclusive.", "SELECT ProductName, Price FROM Products WHERE Price BETWEEN 1000 AND 20000 ORDER BY Price;", "Use BETWEEN and sort by price."],
  [4, "Medium", "Display customers whose city is Chennai, Mumbai, or Kochi.", "SELECT CustomerName, city FROM Customers WHERE city IN ('Chennai', 'Mumbai', 'Kochi') ORDER BY city;", "Use IN with all three city names."],
  [4, "Hard", "Display sales made during January 2024, ordered by date.", "SELECT SaleID, SaleDate FROM Sales WHERE SaleDate BETWEEN '2024-01-01' AND '2024-01-31' ORDER BY SaleDate;", "Use BETWEEN on the ISO-formatted date values."],
  [4, "Hard", "Display Laptop or Monitor products priced between 15,000 and 70,000.", "SELECT ProductName, Category, Price FROM Products WHERE Category IN ('Laptop', 'Monitor') AND Price BETWEEN 15000 AND 70000 ORDER BY Price;", "Combine a category list with an inclusive price range."],

  [5, "Easy", "Number products from most expensive to least expensive within each category.", "SELECT ProductName, Category, Price, ROW_NUMBER() OVER (PARTITION BY Category ORDER BY Price DESC, ProductID) AS price_position FROM Products ORDER BY Category, price_position;", "Partition by category and number rows in descending price order."],
  [5, "Easy", "Show each sale's quantity alongside the average quantity across all sales.", "SELECT SaleID, Quantity, AVG(Quantity) OVER () AS average_quantity FROM Sales ORDER BY SaleID;", "Use AVG() OVER () to calculate a window value across all rows."],
  [5, "Medium", "For each sale, show the previous sale date for the same customer, ordered by date.", "SELECT CustomerID, SaleID, SaleDate, LAG(SaleDate) OVER (PARTITION BY CustomerID ORDER BY SaleDate, SaleID) AS previous_sale_date FROM Sales ORDER BY CustomerID, SaleDate, SaleID;", "Use LAG() OVER with a customer partition and date ordering."],
  [5, "Medium", "Rank products from most expensive to least expensive within each category, allowing ties to share a rank.", "SELECT ProductName, Category, Price, RANK() OVER (PARTITION BY Category ORDER BY Price DESC) AS price_rank FROM Products ORDER BY Category, price_rank;", "Use RANK() OVER and partition the results by category."],
  [5, "Hard", "For each customer, show the difference between a sale's quantity and that customer's average sale quantity.", "SELECT CustomerID, SaleID, Quantity, Quantity - AVG(Quantity) OVER (PARTITION BY CustomerID) AS difference_from_average FROM Sales ORDER BY CustomerID, SaleID;", "Subtract the customer's partitioned window average from each quantity."],
  [5, "Hard", "Show each sale's quantity and the cumulative quantity sold across all customers in date order.", "SELECT SaleID, SaleDate, Quantity, SUM(Quantity) OVER (ORDER BY SaleDate, SaleID ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_quantity FROM Sales ORDER BY SaleDate, SaleID;", "Use SUM() OVER with an ordered cumulative window frame."],

  [6, "Easy", "Count the customers and name the result customer_count.", "SELECT COUNT(*) AS customer_count FROM Customers;", "Use COUNT(*) with an alias."],
  [6, "Easy", "Show the lowest product price as lowest_price.", "SELECT MIN(Price) AS lowest_price FROM Products;", "Use MIN on the Price column."],
  [6, "Medium", "Show the total stock across all products as total_stock.", "SELECT SUM(Stock) AS total_stock FROM Products;", "Use SUM on Stock."],
  [6, "Medium", "Show the average customer age rounded to one decimal place as average_age.", "SELECT ROUND(AVG(age), 1) AS average_age FROM Customers;", "Use ROUND around AVG with one decimal place."],
  [6, "Hard", "Show the minimum, average, and maximum customer age as youngest, average_age, and oldest.", "SELECT MIN(age) AS youngest, ROUND(AVG(age), 1) AS average_age, MAX(age) AS oldest FROM Customers;", "Combine MIN, AVG, and MAX in one aggregate query."],
  [6, "Hard", "Show the total sales quantity and average quantity per sale, both rounded to one decimal where needed.", "SELECT SUM(Quantity) AS total_quantity, ROUND(AVG(Quantity), 1) AS average_quantity FROM Sales;", "Use SUM and rounded AVG on Quantity."],

  [7, "Easy", "Count the number of products in each category.", "SELECT Category, COUNT(*) AS product_count FROM Products GROUP BY Category ORDER BY Category;", "Group product rows by Category."],
  [7, "Easy", "Show the number of sales recorded on each sale date.", "SELECT SaleDate, COUNT(*) AS sale_count FROM Sales GROUP BY SaleDate ORDER BY SaleDate;", "Group by SaleDate and count each group."],
  [7, "Medium", "Show total stock for each product category, highest total first.", "SELECT Category, SUM(Stock) AS total_stock FROM Products GROUP BY Category ORDER BY total_stock DESC;", "Group by category, sum stock, and sort by the total."],
  [7, "Medium", "Show the average customer age for each gender.", "SELECT gender, ROUND(AVG(age), 1) AS average_age FROM Customers GROUP BY gender ORDER BY gender;", "Group by gender and average age."],
  [7, "Hard", "Show the number of products and average price per category, sorted from most products to least.", "SELECT Category, COUNT(*) AS product_count, AVG(Price) AS average_price FROM Products GROUP BY Category ORDER BY product_count DESC, Category;", "Use multiple aggregates and sort by the count."],
  [7, "Hard", "Show total quantity and sale count for each customer who has sales, highest quantity first.", "SELECT CustomerID, SUM(Quantity) AS total_quantity, COUNT(*) AS sale_count FROM Sales GROUP BY CustomerID ORDER BY total_quantity DESC, CustomerID;", "Group by CustomerID and calculate both aggregates."],

  [8, "Easy", "Show product categories with more than one product.", "SELECT Category, COUNT(*) AS product_count FROM Products GROUP BY Category HAVING COUNT(*) > 1;", "Filter grouped categories with HAVING."],
  [8, "Easy", "Show cities with at least two customers.", "SELECT city, COUNT(*) AS customer_count FROM Customers GROUP BY city HAVING COUNT(*) >= 2;", "Use HAVING with a grouped customer count."],
  [8, "Medium", "Show product categories whose total stock exceeds 50.", "SELECT Category, SUM(Stock) AS total_stock FROM Products GROUP BY Category HAVING SUM(Stock) > 50 ORDER BY total_stock DESC;", "Apply the stock threshold after grouping."],
  [8, "Medium", "Show customer IDs whose total purchased quantity is at least two.", "SELECT CustomerID, SUM(Quantity) AS total_quantity FROM Sales GROUP BY CustomerID HAVING SUM(Quantity) >= 2 ORDER BY CustomerID;", "Group sales by customer and filter the aggregate."],
  [8, "Hard", "Show product categories with at least two products and an average price above 10,000.", "SELECT Category, COUNT(*) AS product_count, AVG(Price) AS average_price FROM Products GROUP BY Category HAVING COUNT(*) >= 2 AND AVG(Price) > 10000 ORDER BY average_price DESC;", "Use both aggregate conditions in HAVING."],
  [8, "Hard", "Show customers whose total purchase quantity is greater than one and who have made more than one sale.", "SELECT CustomerID, SUM(Quantity) AS total_quantity, COUNT(*) AS sale_count FROM Sales GROUP BY CustomerID HAVING SUM(Quantity) > 1 AND COUNT(*) > 1;", "Use multiple aggregate conditions in HAVING."],

  [9, "Easy", "Display customer names using the heading name.", "SELECT CustomerName AS name FROM Customers;", "Assign CustomerName the alias name."],
  [9, "Easy", "Display product names and stock using the heading units_available for stock.", "SELECT ProductName, Stock AS units_available FROM Products;", "Alias the Stock column."],
  [9, "Medium", "Display each product name and the value of its current stock (price multiplied by stock) as inventory_value.", "SELECT ProductName, Price * Stock AS inventory_value FROM Products;", "Multiply Price by Stock and alias the expression."],
  [9, "Medium", "Display each sale ID and quantity increased by one, naming the calculated column next_quantity.", "SELECT SaleID, Quantity + 1 AS next_quantity FROM Sales;", "Add one to Quantity and use an alias."],
  [9, "Hard", "Display products with their price after a 10 percent reduction, rounded to two decimals as sale_price.", "SELECT ProductName, ROUND(Price * 0.90, 2) AS sale_price FROM Products ORDER BY sale_price;", "Multiply by 0.90, round, and sort by the alias."],
  [9, "Hard", "Show each sale ID and its extended value (quantity times product price) as sale_value, highest first.", "SELECT Sales.SaleID, Sales.Quantity * Products.Price AS sale_value FROM Sales JOIN Products ON Sales.ProductID = Products.ProductID ORDER BY sale_value DESC;", "Join to Products, calculate quantity times price, and sort by the result."],

  [10, "Easy", "Display each sale ID with the matching customer name.", "SELECT Sales.SaleID, Customers.CustomerName FROM Sales JOIN Customers ON Sales.CustomerID = Customers.customerID ORDER BY Sales.SaleID;", "Join Sales to Customers using their ID columns."],
  [10, "Easy", "Display each sale ID with the name of the purchased product.", "SELECT Sales.SaleID, Products.ProductName FROM Sales JOIN Products ON Sales.ProductID = Products.ProductID ORDER BY Sales.SaleID;", "Join Sales and Products using ProductID."],
  [10, "Medium", "Display customer names and sale dates for sales made in January 2024.", "SELECT Customers.CustomerName, Sales.SaleDate FROM Sales JOIN Customers ON Sales.CustomerID = Customers.customerID WHERE Sales.SaleDate BETWEEN '2024-01-01' AND '2024-01-31' ORDER BY Sales.SaleDate;", "Join Customers to Sales, then filter the dates."],
  [10, "Medium", "Display product names and quantities for products with fewer than 30 units in stock that were sold.", "SELECT Products.ProductName, Sales.Quantity FROM Sales JOIN Products ON Sales.ProductID = Products.ProductID WHERE Products.Stock < 30 ORDER BY Products.ProductName;", "Join on ProductID and filter the product stock."],
  [10, "Hard", "Show each sale ID, customer name, and product name, ordered by the customer name and sale ID.", "SELECT Sales.SaleID, Customers.CustomerName, Products.ProductName FROM Sales JOIN Customers ON Sales.CustomerID = Customers.customerID JOIN Products ON Sales.ProductID = Products.ProductID ORDER BY Customers.CustomerName, Sales.SaleID;", "Join each table through Sales and sort by both columns."],
  [10, "Hard", "Show customer and product names for each sale where the product costs more than 20,000.", "SELECT Customers.CustomerName, Products.ProductName FROM Sales JOIN Customers ON Sales.CustomerID = Customers.customerID JOIN Products ON Sales.ProductID = Products.ProductID WHERE Products.Price > 20000 ORDER BY Products.Price DESC;", "Join both related tables and filter the product price."],

  [11, "Easy", "List every customer and any matching sale ID, keeping customers without sales.", "SELECT Customers.CustomerName, Sales.SaleID FROM Customers LEFT JOIN Sales ON Customers.customerID = Sales.CustomerID ORDER BY Customers.customerID;", "Start with Customers and LEFT JOIN Sales."],
  [11, "Easy", "List every product and the ID of any sale that includes it, including products never sold.", "SELECT Products.ProductName, Sales.SaleID FROM Products LEFT JOIN Sales ON Products.ProductID = Sales.ProductID ORDER BY Products.ProductID;", "Start with Products to retain products without sales."],
  [11, "Medium", "Find customer names for customers who have not made a purchase.", "SELECT Customers.CustomerName FROM Customers LEFT JOIN Sales ON Customers.customerID = Sales.CustomerID WHERE Sales.SaleID IS NULL;", "Filter the unmatched side of the LEFT JOIN."],
  [11, "Medium", "Count sales for every product, including products with no sales.", "SELECT Products.ProductName, COUNT(Sales.SaleID) AS sale_count FROM Products LEFT JOIN Sales ON Products.ProductID = Sales.ProductID GROUP BY Products.ProductID, Products.ProductName ORDER BY Products.ProductName;", "LEFT JOIN, then count a Sales column so unmatched products count as zero."],
  [11, "Hard", "List every customer and their total purchased quantity, showing zero for customers without sales.", "SELECT Customers.CustomerName, COALESCE(SUM(Sales.Quantity), 0) AS total_quantity FROM Customers LEFT JOIN Sales ON Customers.customerID = Sales.CustomerID GROUP BY Customers.customerID, Customers.CustomerName ORDER BY Customers.customerID;", "Use LEFT JOIN, group by customer, and replace a missing sum with zero."],
  [11, "Hard", "Find products that have never appeared in Sales.", "SELECT Products.ProductName FROM Products LEFT JOIN Sales ON Products.ProductID = Sales.ProductID WHERE Sales.SaleID IS NULL ORDER BY Products.ProductName;", "Keep all products and select rows where the joined sale ID is NULL."],

  [12, "Easy", "Display each sale ID, customer name, and product name using all three tables.", "SELECT Sales.SaleID, Customers.CustomerName, Products.ProductName FROM Sales JOIN Customers ON Sales.CustomerID = Customers.customerID JOIN Products ON Sales.ProductID = Products.ProductID ORDER BY Sales.SaleID;", "Join Sales to Customers and Products through their IDs."],
  [12, "Easy", "Show product names and the customer names of people who bought them.", "SELECT Products.ProductName, Customers.CustomerName FROM Sales JOIN Products ON Sales.ProductID = Products.ProductID JOIN Customers ON Sales.CustomerID = Customers.customerID ORDER BY Products.ProductName;", "Use Sales as the link between Products and Customers."],
  [12, "Medium", "Show customer names and product names for sales of products in the Monitor category.", "SELECT Customers.CustomerName, Products.ProductName FROM Sales JOIN Customers ON Sales.CustomerID = Customers.customerID JOIN Products ON Sales.ProductID = Products.ProductID WHERE Products.Category = 'Monitor' ORDER BY Customers.CustomerName;", "Join all three tables, then filter Category."],
  [12, "Medium", "Show each customer name and the total quantity they purchased, including the product details in the join.", "SELECT Customers.CustomerName, SUM(Sales.Quantity) AS total_quantity FROM Sales JOIN Customers ON Sales.CustomerID = Customers.customerID JOIN Products ON Sales.ProductID = Products.ProductID GROUP BY Customers.customerID, Customers.CustomerName ORDER BY Customers.customerID;", "Join all three tables, sum quantity, and group by customer."],
  [12, "Hard", "Calculate total revenue by product category as revenue, highest revenue first.", "SELECT Products.Category, SUM(Sales.Quantity * Products.Price) AS revenue FROM Sales JOIN Products ON Sales.ProductID = Products.ProductID JOIN Customers ON Sales.CustomerID = Customers.customerID GROUP BY Products.Category ORDER BY revenue DESC;", "Join the three tables, sum quantity times price, and group by category."],
  [12, "Hard", "Show the number of sales and total quantity for each customer-city pair.", "SELECT Customers.city, Customers.CustomerName, COUNT(Sales.SaleID) AS sale_count, SUM(Sales.Quantity) AS total_quantity FROM Sales JOIN Customers ON Sales.CustomerID = Customers.customerID JOIN Products ON Sales.ProductID = Products.ProductID GROUP BY Customers.customerID, Customers.city, Customers.CustomerName ORDER BY Customers.city, Customers.CustomerName;", "Join all three tables and group by the customer and city."],

  [13, "Easy", "Find products that cost more than the average product price.", "SELECT ProductName, Price FROM Products WHERE Price > (SELECT AVG(Price) FROM Products) ORDER BY Price;", "Compare each product price to a scalar average subquery."],
  [13, "Easy", "Find customers older than the average customer age.", "SELECT CustomerName, age FROM Customers WHERE age > (SELECT AVG(age) FROM Customers) ORDER BY age;", "Use a subquery to calculate average age."],
  [13, "Medium", "Find products priced at the maximum product price.", "SELECT ProductName, Price FROM Products WHERE Price = (SELECT MAX(Price) FROM Products);", "Compare Price to a subquery that returns the maximum."],
  [13, "Medium", "Find customers who live in a city that has at least two customers.", "SELECT CustomerName, city FROM Customers WHERE city IN (SELECT city FROM Customers GROUP BY city HAVING COUNT(*) >= 2) ORDER BY city, CustomerName;", "Use a grouped city subquery with IN."],
  [13, "Hard", "Find products priced above the average price of products in their own category.", "SELECT ProductName, Category, Price FROM Products AS p WHERE Price > (SELECT AVG(Price) FROM Products WHERE Category = p.Category) ORDER BY Category, Price;", "Correlate the subquery with the outer product category."],
  [13, "Hard", "Find customers who have at least one sale, using EXISTS.", "SELECT CustomerName FROM Customers AS c WHERE EXISTS (SELECT 1 FROM Sales WHERE CustomerID = c.customerID) ORDER BY CustomerName;", "Correlate EXISTS to the customer's ID."],

  [14, "Easy", "Group product categories into Computing for Laptops, Displays for Monitors, and Other for the remaining products.", "SELECT ProductName, CASE Category WHEN 'Laptop' THEN 'Computing' WHEN 'Monitor' THEN 'Displays' ELSE 'Other' END AS product_group FROM Products ORDER BY ProductName;", "Use a simple CASE expression to map each category to a label."],
  [14, "Easy", "Show each sale ID and label its date as Missing or Recorded.", "SELECT SaleID, CASE WHEN SaleDate IS NULL THEN 'Missing' ELSE 'Recorded' END AS date_status FROM Sales ORDER BY SaleID;", "Use CASE with IS NULL to distinguish missing dates."],
  [14, "Medium", "Classify product prices as Budget below 5,000, Mid-range below 30,000, and Premium otherwise.", "SELECT ProductName, CASE WHEN Price < 5000 THEN 'Budget' WHEN Price < 30000 THEN 'Mid-range' ELSE 'Premium' END AS price_band FROM Products ORDER BY Price;", "Use ordered WHEN branches for the three price ranges."],
  [14, "Medium", "Show each sale ID and label its quantity as Bulk for 2 or more units, otherwise Single.", "SELECT SaleID, CASE WHEN Quantity >= 2 THEN 'Bulk' ELSE 'Single' END AS sale_type FROM Sales ORDER BY SaleID;", "Use CASE to test Quantity."],
  [14, "Hard", "Show each product and assign a restock priority: Urgent for laptops with stock below 20, Review for other products below 20, and None otherwise.", "SELECT ProductName, CASE WHEN Category = 'Laptop' AND Stock < 20 THEN 'Urgent' WHEN Stock < 20 THEN 'Review' ELSE 'None' END AS restock_priority FROM Products ORDER BY ProductID;", "Use ordered CASE conditions so the laptop-specific rule is checked first."],
  [14, "Hard", "Show each customer with a label Frequent for at least two sales, otherwise Occasional, including customers with no sales.", "SELECT Customers.CustomerName, CASE WHEN COUNT(Sales.SaleID) >= 2 THEN 'Frequent' ELSE 'Occasional' END AS customer_type FROM Customers LEFT JOIN Sales ON Customers.customerID = Sales.CustomerID GROUP BY Customers.customerID, Customers.CustomerName ORDER BY Customers.customerID;", "LEFT JOIN, group by customer, and use CASE with the sale count."],

  [15, "Easy", "Display product prices rounded to the nearest hundred.", "SELECT ProductName, ROUND(Price / 100.0) * 100 AS rounded_price FROM Products ORDER BY ProductID;", "Divide by 100, round to a whole number, then multiply by 100."],
  [15, "Easy", "Show each sale ID and the sale date seven days later, excluding sales without a date.", "SELECT SaleID, DATE(SaleDate, '+7 days') AS date_after_week FROM Sales WHERE SaleDate IS NOT NULL ORDER BY SaleDate;", "Use DATE() with a '+7 days' modifier."],
  [15, "Medium", "Show product names with their first three characters in lowercase.", "SELECT ProductName, LOWER(SUBSTR(ProductName, 1, 3)) AS name_prefix FROM Products ORDER BY ProductName;", "Combine SUBSTR() to extract the prefix and LOWER() to change its case."],
  [15, "Medium", "Show each product's price difference from 50,000 as a positive value, rounded to two decimal places.", "SELECT ProductName, ROUND(ABS(Price - 50000), 2) AS price_difference FROM Products ORDER BY price_difference;", "Use ABS() for a positive difference, then round the result."],
  [15, "Hard", "Display each sale's date as month-day and its quantity, ordered chronologically.", "SELECT SaleID, STRFTIME('%m-%d', SaleDate) AS month_day, Quantity FROM Sales WHERE SaleDate IS NOT NULL ORDER BY SaleDate, SaleID;", "Format the date with STRFTIME('%m-%d', SaleDate) and order by the original date."],
  [15, "Hard", "Show product names in uppercase and the price after a 7.5 percent increase, rounded to two decimals.", "SELECT UPPER(ProductName) AS product_name, ROUND(Price * 1.075, 2) AS increased_price FROM Products ORDER BY ProductID;", "Apply UPPER() to the name and ROUND() to the increased price."]
];

additionalQuestions.forEach(
  ([levelIndex, difficulty, question, answer, hint]) => {
    levels[levelIndex].questions.push({
      difficulty,
      question,
      answer,
      hint
    });
  }
);

const difficultyOrder = {
  Easy: 0,
  Medium: 1,
  Hard: 2
};

levels.forEach(level => {
  level.questions.sort(
    (a, b) =>
      difficultyOrder[a.difficulty] -
      difficultyOrder[b.difficulty]
  );
});

function getLevelDisplayOrder() {
  return levels
    .map((level, index) => ({ level, index }))
    .sort((a, b) => a.level.id - b.level.id);
}


/* =========================================================
   CALCULATE TOTAL QUESTIONS
   ========================================================= */

function getTotalQuestions() {

  return levels.reduce(
    (
      total,
      level
    ) =>
      total +
      level.questions.length,
    0
  );

}


/* =========================================================
   DATABASE INITIALIZATION
   ========================================================= */

async function initDatabase() {

  try {

    if (
      typeof initSqlJs !==
      "function"
    ) {

      console.error(
        "sql.js has not loaded."
      );

      setFeedback(
        "SQL engine could not be loaded. Please check the sql.js CDN.",
        "error"
      );

      return;

    }


    const SQL =
      await initSqlJs({

        locateFile:
          file =>
            `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`

      });


    db =
      new SQL.Database();


    createDatabaseTables();


    console.log(
      "SQL database initialized."
    );

  }

  catch (error) {

    console.error(
      "Database initialization error:",
      error
    );

    setFeedback(
      "Unable to initialize the SQL practice database.",
      "error"
    );

  }

}


/* =========================================================
   CREATE DATABASE TABLES
   ========================================================= */

function createDatabaseTables() {

  if (!db) {
    return;
  }


  Object.entries(schema)
    .forEach(
      (
        [tableName, info]
      ) => {

        const columns =
          info.columns
            .map(
              column =>
                `"${column.name}" ${column.type}`
            )
            .join(", ");


        db.run(
          `CREATE TABLE ${tableName} (${columns});`
        );


        const placeholders =
          info.columns
            .map(
              () => "?"
            )
            .join(", ");


        info.sampleData.forEach(
          row => {

            db.run(
              `INSERT INTO ${tableName}
               VALUES (${placeholders});`,
              row
            );

          }
        );

      }
    );

}


/* =========================================================
   LOAD / SAVE PROGRESS
   ========================================================= */

function loadProgress() {

  try {

    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (saved) {

      const parsed =
        JSON.parse(saved);


      if (
        parsed &&
        typeof parsed === "object"
      ) {

        progress = {

          name:
            parsed.name || "",

          solved:
            Object.fromEntries(
              Object.entries(parsed.solved || {})
                .map(([key, solved]) => [
                  migrateQuestionKey(key),
                  solved
                ])
                .filter(([key, solved]) => key && solved)
            )

        };

      }

    }

  }

  catch (error) {

    console.error(
      "Progress loading failed:",
      error
    );

    progress = {
      name: "",
      solved: {}
    };

  }

}


function saveProgress() {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(progress)
    );

  }

  catch (error) {

    console.error(
      "Progress saving failed:",
      error
    );

  }

}


/* =========================================================
   QUESTION KEY
   ========================================================= */

function getQuestionKey(
  levelIndex,
  questionIndex
) {

  return `v3-${levelIndex}-${questionIndex}`;

}


function migrateQuestionKey(questionKey) {

  const key =
    String(questionKey);

  if (key.startsWith("v3-")) {
    return key;
  }

  const previousKey =
    /^v2-(\d+)-([0-2])$/.exec(key);

  if (!previousKey) {
    return null;
  }

  const levelIndex =
    Number(previousKey[1]);

  const difficultyIndex =
    Number(previousKey[2]);

  if (
    !levels[levelIndex] ||
    !levels[levelIndex].questions[difficultyIndex * 3]
  ) {
    return null;
  }

  return `v3-${levelIndex}-${difficultyIndex * 3}`;

}


/* =========================================================
   CHECK WHETHER QUESTION IS SOLVED
   ========================================================= */

function isQuestionSolved(
  levelIndex,
  questionIndex
) {

  return Boolean(
    progress.solved[
      getQuestionKey(
        levelIndex,
        questionIndex
      )
    ]
  );

}


/* =========================================================
   MARK QUESTION AS SOLVED
   ========================================================= */

function markQuestionSolved() {

  const key =
    getQuestionKey(
      currentLevel,
      currentQuestion
    );

  progress.solved[key] = true;


  saveProgress();

  pushProgressToCloud(key);


  renderLevelNav();
  updateProgressUI();
  updateNavigationButtons();
  updateQuestionButtons();

}


/* =========================================================
   INIT APPLICATION
   ========================================================= */

async function init() {

  loadProgress();

  await initDatabase();

  renderLevelNav();

  renderQuestion();

  renderProgressCards();

  updateProgressUI();

  renderSchema();


  const studentName =
    $("studentName");


  if (
    studentName &&
    progress.name
  ) {

    studentName.value =
      progress.name;

  }


  const landingName =
    $("landingStudentName");


  if (
    landingName &&
    progress.name
  ) {

    landingName.value =
      progress.name;

  }

}


/* =========================================================
   RENDER LEVEL NAVIGATION
   ========================================================= */

function renderLevelNav() {

  const container =
    $("levelNav");


  if (!container) {
    return;
  }


  container.innerHTML = "";


  getLevelDisplayOrder().forEach(
    (
      { level, index }
    ) => {

      const button =
        document.createElement(
          "button"
        );


      button.className =
        "level-btn";


      if (
        index === currentLevel
      ) {

        button.classList.add(
          "active"
        );

      }


      const solvedCount =
        level.questions.filter(
          (
            _,
            questionIndex
          ) =>
            isQuestionSolved(
              index,
              questionIndex
            )
        ).length;


      if (
        solvedCount ===
        level.questions.length
      ) {

        button.classList.add(
          "completed"
        );

      }


      button.innerHTML = `
        <span class="level-number">
          ${level.id}
        </span>

        <span class="level-text">
          ${escapeHtml(level.title)}
        </span>

        <span class="level-progress">
          ${solvedCount}/${level.questions.length}
        </span>
      `;


      button.addEventListener(
        "click",
        () => {

          currentLevel =
            index;

          currentQuestion =
            0;

          renderLevelNav();

          renderQuestion();

        }
      );


      container.appendChild(
        button
      );

    }
  );

}


/* =========================================================
   RENDER QUESTION
   ========================================================= */

function renderQuestion() {

  const level =
    levels[currentLevel];


  if (!level) {
    return;
  }


  const question =
    level.questions[
      currentQuestion
    ];


  if (!question) {
    return;
  }


  const title =
    $("levelTitle");


  if (title) {

    title.textContent =
      level.title;

  }


  const topic =
    $("levelTopic");


  if (topic) {

    topic.textContent =
      level.topic;

  }


  const questionNumber =
    $("questionNumber");


  if (questionNumber) {

    questionNumber.textContent =
      `Question ${currentQuestion + 1} of ${level.questions.length}`;

  }


  const questionText =
    $("questionText");


  if (questionText) {

    questionText.textContent =
      question.question;

  }


  const difficulty =
    $("difficultyBadge");


  if (difficulty) {

    difficulty.textContent =
      question.difficulty;

    difficulty.className =
      "difficulty-badge " +
      question.difficulty
        .toLowerCase()
        .replace(
          /\s+/g,
          "-"
        );

  }


  const editor =
    $("sqlEditor");


  if (editor) {

    editor.value = "";

    editor.placeholder =
      "Write your SQL query here...";

  }


  const feedback =
    $("feedback");


  if (feedback) {

    feedback.innerHTML = "";

    feedback.className =
      "feedback";

  }


  const solution =
    $("solution");


  if (solution) {

    solution.classList.add(
      "hidden"
    );

    solution.innerHTML = "";

  }


  updateNavigationButtons();

  updateQuestionButtons();

}


/* =========================================================
   QUESTION NAVIGATION
   ========================================================= */

function updateNavigationButtons() {

  const level =
    levels[currentLevel];


  const prev =
    $("prevBtn");

  const next =
    $("nextBtn");


  if (prev) {

    prev.disabled =
      currentQuestion === 0;

  }


  if (next) {

    const solved =
      isQuestionSolved(
        currentLevel,
        currentQuestion
      );

    const canAdvance =
      solved &&
      currentQuestion <
        level.questions.length - 1;

    next.disabled =
      !canAdvance;

    next.classList.toggle(
      "next-ready",
      canAdvance
    );

  }

}


/* =========================================================
   QUESTION BUTTONS
   ========================================================= */

function updateQuestionButtons() {

  const container =
    $("questionNumbers");


  if (!container) {
    return;
  }


  const level =
    levels[currentLevel];


  container.innerHTML = "";


  level.questions.forEach(
    (
      _question,
      index
    ) => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "question-number";


      button.textContent =
        index + 1;


      if (
        index === currentQuestion
      ) {

        button.classList.add(
          "active"
        );

      }


      if (
        isQuestionSolved(
          currentLevel,
          index
        )
      ) {

        button.classList.add(
          "completed"
        );

      }


      button.addEventListener(
        "click",
        () => {

          currentQuestion =
            index;

          renderQuestion();

        }
      );


      container.appendChild(
        button
      );

    }
  );

}


/* =========================================================
   RUN SQL
   ========================================================= */

function runCurrent() {

  if (!db) {

    setFeedback(
      "SQL database is not ready yet.",
      "error"
    );

    return;

  }


  const editor =
    $("sqlEditor");


  const sql =
    editor?.value.trim();


  if (!sql) {

    setFeedback(
      "Please enter a SQL query.",
      "warning"
    );

    return;

  }


  try {

    const results =
      db.exec(sql);

    const question =
      levels[currentLevel]
        .questions[currentQuestion];

    const answerResults =
      question
        ? executeForComparison(question.answer)
        : null;

    const matchesExpectedAnswer =
      question &&
      hasExpectedSQLStructure(question.answer, sql) &&
      results.length > 0 &&
      compareResults(results[0], answerResults);

    if (!matchesExpectedAnswer) {

      if ($("queryResults")) {
        $("queryResults").innerHTML = "";
      }

      setFeedback(
        "This query does not correctly answer the current question. Check the required columns, conditions, and SQL clauses.",
        "error"
      );

      return;

    }


    displayResults(
      results[0]
    );

    markQuestionSolved();

    setFeedback(
      "Query executed successfully.",
      "success"
    );

  }

  catch (error) {

    console.error(
      "SQL error:",
      error
    );


    setFeedback(
      error.message ||
      "Invalid SQL query.",
      "error"
    );

  }

}


/* =========================================================
   DISPLAY QUERY RESULTS
   ========================================================= */

function displayResults(result) {

  const container =
    $("queryResults");


  if (!container) {
    return;
  }


  if (
    !result ||
    !result.columns
  ) {

    container.innerHTML = "";

    return;

  }


  let html =
    `<div class="result-table-wrapper">
       <table class="result-table">
         <thead>
           <tr>`;


  result.columns.forEach(
    column => {

      html +=
        `<th>${escapeHtml(column)}</th>`;

    }
  );


  html +=
    `</tr>
     </thead>
     <tbody>`;


  result.values.forEach(
    row => {

      html += "<tr>";


      row.forEach(
        value => {

          html +=
            `<td>${escapeHtml(
              value === null
                ? "NULL"
                : String(value)
            )}</td>`;

        }
      );


      html += "</tr>";

    }
  );


  html +=
    `</tbody>
     </table>
     </div>`;


  container.innerHTML =
    html;

}


/* =========================================================
   CHECK ANSWER
   ========================================================= */

function checkCurrent() {

  const editor =
    $("sqlEditor");


  const userSQL =
    editor?.value.trim();


  if (!userSQL) {

    setFeedback(
      "Please write a query before checking your answer.",
      "warning"
    );

    return;

  }


  const question =
    levels[currentLevel]
      .questions[currentQuestion];


  if (!question) {
    return;
  }


  const normalizedUser =
    normalizeSQL(
      userSQL
    );


  const normalizedAnswer =
    normalizeSQL(
      question.answer
    );


  const hasRequiredStructure =
    hasExpectedSQLStructure(
      question.answer,
      userSQL
    );


  /*
     First attempt:
     compare normalized SQL.

     Second attempt:
     execute both queries and compare
     their result sets.
  */

  let correct =
    normalizedUser ===
    normalizedAnswer;


  if (!correct && db) {

    try {

      const userResult =
        executeForComparison(
          userSQL
        );


      const answerResult =
        executeForComparison(
          question.answer
        );


      correct =
        compareResults(
          userResult,
          answerResult
        );

    }

    catch (error) {

      correct = false;

    }

  }


  if (!hasRequiredStructure) {
    correct = false;
  }


  if (correct) {

    markQuestionSolved();

    setFeedback(
      "Excellent! Your answer is correct.",
      "success"
    );


    launchMiniConfetti();

  }

  else {

    if (
      !hasRequiredStructure &&
      question.answer
    ) {

      setFeedback(
        "Your query returned a valid result, but it is missing a required SQL clause from the expected solution. Please follow the question requirement exactly.",
        "error"
      );

    }

    else {

      setFeedback(
        "Not quite. Check your SQL syntax and logic, then try again.",
        "error"
      );

    }

  }

}

/* =========================================================
   SQL NORMALIZATION
   ========================================================= */

function normalizeSQL(sql) {

  return String(sql)
    .trim()
    .replace(
      /;+\s*$/,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .toLowerCase();

}


function hasExpectedSQLStructure(expectedSQL, userSQL) {

  const expected =
    String(expectedSQL || "")
      .trim();


  const user =
    String(userSQL || "")
      .trim();


  if (!expected || !user) {
    return false;
  }


  const expectedLower =
    expected.toLowerCase();


  const userLower =
    user.toLowerCase();


  const requiredClauses = [
    "order by",
    "group by",
    "having",
    "distinct",
    "where",
    "left join",
    "right join",
    "inner join",
    "join",
    "limit",
    "offset",
    "case",
    "exists",
    "between",
    "like",
    "in "
  ];


  for (const clause of requiredClauses) {

    if (
      expectedLower.includes(clause) &&
      !userLower.includes(clause)
    ) {
      return false;
    }

  }


  return true;

}


/* =========================================================
   EXECUTE QUERY FOR ANSWER COMPARISON
   ========================================================= */

function executeForComparison(sql) {

  const results =
    db.exec(sql);


  if (!results.length) {

    return {
      columns: [],
      values: []
    };

  }


  return results[0];

}


/* =========================================================
   COMPARE SQL RESULTS
   ========================================================= */

function compareResults(
  a,
  b
) {

  if (
    !a ||
    !b
  ) {

    return false;

  }


  if (
    a.columns.length !==
    b.columns.length
  ) {

    return false;

  }


  if (
    a.values.length !==
    b.values.length
  ) {

    return false;

  }


  for (
    let i = 0;
    i < a.columns.length;
    i++
  ) {

    if (
      String(a.columns[i])
        .toLowerCase() !==
      String(b.columns[i])
        .toLowerCase()
    ) {

      return false;

    }

  }


  for (
    let i = 0;
    i < a.values.length;
    i++
  ) {

    for (
      let j = 0;
      j < a.values[i].length;
      j++
    ) {

      if (
        String(a.values[i][j]) !==
        String(b.values[i][j])
      ) {

        return false;

      }

    }

  }


  return true;

}


/* =========================================================
   FEEDBACK
   ========================================================= */

function setFeedback(
  message,
  type = "info"
) {

  const feedback =
    $("feedback");


  if (!feedback) {
    return;
  }


  feedback.className =
    `feedback ${type}`;


  feedback.textContent =
    message;

}


/* =========================================================
   HINT
   ========================================================= */

function showHint() {

  const question =
    levels[currentLevel]
      .questions[currentQuestion];


  if (!question) {
    return;
  }


  setFeedback(
    `Hint: ${question.hint}`,
    "info"
  );

}


/* =========================================================
   SOLUTION
   ========================================================= */

function showSolution() {

  const question =
    levels[currentLevel]
      .questions[currentQuestion];


  if (!question) {
    return;
  }


  const solution =
    $("solution");


  if (!solution) {
    return;
  }


  solution.innerHTML = `
    <div class="solution-header">
      <strong>Solution</strong>
    </div>

    <pre><code>${escapeHtml(
      question.answer
    )}</code></pre>
  `;


  solution.classList.remove(
    "hidden"
  );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   PROGRESS UI
   ========================================================= */

function updateProgressUI() {

  const total =
    getTotalQuestions();


  const solved =
    levels.reduce(
      (count, level, levelIndex) =>
        count +
        level.questions.filter(
          (_, questionIndex) =>
            isQuestionSolved(levelIndex, questionIndex)
        ).length,
      0
    );


  const percentage =
    total === 0
      ? 0
      : Math.round(
          solved / total * 100
        );


  if ($("progressPercent")) {

    $("progressPercent").textContent =
      `${percentage}%`;

  }


  if ($("progressCount")) {

    $("progressCount").textContent =
      `${solved} / ${total}`;

  }


  if ($("progressBar")) {

    $("progressBar").style.width =
      `${percentage}%`;

  }

  [
    "challengeCountLogin",
    "challengeCountLanding",
    "challengeCountBadge",
    "adminQuestionCount"
  ].forEach(id => {
    const element = $(id);

    if (element) {
      element.textContent = getTotalQuestions();
    }
  });


  const overall =
    $("overallProgress");


  if (overall) {

    overall.textContent =
      `${percentage}%`;

  }


  levels.forEach(
    (
      level,
      index
    ) => {

      const levelSolved =
        level.questions.filter(
          (
            _,
            qIndex
          ) =>
            isQuestionSolved(
              index,
              qIndex
            )
        ).length;


      const element =
        document.querySelector(
          `[data-progress-level="${index}"]`
        );


      if (element) {

        element.textContent =
          `${levelSolved}/${level.questions.length}`;

      }


      const card =
        document.querySelector(
          `[data-progress-card="${index}"]`
        );


      if (card) {

        const bar =
          card.querySelector(".pc-bar > div");

        const pct =
          level.questions.length === 0
            ? 0
            : Math.round(
                (levelSolved / level.questions.length) * 100
              );

        if (bar) {
          bar.style.width = `${pct}%`;
        }

      }

    }
  );


  const heroLevel =
    levels[currentLevel];


  if (heroLevel) {

    if ($("levelStat")) {

      $("levelStat").textContent =
        `Level ${heroLevel.id}`;

    }


    const heroSolved =
      heroLevel.questions.filter(
        (_, qIndex) =>
          isQuestionSolved(currentLevel, qIndex)
      ).length;


    if ($("levelProgress")) {

      $("levelProgress").textContent =
        `${heroSolved} / ${heroLevel.questions.length}`;

    }

  }


  if ($("profileName")) {

    $("profileName").textContent =
      progress.name || "SQL Student";

  }

}


/* =========================================================
   PROGRESS CARDS (per-level view)
   ========================================================= */

function renderProgressCards() {

  const container = $("progressCards");

  if (!container) {
    return;
  }

  container.innerHTML =
    getLevelDisplayOrder().map(
      ({ level, index }) => `
        <div class="progress-card" data-progress-card="${index}">
          <div class="pc-top">
            <span>${escapeHtml(level.title)}</span>
            <span data-progress-level="${index}">0/${level.questions.length}</span>
          </div>
          <div class="pc-bar"><div style="width:0%"></div></div>
          <p>${escapeHtml(level.topic || "")}</p>
        </div>
      `
    ).join("");

}


/* =========================================================
   SCHEMA RENDERING
   ========================================================= */

function renderSchema() {

  const container =
    $("schemaContainer");


  if (!container) {
    return;
  }


  container.innerHTML = "";


  Object.entries(schema)
    .forEach(
      (
        [tableName, info]
      ) => {

        const card =
          document.createElement(
            "section"
          );


        card.className =
          "schema-card";


        const rows =
          info.sampleData
            .slice(0, 5)
            .map(
              row => `
                <tr>
                  ${row.map(
                    value =>
                      `<td>${escapeHtml(
                        value
                      )}</td>`
                  ).join("")}
                </tr>
              `
            )
            .join("");


        card.innerHTML = `

          <div class="schema-card-header">

            <div>

              <span class="schema-label">
                TABLE
              </span>

              <h3>
                ${escapeHtml(tableName)}
              </h3>

            </div>

            <span class="schema-count">
              ${info.columns.length} columns
            </span>

          </div>


          <p class="schema-description">
            ${escapeHtml(
              info.description
            )}
          </p>


          <div class="schema-table-wrapper">

            <table class="schema-table">

              <thead>

                <tr>

                  <th>Column</th>
                  <th>Data Type</th>
                  <th>Key</th>
                  <th>Description</th>

                </tr>

              </thead>


              <tbody>

                ${info.columns.map(
                  column => `

                    <tr>

                      <td>
                        <strong>
                          ${escapeHtml(
                            column.name
                          )}
                        </strong>
                      </td>

                      <td>
                        ${escapeHtml(
                          column.type
                        )}
                      </td>

                      <td>
                        ${escapeHtml(
                          column.key
                        )}
                      </td>

                      <td>
                        ${escapeHtml(
                          column.description
                        )}
                      </td>

                    </tr>

                  `
                ).join("")}

              </tbody>

            </table>

          </div>


          <h4>
            Sample Data
          </h4>


          <div class="schema-table-wrapper">

            <table class="schema-table sample-data">

              <thead>

                <tr>

                  ${info.columns.map(
                    column =>
                      `<th>
                        ${escapeHtml(
                          column.name
                        )}
                       </th>`
                  ).join("")}

                </tr>

              </thead>


              <tbody>

                ${rows}

              </tbody>

            </table>

          </div>

        `;


        container.appendChild(
          card
        );

      }
    );

}


/* =========================================================
   MINI CONFETTI
   ========================================================= */

function launchMiniConfetti() {

  if (
    typeof confetti ===
    "function"
  ) {

    confetti({

      particleCount: 55,

      spread: 65,

      origin: {
        y: 0.7
      }

    });

  }

}


/* =========================================================
   MAIN SQL BUTTONS
   ========================================================= */

$("runBtn")?.addEventListener(
  "click",
  runCurrent
);


$("checkBtn")?.addEventListener(
  "click",
  checkCurrent
);


$("hintBtn")?.addEventListener(
  "click",
  showHint
);


$("solutionBtn")?.addEventListener(
  "click",
  showSolution
);


/* =========================================================
   CLEAR SQL
   ========================================================= */

$("clearBtn")?.addEventListener(
  "click",
  () => {

    if ($("sqlEditor")) {

      $("sqlEditor").value = "";

    }


    if ($("queryResults")) {

      $("queryResults").innerHTML =
        "";

    }


    if ($("feedback")) {

      $("feedback").textContent =
        "";

      $("feedback").className =
        "feedback";

    }

  }
);


/* =========================================================
   PREVIOUS QUESTION
   ========================================================= */

$("prevBtn")?.addEventListener(
  "click",
  () => {

    if (
      currentQuestion > 0
    ) {

      currentQuestion--;

      renderQuestion();

    }

  }
);


/* =========================================================
   NEXT QUESTION
   ========================================================= */

$("nextBtn")?.addEventListener(
  "click",
  () => {

    const level =
      levels[currentLevel];


    if (
      currentQuestion <
      level.questions.length - 1
    ) {

      currentQuestion++;

      renderQuestion();

    }

  }
);


/* =========================================================
   TABS
   ========================================================= */

document
  .querySelectorAll(".tab")
  .forEach(
    tab => {

      tab.addEventListener(
        "click",
        () => {

          const view =
            tab.dataset.view;

          if (view === "schema") {
            openSchemaInNewTab();
            return;
          }

          document
            .querySelectorAll(
              ".tab"
            )
            .forEach(
              t =>
                t.classList.remove(
                  "active"
                )
            );

          tab.classList.add(
            "active"
          );


          $("practiceView")
            ?.classList.toggle(
              "hidden",
              view !== "practice"
            );


          $("schemaView")
            ?.classList.toggle(
              "hidden",
              view !== "schema"
            );


          $("progressView")
            ?.classList.toggle(
              "hidden",
              view !== "progress"
            );


          if (
            view ===
            "progress"
          ) {

            updateProgressUI();

          }

        }
      );

    }
  );


/* =========================================================
   SCHEMA BUTTON
   ========================================================= */

$("schemaBtn")?.addEventListener(
  "click",
  openSchemaInNewTab
);

function openSchemaInNewTab() {

  window.open(
    new URL("schema.html", window.location.href).href,
    "_blank",
    "noopener"
  );

}


/* =========================================================
   ER DIAGRAM
   ========================================================= */

$("openSchemaImage")
  ?.addEventListener(
    "click",
    () => {

      const image =
        $("schemaImage");


      if (image) {

        image.classList.remove(
          "hidden"
        );

      }

      else {

        setFeedback(
          "ER diagram is not available.",
          "info"
        );

      }

    }
  );


/* =========================================================
   GUIDE MODAL
   ========================================================= */

function showGuide() {

  $("guideModal")
    ?.classList.remove(
      "hidden"
    );

}


function closeGuide() {

  $("guideModal")
    ?.classList.add(
      "hidden"
    );

}


$("readmeBtn")
  ?.addEventListener(
    "click",
    showGuide
  );


$("landingGuideBtn")
  ?.addEventListener(
    "click",
    showGuide
  );


$("closeGuideBtn")
  ?.addEventListener(
    "click",
    closeGuide
  );


$("guideModal")
  ?.addEventListener(
    "click",
    event => {

      if (
        event.target.id ===
        "guideModal"
      ) {

        closeGuide();

      }

    }
  );


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      closeGuide();

    }

  }
);


/* =========================================================
   RESET PROGRESS
   ========================================================= */

$("resetBtn")
  ?.addEventListener(
    "click",
    async () => {

      const confirmed =
        confirm(
          "Reset all saved progress and student name?"
        );


      if (!confirmed) {
        return;
      }

      try {

        if (currentUser) {
          const { error } =
            await supabaseClient
              .from(PROGRESS_TABLE)
              .delete()
              .eq("student_id", currentUser.id);

          if (error) {
            throw error;
          }
        }

      }

      catch (error) {

        console.error("Cloud progress reset failed:", error);
        setFeedback(
          "Could not reset saved progress. Check your connection and try again.",
          "error"
        );
        return;

      }

      progress = {

        name: "",

        solved: {}

      };


      saveProgress();


      if ($("studentName")) {

        $("studentName").value =
          "";

      }


      if ($("landingStudentName")) {

        $("landingStudentName").value =
          "";

      }


      renderLevelNav();

      renderQuestion();

      updateProgressUI();


      setFeedback(
        "Progress has been reset.",
        "info"
      );

    }
  );


/* =========================================================
   LANDING PAGE STUDENT NAME
   ========================================================= */

const landingNameInput =
  $("landingStudentName");


if (
  landingNameInput &&
  progress.name
) {

  landingNameInput.value =
    progress.name;

}


/* =========================================================
   START SQL JOURNEY
   ========================================================= */

$("startJourneyBtn")
  ?.addEventListener(
    "click",
    () => {

      const name =
        landingNameInput
          ?.value
          .trim() || "";


      if (name) {

        progress.name =
          name;

        saveProgress();

      }


      if ($("studentName")) {

        $("studentName").value =
          name;

      }


      $("landingPage")
        ?.classList.add(
          "hidden"
        );


      $("labApp")
        ?.classList.remove(
          "hidden"
        );


      window.scrollTo({

        top: 0,

        behavior: "smooth"

      });

    }
  );


/* =========================================================
   HOME BUTTON
   ========================================================= */

$("homeBtn")
  ?.addEventListener(
    "click",
    () => {

      if ($("landingStudentName")) {

        $("landingStudentName").value =
          progress.name || "";

      }


      $("labApp")
        ?.classList.add(
          "hidden"
        );


      $("landingPage")
        ?.classList.remove(
          "hidden"
        );


      window.scrollTo({

        top: 0,

        behavior: "smooth"

      });

    }
  );


/* =========================================================
   GLOBAL LOGOUT BUTTONS
   ========================================================= */

document
  .querySelectorAll(
    "[data-action='logout']"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        signOutUser
      );

    }
  );


/* =========================================================
   SQL EDITOR KEYBOARD SHORTCUT
   Ctrl + Enter = Run Query
   ========================================================= */

$("sqlEditor")
  ?.addEventListener(
    "keydown",
    event => {

      if (
        event.ctrlKey &&
        event.key === "Enter"
      ) {

        event.preventDefault();

        runCurrent();

      }

    }
  );


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await init();

    await restoreSession();

  }
);