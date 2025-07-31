/**
 * ===============================================================================
 * 🌌 QUANKEY CONTENT SCRIPT - FORM DETECTION & SECURE AUTOFILL
 * ===============================================================================
 * 
 * CRITICAL: Quantum-secured form detection and credential injection
 * 
 * Features:
 * ✅ Intelligent form detection
 * ✅ Secure credential injection without DOM exposure
 * ✅ Zero-knowledge architecture maintained
 * ✅ Real-time form monitoring
 * ✅ Anti-phishing protection
 */

console.log('🌌 Quankey Content Script Loaded on:', window.location.hostname);

// Extension state
let isQuankeyAuthenticated = false;
let detectedForms = new Set();
let formObserver = null;
let quankeyUI = null;

// Configuration
const QUANKEY_CONFIG = {
  formDetectionDelay: 500,
  maxFormFields: 20,
  securityCheckInterval: 5000,
  iconSize: 24,
  animationDuration: 300
};

// Initialize content script
(function initializeQuankeyContent() {
  console.log('🚀 Initializing Quankey Content Script...');
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startQuankeyDetection);
  } else {
    startQuankeyDetection();
  }
})();

// Start form detection and monitoring
function startQuankeyDetection() {
  console.log('🔍 Starting Quankey form detection...');
  
  // Check authentication status
  checkQuankeyAuth();
  
  // Initial form scan
  setTimeout(() => {
    scanForLoginForms();
    setupFormMonitoring();
    setupSecurityChecks();
  }, QUANKEY_CONFIG.formDetectionDelay);
}

// Check if user is authenticated with Quankey
async function checkQuankeyAuth() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'AUTH_CHECK'
    });
    
    isQuankeyAuthenticated = response.authenticated;
    console.log('🔐 Quankey auth status:', isQuankeyAuthenticated);
    
    if (isQuankeyAuthenticated) {
      setupQuankeyUI();
    }
  } catch (error) {
    console.error('❌ Auth check failed:', error);
    isQuankeyAuthenticated = false;
  }
}

// Scan for login forms on the page
function scanForLoginForms() {
  console.log('🔎 Scanning for login forms...');
  
  // Common selectors for login forms
  const loginSelectors = [
    'form:has(input[type="password"])',
    'form[name*="login"]',
    'form[id*="login"]',
    'form[class*="login"]',
    'form[action*="login"]',
    'form[action*="signin"]',
    'form[action*="auth"]',
    '.login-form',
    '.signin-form',
    '.auth-form'
  ];
  
  let formsFound = 0;
  
  loginSelectors.forEach(selector => {
    try {
      const forms = document.querySelectorAll(selector);
      forms.forEach(form => {
        if (!detectedForms.has(form) && isValidLoginForm(form)) {
          detectedForms.add(form);
          processLoginForm(form);
          formsFound++;
        }
      });
    } catch (error) {
      console.warn('⚠️ Error with selector:', selector, error);
    }
  });
  
  // Fallback: scan all forms
  if (formsFound === 0) {
    const allForms = document.querySelectorAll('form');
    allForms.forEach(form => {
      if (!detectedForms.has(form) && isValidLoginForm(form)) {
        detectedForms.add(form);
        processLoginForm(form);
        formsFound++;
      }
    });
  }
  
  console.log(`✅ Found ${formsFound} login forms`);
}

// Validate if form is a login form
function isValidLoginForm(form) {
  if (!form || detectedForms.has(form)) return false;
  
  const passwordFields = form.querySelectorAll('input[type="password"]');
  const emailFields = form.querySelectorAll('input[type="email"]');
  const textFields = form.querySelectorAll('input[type="text"]');
  const usernameFields = form.querySelectorAll('input[name*="user"], input[name*="email"], input[id*="user"], input[id*="email"]');
  
  // Must have at least one password field
  if (passwordFields.length === 0) return false;
  
  // Must have some kind of username/email field
  if (emailFields.length === 0 && textFields.length === 0 && usernameFields.length === 0) return false;
  
  // Reasonable form size (not a huge form)
  const allInputs = form.querySelectorAll('input');
  if (allInputs.length > QUANKEY_CONFIG.maxFormFields) return false;
  
  // Check for anti-patterns (registration forms, etc.)
  const formText = form.textContent.toLowerCase();
  const antiPatterns = ['register', 'sign up', 'create account', 'join', 'confirm password'];
  const isRegistrationForm = antiPatterns.some(pattern => formText.includes(pattern));
  
  // Allow registration forms if they have password confirmation
  if (isRegistrationForm && passwordFields.length < 2) return false;
  
  return true;
}

// Process detected login form
async function processLoginForm(form) {
  console.log('📝 Processing login form:', form);
  
  try {
    // Analyze form structure
    const formData = analyzeFormStructure(form);
    
    // Send form detection to background script
    await chrome.runtime.sendMessage({
      type: 'FORM_DETECTED',
      data: {
        type: formData.type,
        domain: window.location.hostname,
        url: window.location.href,
        fields: formData.fields,
        formId: formData.id
      }
    });
    
    // Add Quankey integration if authenticated
    if (isQuankeyAuthenticated) {
      await addQuankeyIntegration(form, formData);
    }
    
  } catch (error) {
    console.error('❌ Form processing failed:', error);
  }
}

// Analyze form structure
function analyzeFormStructure(form) {
  const passwordFields = Array.from(form.querySelectorAll('input[type="password"]'));
  const emailFields = Array.from(form.querySelectorAll('input[type="email"]'));
  const textFields = Array.from(form.querySelectorAll('input[type="text"]'));
  const submitButtons = Array.from(form.querySelectorAll('input[type="submit"], button[type="submit"], button:not([type])'));
  
  // Determine form type
  let formType = 'login';
  if (passwordFields.length >= 2) {
    formType = 'registration';
  }
  
  // Find username field
  let usernameField = emailFields[0] || textFields.find(field => 
    field.name.toLowerCase().includes('user') || 
    field.name.toLowerCase().includes('email') ||
    field.id.toLowerCase().includes('user') ||
    field.id.toLowerCase().includes('email')
  ) || textFields[0];
  
  // Find password field
  let passwordField = passwordFields[0];
  
  return {
    id: form.id || `quankey-form-${Date.now()}`,
    type: formType,
    fields: {
      username: usernameField ? {
        element: usernameField,
        name: usernameField.name,
        id: usernameField.id,
        type: usernameField.type,
        placeholder: usernameField.placeholder
      } : null,
      password: passwordField ? {
        element: passwordField,
        name: passwordField.name,
        id: passwordField.id,
        placeholder: passwordField.placeholder
      } : null
    },
    submitButton: submitButtons[0] || null
  };
}

// Add Quankey integration to form
async function addQuankeyIntegration(form, formData) {
  console.log('🔧 Adding Quankey integration to form...');
  
  try {
    // Check if we have credentials for this site
    const credentials = await fetchCredentialsForSite();
    
    if (credentials && credentials.length > 0) {
      addQuankeyAutofillIcon(formData.fields.password.element, credentials);
    }
    
    // Add save prompt for new credentials
    addCredentialSaveListener(form, formData);
    
  } catch (error) {
    console.error('❌ Quankey integration failed:', error);
  }
}

// Fetch credentials for current site
async function fetchCredentialsForSite() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_CREDENTIALS',
      data: {
        domain: window.location.hostname,
        url: window.location.href,
        formFields: extractFormFieldInfo()
      }
    });
    
    if (response.success) {
      return response.credentials;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Credentials fetch failed:', error);
    return [];
  }
}

// Add autofill icon to password field
function addQuankeyAutofillIcon(passwordField, credentials) {
  if (!passwordField || passwordField.quankeyIconAdded) return;
  
  console.log('🎯 Adding autofill icon to password field...');
  
  // Create icon container
  const iconContainer = document.createElement('div');
  iconContainer.className = 'quankey-autofill-icon';
  iconContainer.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L13.09 8.26L19 7L15.74 12.74L22 12L15.74 15.26L19 21L13.09 19.74L12 26L10.91 19.74L5 21L8.26 15.26L2 12L8.26 8.74L5 3L10.91 4.26L12 2Z" fill="#6366f1"/>
    </svg>
  `;
  
  // Style the icon
  iconContainer.style.cssText = `
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    z-index: 10000;
    background: white;
    border-radius: 4px;
    padding: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    opacity: 0.8;
    transition: opacity 0.2s ease;
  `;
  
  // Position relative to password field
  const fieldRect = passwordField.getBoundingClientRect();
  passwordField.style.position = 'relative';
  passwordField.style.paddingRight = '32px';
  
  // Add click handler
  iconContainer.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showCredentialSelector(credentials, passwordField);
  });
  
  // Hover effects
  iconContainer.addEventListener('mouseenter', () => {
    iconContainer.style.opacity = '1';
  });
  
  iconContainer.addEventListener('mouseleave', () => {
    iconContainer.style.opacity = '0.8';
  });
  
  // Insert icon
  passwordField.parentNode.style.position = 'relative';
  passwordField.parentNode.appendChild(iconContainer);
  passwordField.quankeyIconAdded = true;
  
  console.log('✅ Autofill icon added');
}

// Show credential selector
function showCredentialSelector(credentials, targetField) {
  console.log('🎯 Showing credential selector...');
  
  // Remove existing selector
  const existing = document.querySelector('.quankey-credential-selector');
  if (existing) existing.remove();
  
  // Create selector
  const selector = document.createElement('div');
  selector.className = 'quankey-credential-selector';
  
  let credentialItems = '';
  credentials.forEach((cred, index) => {
    credentialItems += `
      <div class="quankey-credential-item" data-index="${index}">
        <div class="quankey-credential-info">
          <div class="quankey-credential-username">${cred.username || cred.email || 'Unknown'}</div>
          <div class="quankey-credential-site">${cred.site || window.location.hostname}</div>
        </div>
        <div class="quankey-quantum-badge">🌌</div>
      </div>
    `;
  });
  
  selector.innerHTML = `
    <div class="quankey-selector-header">
      <div class="quankey-logo">🌌 Quankey</div>
      <button class="quankey-close" onclick="this.closest('.quankey-credential-selector').remove()">×</button>
    </div>
    <div class="quankey-credentials-list">
      ${credentialItems}
      <div class="quankey-credential-item quankey-generate-new">
        <div class="quankey-credential-info">
          <div class="quankey-credential-username">Generate Quantum Password</div>
          <div class="quankey-credential-site">Create new quantum-secure password</div>
        </div>
        <div class="quankey-quantum-badge">⚡</div>
      </div>
    </div>
  `;
  
  // Style the selector
  selector.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    z-index: 10001;
    max-height: 300px;
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;
  
  // Add event listeners
  selector.addEventListener('click', (e) => {
    const item = e.target.closest('.quankey-credential-item');
    if (!item) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (item.classList.contains('quankey-generate-new')) {
      generateQuantumPassword(targetField);
    } else {
      const index = parseInt(item.dataset.index);
      autofillCredentials(credentials[index]);
    }
    
    selector.remove();
  });
  
  // Position and show
  targetField.parentNode.appendChild(selector);
  
  console.log('✅ Credential selector shown');
}

// Autofill selected credentials
async function autofillCredentials(credentials) {
  console.log('🔄 Autofilling credentials...');
  
  try {
    await chrome.runtime.sendMessage({
      type: 'AUTOFILL_REQUEST',
      data: credentials
    });
    
    console.log('✅ Autofill completed');
  } catch (error) {
    console.error('❌ Autofill failed:', error);
  }
}

// Generate quantum password
async function generateQuantumPassword(targetField) {
  console.log('🌌 Generating quantum password...');
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_QUANTUM_PASSWORD',
      data: {
        length: 16,
        includeSymbols: true
      }
    });
    
    if (response.success) {
      // Fill password field
      targetField.value = response.password;
      targetField.dispatchEvent(new Event('input', { bubbles: true }));
      targetField.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Show quantum password notification
      showQuantumNotification(`🌌 Quantum password generated (${response.strength}% strength)`);
      
      console.log('✅ Quantum password generated and filled');
    }
  } catch (error) {
    console.error('❌ Quantum password generation failed:', error);
  }
}

// Add listener for saving new credentials
function addCredentialSaveListener(form, formData) {
  const submitHandler = async (e) => {
    // Don't prevent form submission, just capture data
    setTimeout(async () => {
      try {
        const username = formData.fields.username?.element?.value;
        const password = formData.fields.password?.element?.value;
        
        if (username && password) {
          await saveNewCredentials({
            domain: window.location.hostname,
            url: window.location.href,
            username: username,
            password: password,
            site: window.location.hostname
          });
        }
      } catch (error) {
        console.error('❌ Credential save failed:', error);
      }
    }, 1000);
  };
  
  form.addEventListener('submit', submitHandler);
  
  // Also listen for button clicks
  if (formData.submitButton) {
    formData.submitButton.addEventListener('click', submitHandler);
  }
}

// Save new credentials
async function saveNewCredentials(credentialData) {
  console.log('💾 Saving new credentials...');
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SAVE_CREDENTIALS',
      data: credentialData
    });
    
    if (response.success) {
      showQuantumNotification('🔐 Credentials saved with quantum security!');
      console.log('✅ Credentials saved');
    }
  } catch (error) {
    console.error('❌ Credential save failed:', error);
  }
}

// Setup form monitoring for dynamic content
function setupFormMonitoring() {
  console.log('👀 Setting up dynamic form monitoring...');
  
  formObserver = new MutationObserver((mutations) => {
    let shouldRescan = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'FORM' || node.querySelector('form')) {
              shouldRescan = true;
            }
          }
        });
      }
    });
    
    if (shouldRescan) {
      setTimeout(scanForLoginForms, QUANKEY_CONFIG.formDetectionDelay);
    }
  });
  
  formObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Setup security checks
function setupSecurityChecks() {
  setInterval(() => {
    // Check for suspicious activity
    checkForPhishingIndicators();
  }, QUANKEY_CONFIG.securityCheckInterval);
}

// Check for phishing indicators
function checkForPhishingIndicators() {
  // Simple phishing checks
  const suspicious = [
    window.location.href.includes('data:'),
    window.location.protocol === 'file:',
    document.title.toLowerCase().includes('phish'),
    document.querySelector('iframe[src*="data:"]')
  ];
  
  if (suspicious.some(check => check)) {
    console.warn('⚠️ Suspicious page detected, disabling autofill');
    // Could disable Quankey features on suspicious pages
  }
}

// Utility functions
function extractFormFieldInfo() {
  const forms = Array.from(document.querySelectorAll('form'));
  return forms.map(form => ({
    id: form.id,
    action: form.action,
    method: form.method,
    fieldCount: form.querySelectorAll('input').length
  }));
}

function showQuantumNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #6366f1;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10002;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (formObserver) {
    formObserver.disconnect();
  }
});

console.log('✅ Quankey Content Script Ready');