/**
 * ═══════════════════════════════════════════════════════════
 * PSB Digital Banking — Complete Application Controller
 * Punjab & Sind Bank — Javascript Logic for 19 SPA Screens
 * ═══════════════════════════════════════════════════════════
 */

// Application State
const appState = {
  currentLanguage: 'en',
  registrationMethod: 'atm', // 'atm' or 'account'
  selectedSim: '',
  consentAgreed: false,
  accountNumber: '',
  dob: '',
  transactionRights: 'full', // 'view', 'limited', 'full'
  username: '',
  password: '',
  mpin: '',
  confirmMpin: '',
  debitCardLast6: '',
  debitCardExpiry: '',
  otpInput: '',
  upiPin: '',
  panNumber: '',
  kycMethod: 'aadhaar',
  biometricsEnabled: false,
  loginMethod: 'mpin', // 'credentials', 'otp', 'mpin', 'biometrics'
  isBalanceVisible: false,
  screenHistory: []
};

// Mock Customer Data
const mockCustomer = {
  name: "Rahul Kumar Singh",
  cif: "904827156",
  branch: "PARLIAMENT STREET BRANCH, NEW DELHI",
  accounts: [
    { type: "Savings Account", number: "10398271822", balance: "45,280.50" },
    { type: "Fixed Deposit", number: "30827182711", balance: "2,00,000.00" }
  ],
  transactions: [
    { type: "UPI Transfer", desc: "Sent to Vivek Dev", date: "02 Jun 2026", amount: "-1,200.00", isDebit: true },
    { type: "Salary Credit", desc: "Govt of India", date: "31 May 2026", amount: "+85,450.00", isDebit: false },
    { type: "Bill Payment", desc: "BSNL Broadband", date: "28 May 2026", amount: "-999.00", isDebit: true },
    { type: "ATM Cash", desc: "PSB ATM Connaught Pl", date: "25 May 2026", amount: "-5,000.00", isDebit: true }
  ]
};

// Document Loaded Handler
document.addEventListener("DOMContentLoaded", () => {
  initRouter();
  initLanguages();
  initRegistrationMethods();
  initSimSelection();
  initConsent();
  initAccountVerification();
  initTransactionRights();
  initCredentialsForm();
  initKeypad();
  initUpiCardVerification();
  initPanVerification();
  initKycSelection();
  initBiometrics();
  initLoginFlow();
  initForgotPassword();
  initDashboard();
  
  // Custom dialogs & UI enhancements
  setupGeneralUI();
});

/* ==========================================================================
   1. ROUTER & NAVIGATION SYSTEM
   ========================================================================== */

function initRouter() {
  // Navigation elements
  document.querySelectorAll("[data-nav-to]").forEach(button => {
    button.addEventListener("click", (e) => {
      const targetScreen = button.getAttribute("data-nav-to");
      navigateTo(targetScreen);
    });
  });

  document.querySelectorAll("[data-nav-back]").forEach(button => {
    button.addEventListener("click", () => {
      navigateBack();
    });
  });
}

function navigateTo(screenId) {
  const currentScreen = document.querySelector(".screen.active");
  if (currentScreen) {
    appState.screenHistory.push(currentScreen.id);
    currentScreen.classList.remove("active");
  }

  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add("active");
    window.scrollTo(0, 0);
    
    // Screen specific hooks
    onScreenEnter(screenId);
  } else {
    console.error(`Screen #${screenId} not found!`);
  }
}

function navigateBack() {
  if (appState.screenHistory.length > 0) {
    const prevScreenId = appState.screenHistory.pop();
    const currentScreen = document.querySelector(".screen.active");
    if (currentScreen) currentScreen.classList.remove("active");
    
    const prevScreen = document.getElementById(prevScreenId);
    if (prevScreen) {
      prevScreen.classList.add("active");
      onScreenEnter(prevScreenId);
    }
  }
}

function resetHistory() {
  appState.screenHistory = [];
}

// Triggered when entering a screen
function onScreenEnter(screenId) {
  // Update progress bars dynamically
  const progressBars = {
    'screen-3': 10,  'screen-4': 20,  'screen-5': 30,  'screen-6': 40,
    'screen-7': 45,  'screen-8': 50,  'screen-9': 60,  'screen-10': 70,
    'screen-11': 80, 'screen-12': 85, 'screen-13': 90, 'screen-14': 95,
    'screen-15': 100
  };

  const progress = progressBars[screenId];
  if (progress !== undefined) {
    document.querySelectorAll(".progress-fill").forEach(fill => {
      fill.style.width = `${progress}%`;
    });
    document.querySelectorAll(".progress-text").forEach(txt => {
      txt.textContent = `Registration Progress: ${progress}%`;
    });
  }

  // Auto focus / start timers/ resets
  switch (screenId) {
    case 'screen-6':
      document.getElementById("acc-num").focus();
      break;
    case 'screen-10':
      resetMpinKeypad();
      break;
    case 'screen-11':
      startOtpTimer("otp-timer-11", "resend-btn-11");
      break;
    case 'screen-17':
      startOtpTimer("otp-timer-17", "resend-btn-17");
      break;
    case 'screen-19':
      resetHistory();
      renderDashboard();
      break;
  }
}

/* ==========================================================================
   2. SCREEN 1: LANGUAGE SELECTION
   ========================================================================== */

function initLanguages() {
  const cards = document.querySelectorAll(".lang-card");
  const continueBtn = document.getElementById("lang-continue");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      cards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      appState.currentLanguage = card.getAttribute("data-lang");
      continueBtn.disabled = false;
    });
  });

  continueBtn.addEventListener("click", () => {
    navigateTo("screen-3");
  });
}

/* ==========================================================================
   3. SCREEN 3: REGISTRATION METHOD
   ========================================================================== */

function initRegistrationMethods() {
  const cards = document.querySelectorAll(".method-option-card");
  const continueBtn = document.getElementById("method-continue");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      cards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      appState.registrationMethod = card.getAttribute("data-method");
      continueBtn.disabled = false;
    });
  });

  continueBtn.addEventListener("click", () => {
    navigateTo("screen-4");
  });
}

/* ==========================================================================
   4. SCREEN 4: SIM SELECTION
   ========================================================================== */

function initSimSelection() {
  const cards = document.querySelectorAll(".sim-card");
  const continueBtn = document.getElementById("sim-continue");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      cards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      appState.selectedSim = card.getAttribute("data-sim");
      continueBtn.disabled = false;
    });
  });

  continueBtn.addEventListener("click", () => {
    // Show a quick loader simulating network/SIM verification
    showLoader("Verifying SIM card with bank database...", () => {
      navigateTo("screen-5");
    });
  });
}

/* ==========================================================================
   5. SCREEN 5: CONSENT SCREEN
   ========================================================================== */

function initConsent() {
  const checkboxRow = document.getElementById("consent-checkbox-row");
  const continueBtn = document.getElementById("consent-continue");

  checkboxRow.addEventListener("click", () => {
    checkboxRow.classList.toggle("checked");
    const isChecked = checkboxRow.classList.contains("checked");
    appState.consentAgreed = isChecked;
    continueBtn.disabled = !isChecked;
  });

  continueBtn.addEventListener("click", () => {
    navigateTo("screen-6");
  });
}

/* ==========================================================================
   6. SCREEN 6 & 7: ACCOUNT VERIFICATION & DETAILS REVIEW
   ========================================================================== */

function initAccountVerification() {
  const accNumInput = document.getElementById("acc-num");
  const dobInput = document.getElementById("dob");
  const verifyBtn = document.getElementById("acc-verify-btn");

  const checkValidation = () => {
    const accNum = accNumInput.value.trim();
    const dob = dobInput.value;
    verifyBtn.disabled = !(accNum.length >= 9 && accNum.length <= 16 && dob !== "");
  };

  accNumInput.addEventListener("input", checkValidation);
  dobInput.addEventListener("change", checkValidation);

  // Toggle Visibility of Account Number
  const toggleBtn = document.getElementById("toggle-acc-vis");
  toggleBtn.addEventListener("click", () => {
    if (accNumInput.type === "password") {
      accNumInput.type = "text";
      toggleBtn.innerHTML = "👁️";
    } else {
      accNumInput.type = "password";
      toggleBtn.innerHTML = "🔒";
    }
  });

  verifyBtn.addEventListener("click", () => {
    appState.accountNumber = accNumInput.value.trim();
    appState.dob = dobInput.value;

    showLoader("Verifying Account Details...", () => {
      // Transition to Screen 7 (Customer Info Review)
      document.getElementById("review-cust-name").textContent = mockCustomer.name;
      document.getElementById("review-cif").textContent = mockCustomer.cif;
      document.getElementById("review-branch").textContent = mockCustomer.branch;
      navigateTo("screen-7");
    });
  });
}

/* ==========================================================================
   7. SCREEN 8: TRANSACTION RIGHTS
   ========================================================================== */

function initTransactionRights() {
  const cards = document.querySelectorAll(".rights-option-card");
  const continueBtn = document.getElementById("rights-continue");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      cards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      appState.transactionRights = card.getAttribute("data-rights");
      continueBtn.disabled = false;
    });
  });

  continueBtn.addEventListener("click", () => {
    navigateTo("screen-9");
  });
}

/* ==========================================================================
   8. SCREEN 9: CREATE CREDENTIALS
   ========================================================================== */

function initCredentialsForm() {
  const usernameInput = document.getElementById("reg-username");
  const passwordInput = document.getElementById("reg-password");
  const confirmPwdInput = document.getElementById("reg-confirm-password");
  const checkBtn = document.getElementById("check-username-btn");
  const usernameFeedback = document.getElementById("username-feedback");
  const continueBtn = document.getElementById("creds-continue");

  let isUsernameChecked = false;

  // Check username availability
  checkBtn.addEventListener("click", () => {
    const val = usernameInput.value.trim();
    if (val.length < 5) {
      usernameFeedback.textContent = "Username must be at least 5 characters.";
      usernameFeedback.className = "form-error";
      isUsernameChecked = false;
      return;
    }

    showLoader("Checking availability...", () => {
      usernameFeedback.textContent = "Username is available!";
      usernameFeedback.className = "form-hint text-success";
      isUsernameChecked = true;
      validateForm();
    });
  });

  usernameInput.addEventListener("input", () => {
    isUsernameChecked = false;
    usernameFeedback.textContent = "Check availability before continuing.";
    usernameFeedback.className = "form-hint";
    validateForm();
  });

  // Password validators
  passwordInput.addEventListener("input", () => {
    const pwd = passwordInput.value;
    
    // Test rules
    const hasMin = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    updateRuleState("rule-len", hasMin);
    updateRuleState("rule-upper", hasUpper);
    updateRuleState("rule-lower", hasLower);
    updateRuleState("rule-num", hasNum);
    updateRuleState("rule-spec", hasSpecial);

    // Calculate strength
    let score = 0;
    if (hasMin) score++;
    if (hasUpper && hasLower) score++;
    if (hasNum) score++;
    if (hasSpecial) score++;

    updateStrengthMeter(score);
    validateForm();
  });

  confirmPwdInput.addEventListener("input", validateForm);

  function updateRuleState(ruleId, isMet) {
    const element = document.getElementById(ruleId);
    if (isMet) {
      element.classList.add("met");
      element.querySelector(".pwd-rule-icon").textContent = "✓";
    } else {
      element.classList.remove("met");
      element.querySelector(".pwd-rule-icon").textContent = "•";
    }
  }

  function updateStrengthMeter(score) {
    const segments = document.querySelectorAll(".strength-segment");
    const label = document.getElementById("strength-label");
    
    segments.forEach(seg => {
      seg.className = "strength-segment";
    });

    if (score === 0) {
      label.textContent = "Too Weak";
      label.style.color = "var(--error)";
    } else if (score === 1 || score === 2) {
      label.textContent = "Weak";
      label.style.color = "var(--error)";
      segments[0].classList.add("active-weak");
    } else if (score === 3) {
      label.textContent = "Good";
      label.style.color = "var(--primary-yellow)";
      segments[0].classList.add("active-good");
      segments[1].classList.add("active-good");
      segments[2].classList.add("active-good");
    } else if (score === 4) {
      label.textContent = "Strong";
      label.style.color = "var(--success)";
      segments.forEach(seg => seg.classList.add("active-strong"));
    }
  }

  function validateForm() {
    const pwd = passwordInput.value;
    const cpwd = confirmPwdInput.value;
    
    const isPwdValid = pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    const doesMatch = pwd === cpwd && pwd !== "";
    
    continueBtn.disabled = !(isUsernameChecked && isPwdValid && doesMatch);
  }

  continueBtn.addEventListener("click", () => {
    appState.username = usernameInput.value.trim();
    appState.password = passwordInput.value;
    navigateTo("screen-10");
  });
}

/* ==========================================================================
   9. CUSTOM NUMERIC KEYPAD (Screen 10 & 16)
   ========================================================================== */

let currentPinInput = [];
let pinStep = 1; // 1 = Enter MPIN, 2 = Confirm MPIN

function initKeypad() {
  document.querySelectorAll(".keypad-key").forEach(key => {
    key.addEventListener("click", () => {
      const val = key.getAttribute("data-val");
      
      // Determine which flow has focus
      const activeScreen = document.querySelector(".screen.active").id;
      if (activeScreen === "screen-10") {
        handleMpinKeypad(val);
      } else if (activeScreen === "screen-16") {
        handleLoginMpinKeypad(val);
      }
    });
  });
}

function handleMpinKeypad(val) {
  const pinTitle = document.getElementById("mpin-title");
  const continueBtn = document.getElementById("mpin-continue");

  if (val === "backspace") {
    currentPinInput.pop();
  } else if (val && currentPinInput.length < 4) {
    currentPinInput.push(val);
  }

  updatePinDots("mpin-dots", currentPinInput.length);

  if (currentPinInput.length === 4) {
    if (pinStep === 1) {
      // Temp save and switch to confirmation
      appState.mpin = currentPinInput.join("");
      setTimeout(() => {
        pinStep = 2;
        currentPinInput = [];
        pinTitle.textContent = "Confirm Your 4-Digit MPIN";
        updatePinDots("mpin-dots", 0);
      }, 3000);
    } else if (pinStep === 2) {
      appState.confirmMpin = currentPinInput.join("");
      if (appState.mpin === appState.confirmMpin) {
        continueBtn.disabled = false;
      } else {
        alert("MPIN elements do not match! Please try again.");
        resetMpinKeypad();
      }
    }
  } else {
    continueBtn.disabled = true;
  }
}

function resetMpinKeypad() {
  currentPinInput = [];
  pinStep = 1;
  const pinTitle = document.getElementById("mpin-title");
  if (pinTitle) pinTitle.textContent = "Enter a 4-Digit MPIN";
  const continueBtn = document.getElementById("mpin-continue");
  if (continueBtn) continueBtn.disabled = true;
  updatePinDots("mpin-dots", 0);
}

function updatePinDots(containerId, count) {
  const dots = document.querySelectorAll(`#${containerId} .pin-dot`);
  dots.forEach((dot, idx) => {
    if (idx < count) {
      dot.classList.add("filled");
    } else {
      dot.classList.remove("filled");
    }
  });
}

/* ==========================================================================
   10. SCREEN 11: UPI & DEBIT CARD VERIFICATION
   ========================================================================== */

function initUpiCardVerification() {
  const cardInput = document.getElementById("debit-card-last6");
  const expiryInput = document.getElementById("debit-expiry");
  const verifyBtn = document.getElementById("card-verify-btn");
  const continueBtn = document.getElementById("upi-continue");

  const checkCardForm = () => {
    verifyBtn.disabled = !(cardInput.value.length === 6 && expiryInput.value.length === 5);
  };

  cardInput.addEventListener("input", (e) => {
    // Only numbers
    cardInput.value = cardInput.value.replace(/[^0-9]/g, '');
    checkCardForm();
  });

  expiryInput.addEventListener("input", (e) => {
    // Formatting MM/YY
    let val = expiryInput.value.replace(/[^0-9]/g, '');
    if (val.length > 2) {
      val = val.substring(0,2) + "/" + val.substring(2,4);
    }
    expiryInput.value = val;
    checkCardForm();
  });

  // Verify debit card & trigger OTP flow
  verifyBtn.addEventListener("click", () => {
    showLoader("Verifying card with bank networks...", () => {
      // Hide card input, show OTP panel
      document.getElementById("card-inputs-panel").classList.add("hidden");
      document.getElementById("otp-verification-panel").classList.remove("hidden");
      // Focus on first OTP block
      document.querySelector(".otp-box").focus();
      setupOtpInputHandler();
    });
  });

  // Continue to UPI Pin setup
  continueBtn.addEventListener("click", () => {
    showLoader("Setting up secure UPI profile...", () => {
      navigateTo("screen-12");
    });
  });
}

function setupOtpInputHandler() {
  const boxes = document.querySelectorAll(".otp-box");
  const continueBtn = document.getElementById("upi-continue");

  boxes.forEach((box, index) => {
    box.addEventListener("keyup", (e) => {
      if (e.key >= 0 && e.key <= 9) {
        if (index < boxes.length - 1) {
          boxes[index + 1].focus();
        }
      } else if (e.key === "Backspace") {
        if (index > 0) {
          boxes[index - 1].focus();
        }
      }

      // Check if all filled
      const enteredOtp = Array.from(boxes).map(b => b.value).join("");
      continueBtn.disabled = (enteredOtp.length !== 6);
    });
  });
}

// Timer Controller
let otpTimerInterval;
function startOtpTimer(timerId, resendBtnId) {
  const timerLabel = document.getElementById(timerId);
  const resendBtn = document.getElementById(resendBtnId);
  let timeLeft = 60;

  if (resendBtn) {
    resendBtn.style.display = "none";
  }

  clearInterval(otpTimerInterval);
  otpTimerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(otpTimerInterval);
      timerLabel.innerHTML = "Didn't receive the OTP? ";
      if (resendBtn) {
        resendBtn.style.display = "inline";
      }
    } else {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerLabel.innerHTML = `Resend OTP in <span>${minutes}:${seconds.toString().padStart(2, '0')}</span>`;
    }
  }, 1000);
}

/* ==========================================================================
   11. SCREEN 12: PAN VERIFICATION
   ========================================================================== */

function initPanVerification() {
  const panInput = document.getElementById("pan-number");
  const verifyBtn = document.getElementById("pan-verify-btn");

  panInput.addEventListener("input", () => {
    panInput.value = panInput.value.toUpperCase();
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    verifyBtn.disabled = !panPattern.test(panInput.value);
  });

  verifyBtn.addEventListener("click", () => {
    appState.panNumber = panInput.value;
    showLoader("Verifying PAN details with NSDL database...", () => {
      navigateTo("screen-13");
    });
  });
}

/* ==========================================================================
   12. SCREEN 13: KYC METHOD
   ========================================================================== */

function initKycSelection() {
  const cards = document.querySelectorAll(".kyc-option-card");
  const continueBtn = document.getElementById("kyc-continue");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      cards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      appState.kycMethod = card.getAttribute("data-method");
      continueBtn.disabled = false;
    });
  });

  continueBtn.addEventListener("click", () => {
    showLoader("Initiating KYC processing...", () => {
      navigateTo("screen-14");
    });
  });
}

/* ==========================================================================
   13. SCREEN 14: BIOMETRIC SETUP
   ========================================================================== */

function initBiometrics() {
  const enableBtn = document.getElementById("bio-enable");
  const skipBtn = document.getElementById("bio-skip");

  enableBtn.addEventListener("click", () => {
    // Show Fingerprint Modal overlay
    showBiometricModal((success) => {
      if (success) {
        appState.biometricsEnabled = true;
        navigateTo("screen-15");
      }
    }, true);
  });

  skipBtn.addEventListener("click", () => {
    appState.biometricsEnabled = false;
    navigateTo("screen-15");
  });
}

// Request real native browser platform credentials (Touch ID, Face ID, Windows Hello, PIN, Pattern, etc.)
async function requestNativeDeviceAuth(isCreation = true) {
  if (window.PublicKeyCredential) {
    try {
      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (isAvailable) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        if (isCreation) {
          const options = {
            challenge: challenge,
            rp: {
              name: "PSB Digital Bank",
              id: window.location.hostname || "localhost"
            },
            user: {
              id: Uint8Array.from("USER_ID_RAHUL", c => c.charCodeAt(0)),
              name: "rahul.singh@psb",
              displayName: "Rahul Kumar Singh"
            },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256
            authenticatorSelection: {
              authenticatorAttachment: "platform", // triggers native Touch ID, Face ID, PIN, pattern, Windows Hello
              userVerification: "required",
              residentKey: "discouraged"
            },
            timeout: 60000,
            attestation: "none"
          };
          const credential = await navigator.credentials.create({ publicKey: options });
          return credential ? { success: true } : { success: false, error: "EmptyCredential" };
        } else {
          const options = {
            challenge: challenge,
            rpId: window.location.hostname || "localhost",
            userVerification: "required",
            timeout: 60000
          };
          const assertion = await navigator.credentials.get({ publicKey: options });
          return assertion ? { success: true } : { success: false, error: "EmptyAssertion" };
        }
      }
    } catch (err) {
      console.warn("Native device lock authentication failed or cancelled:", err);
      return { success: false, error: err.name, message: err.message };
    }
  }
  return { success: false, error: "NotSupported" };
}

async function showBiometricModal(callback, isCreation = true) {
  // Directly trigger real native browser platform credentials (Touch ID, Face ID, PIN, pattern, etc.)
  const result = await requestNativeDeviceAuth(isCreation);
  
  if (result.success) {
    // Succeeded natively using Fingerprint, Face ID, or PIN
    callback(true);
    return;
  }

  // Fall back to simulator if native not allowed, or hardware/HTTPS not available
  console.log("Fallback to biometric simulator modal. Reason:", result.error);
  
  const modal = document.getElementById("biometric-modal-overlay");
  const modalSubtitle = modal.querySelector(".section-subtitle");
  
  if (result.error === "NotSupported") {
    modalSubtitle.innerHTML = "Local platform authenticator not supported in this browser. Please tap the sensor below to simulate verification.";
  } else if (result.error === "NotAllowedError") {
    modalSubtitle.innerHTML = "Native verification was cancelled. Click retry or tap the sensor below to verify manually.";
  } else {
    modalSubtitle.innerHTML = "Please place your registered finger on the fingerprint sensor below to continue.";
  }

  modal.classList.add("active");

  const handler = () => {
    modal.classList.remove("active");
    callback(true);
  };

  const fpSensor = modal.querySelector(".fingerprint-anim");
  fpSensor.addEventListener("click", handler, { once: true });

  const cancelBtn = document.getElementById("bio-cancel-btn");
  cancelBtn.addEventListener("click", () => {
    modal.classList.remove("active");
    fpSensor.removeEventListener("click", handler);
    callback(false);
  }, { once: true });
}

/* ==========================================================================
   14. SCREEN 16: LOGIN FLOW
   ========================================================================== */

let currentLoginPin = [];

function initLoginFlow() {
  // Tabs setup (Login via Password vs Quick Login via MPIN/Bio)
  const tabs = document.querySelectorAll(".login-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const type = tab.getAttribute("data-tab");
      if (type === "credentials") {
        document.getElementById("login-creds-panel").classList.remove("hidden");
        document.getElementById("login-quick-panel").classList.add("hidden");
      } else {
        document.getElementById("login-creds-panel").classList.add("hidden");
        document.getElementById("login-quick-panel").classList.remove("hidden");
      }
    });
  });

  // Traditional Username/Password Login submit
  const loginSubmit = document.getElementById("login-submit-btn");
  const userIn = document.getElementById("login-username");
  const passIn = document.getElementById("login-password");
  
  const checkLoginCreds = () => {
    loginSubmit.disabled = !(userIn.value.trim().length >= 4 && passIn.value.length >= 6);
  };
  userIn.addEventListener("input", checkLoginCreds);
  passIn.addEventListener("input", checkLoginCreds);

  loginSubmit.addEventListener("click", () => {
    showLoader("Authenticating credentials...", () => {
      // Successful Login
      navigateTo("screen-19");
    });
  });

  // Quick Login Methods
  const quickCards = document.querySelectorAll(".login-method-card");
  quickCards.forEach(card => {
    card.addEventListener("click", () => {
      const method = card.getAttribute("data-login-method");
      handleQuickLoginSelect(method);
    });
  });
}

function handleQuickLoginSelect(method) {
  if (method === "mpin") {
    // Show MPIN keypad panel
    document.getElementById("login-quick-methods").classList.add("hidden");
    document.getElementById("login-mpin-panel").classList.remove("hidden");
    currentLoginPin = [];
    updatePinDots("login-mpin-dots", 0);
  } else if (method === "biometrics") {
    // Open biometric overlay
    showBiometricModal((success) => {
      if (success) {
        showLoader("Verifying Biometrics...", () => {
          navigateTo("screen-19");
        });
      }
    }, false);
  } else if (method === "otp") {
    // Navigate or display input fields for mobile login
    alert("Simulating Mobile + OTP login: In a real environment this triggers SMS. Click OK to autofill credentials.");
    navigateTo("screen-19");
  }
}

function handleLoginMpinKeypad(val) {
  if (val === "backspace") {
    currentLoginPin.pop();
  } else if (val && currentLoginPin.length < 4) {
    currentLoginPin.push(val);
  }

  updatePinDots("login-mpin-dots", currentLoginPin.length);

  if (currentLoginPin.length === 4) {
    const entered = currentLoginPin.join("");
    // Simulate login verification
    showLoader("Authorizing MPIN access...", () => {
      navigateTo("screen-19");
    });
  }
}

// Reset Login quick panel back to method choices
window.cancelLoginMpin = function() {
  document.getElementById("login-mpin-panel").classList.add("hidden");
  document.getElementById("login-quick-methods").classList.remove("hidden");
};

/* ==========================================================================
   15. SCREEN 17: FORGOT PASSWORD FLOW
   ========================================================================== */

function initForgotPassword() {
  const mobInput = document.getElementById("forgot-mobile");
  const otpBtn = document.getElementById("forgot-otp-btn");
  const otpPanel = document.getElementById("forgot-otp-panel");
  const resetBtn = document.getElementById("forgot-reset-btn");
  
  mobInput.addEventListener("input", () => {
    otpBtn.disabled = !(mobInput.value.replace(/[^0-9]/g, '').length === 10);
  });

  otpBtn.addEventListener("click", () => {
    showLoader("Sending One-Time Password...", () => {
      otpPanel.classList.remove("hidden");
      otpBtn.classList.add("hidden");
      startOtpTimer("otp-timer-17", "resend-btn-17");
    });
  });

  resetBtn.addEventListener("click", () => {
    showLoader("Updating secure credentials...", () => {
      alert("Password has been reset successfully! Please log in.");
      navigateTo("screen-16");
    });
  });
}

/* ==========================================================================
   16. SCREEN 19: DASHBOARD SYSTEM
   ========================================================================== */

function initDashboard() {
  const balanceEye = document.getElementById("toggle-balance");
  balanceEye.addEventListener("click", () => {
    appState.isBalanceVisible = !appState.isBalanceVisible;
    renderBalance();
  });

  // Quick Action triggers
  document.querySelectorAll(".quick-action").forEach(act => {
    act.addEventListener("click", () => {
      const label = act.querySelector(".quick-action-label").textContent;
      alert(`Feature "${label}" details would load here.`);
    });
  });

  // Bottom Navigation highlights
  const navItems = document.querySelectorAll(".bottom-nav .nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
    });
  });
}

function renderDashboard() {
  document.getElementById("dash-username").textContent = mockCustomer.name.split(" ")[0].toUpperCase();
  
  // Render Account balance
  renderBalance();

  // Render recent transactions list
  const container = document.getElementById("tx-list-container");
  container.innerHTML = ""; // Clear
  
  mockCustomer.transactions.forEach(tx => {
    const item = document.createElement("div");
    item.className = "txn-item";
    
    const iconClass = tx.isDebit ? "debit" : "credit";
    const symbol = tx.isDebit ? "₹" : "₹";
    const txClass = tx.isDebit ? "debit" : "credit";
    
    item.innerHTML = `
      <div class="txn-icon" style="background: ${tx.isDebit ? '#FFEBEE' : '#E8F5E9'}; color: ${tx.isDebit ? '#E53935' : '#43A047'}">
        ${tx.isDebit ? '↙️' : '↗️'}
      </div>
      <div class="txn-info">
        <div class="txn-title">${tx.type} — ${tx.desc}</div>
        <div class="txn-date">${tx.date}</div>
      </div>
      <div class="txn-amount ${txClass}">${tx.amount}</div>
    `;
    container.appendChild(item);
  });
}

function renderBalance() {
  const balText = document.getElementById("account-balance");
  const eyeIcon = document.getElementById("toggle-balance");
  
  if (appState.isBalanceVisible) {
    balText.textContent = `₹${mockCustomer.accounts[0].balance}`;
    eyeIcon.innerHTML = "👁️";
  } else {
    balText.textContent = "₹ ••••••••";
    eyeIcon.innerHTML = "🔒";
  }
}

/* ==========================================================================
   17. UTILITY & GENERAL UI ENHANCEMENTS
   ========================================================================== */

function showLoader(message, callback) {
  // Dynamic screen loader implementation
  const loader = document.getElementById("loading-overlay");
  if (loader) {
    loader.querySelector(".loader-text").textContent = message || "Processing request...";
    loader.classList.add("active");
    
    setTimeout(() => {
      loader.classList.remove("active");
      if (callback) callback();
    }, 2000); // 2 second delay to let animations flow nicely
  } else {
    if (callback) callback();
  }
}

function setupGeneralUI() {
  // Input fields eye icon toggle
  document.querySelectorAll(".pwd-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.previousElementSibling;
      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "👁️";
      } else {
        input.type = "password";
        btn.textContent = "🔒";
      }
    });
  });
}
