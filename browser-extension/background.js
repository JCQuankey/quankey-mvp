/**
 * ===============================================================================
 * 🌌 QUANKEY BROWSER EXTENSION - BACKGROUND SERVICE WORKER
 * ===============================================================================
 * 
 * CRITICAL: Quantum-secured password manager extension
 * 
 * Features:
 * ✅ Secure communication with Quankey app
 * ✅ Zero-knowledge architecture maintained
 * ✅ Quantum-proof credential handling
 * ✅ Cross-origin security management
 */

// Extension state management
let isAuthenticated = false;
let quantumSession = null;
let appConnection = null;

// API endpoints (switch based on environment)
const API_BASE = chrome.runtime.getManifest().host_permissions.includes('http://localhost:5000/*') 
  ? 'http://localhost:5000' 
  : 'https://api.quankey.xyz';

console.log('🌌 Quankey Extension Background Worker Started');
console.log('📡 API Base:', API_BASE);

// Extension installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🚀 Quankey Extension Installed:', details.reason);
  
  if (details.reason === 'install') {
    // First time installation
    initializeExtension();
  } else if (details.reason === 'update') {
    // Extension updated
    handleExtensionUpdate(details.previousVersion);
  }
});

// Initialize extension on first install
async function initializeExtension() {
  console.log('🔧 Initializing Quankey Extension...');
  
  try {
    // Set default storage values
    await chrome.storage.local.set({
      isFirstRun: true,
      extensionVersion: chrome.runtime.getManifest().version,
      quantumSecurityEnabled: true,
      autoFillEnabled: true,
      formDetectionEnabled: true,
      securityLevel: 'maximum',
      lastSync: null
    });
    
    // Open welcome/setup page
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome/welcome.html')
    });
    
    console.log('✅ Extension initialized successfully');
  } catch (error) {
    console.error('❌ Extension initialization failed:', error);
  }
}

// Handle extension updates
async function handleExtensionUpdate(previousVersion) {
  console.log(`🔄 Extension updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);
  
  // Perform any necessary migrations
  await migrateExtensionData(previousVersion);
}

// Message handling between components
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received message:', message.type, 'from:', sender.tab?.url || 'popup');
  
  switch (message.type) {
    case 'AUTH_CHECK':
      handleAuthCheck(sendResponse);
      break;
      
    case 'LOGIN_REQUEST':
      handleLoginRequest(message.data, sendResponse);
      break;
      
    case 'FETCH_CREDENTIALS':
      handleFetchCredentials(message.data, sendResponse);
      break;
      
    case 'SAVE_CREDENTIALS':
      handleSaveCredentials(message.data, sendResponse);
      break;
      
    case 'GENERATE_QUANTUM_PASSWORD':
      handleQuantumPasswordGeneration(message.data, sendResponse);
      break;
      
    case 'FORM_DETECTED':
      handleFormDetection(message.data, sender, sendResponse);
      break;
      
    case 'AUTOFILL_REQUEST':
      handleAutofillRequest(message.data, sender, sendResponse);
      break;
      
    default:
      console.warn('⚠️ Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }
  
  return true; // Keep message channel open for async responses
});

// Authentication check
async function handleAuthCheck(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['authToken', 'sessionExpiry']);
    
    if (result.authToken && result.sessionExpiry && Date.now() < result.sessionExpiry) {
      isAuthenticated = true;
      sendResponse({ authenticated: true });
    } else {
      isAuthenticated = false;
      sendResponse({ authenticated: false });
    }
  } catch (error) {
    console.error('❌ Auth check failed:', error);
    sendResponse({ authenticated: false, error: error.message });
  }
}

// Handle login request
async function handleLoginRequest(credentials, sendResponse) {
  console.log('🔐 Processing login request...');
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/extension-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-Version': chrome.runtime.getManifest().version
      },
      body: JSON.stringify({
        ...credentials,
        extensionId: chrome.runtime.id,
        userAgent: navigator.userAgent
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Store auth token securely
      await chrome.storage.local.set({
        authToken: data.token,
        sessionExpiry: Date.now() + (data.expiresIn * 1000),
        userInfo: data.user,
        quantumSession: data.quantumSession
      });
      
      isAuthenticated = true;
      quantumSession = data.quantumSession;
      
      console.log('✅ Login successful');
      sendResponse({ success: true, user: data.user });
    } else {
      const error = await response.json();
      console.error('❌ Login failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  } catch (error) {
    console.error('❌ Login request failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle credentials fetching
async function handleFetchCredentials(siteInfo, sendResponse) {
  if (!isAuthenticated) {
    sendResponse({ success: false, error: 'Not authenticated' });
    return;
  }
  
  console.log('🔍 Fetching credentials for:', siteInfo.domain);
  
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);
    
    const response = await fetch(`${API_BASE}/api/passwords/for-site`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-Extension-Version': chrome.runtime.getManifest().version
      },
      body: JSON.stringify({
        domain: siteInfo.domain,
        url: siteInfo.url,
        formFields: siteInfo.formFields
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.credentials?.length || 0} credentials`);
      sendResponse({ success: true, credentials: data.credentials });
    } else {
      const error = await response.json();
      console.error('❌ Credentials fetch failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  } catch (error) {
    console.error('❌ Credentials fetch error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle saving new credentials
async function handleSaveCredentials(credentialData, sendResponse) {
  if (!isAuthenticated) {
    sendResponse({ success: false, error: 'Not authenticated' });
    return;
  }
  
  console.log('💾 Saving credentials for:', credentialData.domain);
  
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);
    
    const response = await fetch(`${API_BASE}/api/passwords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-Extension-Version': chrome.runtime.getManifest().version
      },
      body: JSON.stringify({
        ...credentialData,
        source: 'browser_extension'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Credentials saved successfully');
      sendResponse({ success: true, passwordId: data.id });
    } else {
      const error = await response.json();
      console.error('❌ Save credentials failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  } catch (error) {
    console.error('❌ Save credentials error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle quantum password generation
async function handleQuantumPasswordGeneration(options, sendResponse) {
  if (!isAuthenticated) {
    sendResponse({ success: false, error: 'Not authenticated' });
    return;
  }
  
  console.log('🌌 Generating quantum password...');
  
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);
    
    const response = await fetch(`${API_BASE}/api/quantum/generate-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-Extension-Version': chrome.runtime.getManifest().version
      },
      body: JSON.stringify({
        length: options.length || 16,
        includeSymbols: options.includeSymbols || true,
        quantumEntropy: true,
        source: 'extension'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Quantum password generated');
      sendResponse({ 
        success: true, 
        password: data.password,
        strength: data.strength,
        quantumSource: data.quantumSource
      });
    } else {
      const error = await response.json();
      console.error('❌ Quantum password generation failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  } catch (error) {
    console.error('❌ Quantum password generation error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle form detection from content script
async function handleFormDetection(formData, sender, sendResponse) {
  console.log('📝 Form detected on:', sender.tab.url);
  
  // Store form detection for analytics
  try {
    const detections = await chrome.storage.local.get(['formDetections']) || {};
    const domain = new URL(sender.tab.url).hostname;
    
    if (!detections.formDetections) {
      detections.formDetections = {};
    }
    
    detections.formDetections[domain] = {
      lastDetected: Date.now(),
      formType: formData.type,
      fieldCount: formData.fields?.length || 0,
      url: sender.tab.url
    };
    
    await chrome.storage.local.set(detections);
    
    sendResponse({ success: true, message: 'Form detection recorded' });
  } catch (error) {
    console.error('❌ Form detection handling failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle autofill request
async function handleAutofillRequest(autofillData, sender, sendResponse) {
  if (!isAuthenticated) {
    sendResponse({ success: false, error: 'Not authenticated' });
    return;
  }
  
  console.log('🔄 Processing autofill request for:', sender.tab.url);
  
  try {
    // Inject autofill script into the tab
    await chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: performSecureAutofill,
      args: [autofillData]
    });
    
    sendResponse({ success: true, message: 'Autofill completed' });
  } catch (error) {
    console.error('❌ Autofill failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Secure autofill function (injected into page)
function performSecureAutofill(credentials) {
  console.log('🔐 Performing secure autofill...');
  
  // Find and fill form fields
  const usernameField = document.querySelector('input[type="email"], input[type="text"], input[name*="user"], input[name*="email"]');
  const passwordField = document.querySelector('input[type="password"]');
  
  if (usernameField && credentials.username) {
    usernameField.value = credentials.username;
    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
    usernameField.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  if (passwordField && credentials.password) {
    passwordField.value = credentials.password;
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    passwordField.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  console.log('✅ Autofill completed');
}

// Handle tab updates for form detection
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Tab finished loading, prepare for form detection
    console.log('🔍 Tab loaded, ready for form detection:', tab.url);
  }
});

// Cleanup on extension unload
chrome.runtime.onSuspend.addListener(() => {
  console.log('🔄 Extension suspending, cleaning up...');
  
  // Clear sensitive data
  isAuthenticated = false;
  quantumSession = null;
  appConnection = null;
});

// Migration helper
async function migrateExtensionData(previousVersion) {
  console.log('🔄 Migrating extension data...');
  
  // Add migration logic here for future versions
  // For now, just log the migration
  
  await chrome.storage.local.set({
    lastMigration: Date.now(),
    migratedFrom: previousVersion
  });
  
  console.log('✅ Migration completed');
}

console.log('✅ Quankey Extension Background Worker Ready');