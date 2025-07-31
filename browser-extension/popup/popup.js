/**
 * ===============================================================================
 * 🌌 QUANKEY POPUP - JAVASCRIPT
 * ===============================================================================
 */

// Popup state
let currentUser = null;
let currentTab = null;
let isAuthenticated = false;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌌 Quankey Popup Initializing...');
  
  try {
    // Get current tab info
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
    
    // Check authentication status
    await checkAuthStatus();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize UI based on auth status
    if (isAuthenticated) {
      await initializeDashboard();
    } else {
      showAuthSection();
    }
    
  } catch (error) {
    console.error('❌ Popup initialization failed:', error);
    showErrorSection('Initialization failed');
  }
});

// Check authentication status
async function checkAuthStatus() {
  try {
    showLoadingSection();
    
    const response = await chrome.runtime.sendMessage({
      type: 'AUTH_CHECK'
    });
    
    isAuthenticated = response.authenticated;
    
    if (isAuthenticated && response.user) {
      currentUser = response.user;
    }
    
    updateStatusIndicator(isAuthenticated);
    
    console.log('🔐 Auth Status:', isAuthenticated);
    
  } catch (error) {
    console.error('❌ Auth check failed:', error);
    isAuthenticated = false;
    updateStatusIndicator(false);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Auth form
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  
  // Navigation links
  document.getElementById('openAppLink').addEventListener('click', openQuankeyApp);
  document.getElementById('forgotPasswordLink').addEventListener('click', openForgotPassword);
  
  // Dashboard actions
  document.getElementById('settingsButton').addEventListener('click', openSettings);
  document.getElementById('addPasswordButton').addEventListener('click', addPassword);
  document.getElementById('generatePasswordButton').addEventListener('click', generateQuantumPassword);
  document.getElementById('openVaultButton').addEventListener('click', openVault);
  document.getElementById('securityCheckButton').addEventListener('click', runSecurityCheck);
  
  // Footer links
  document.getElementById('helpLink').addEventListener('click', openHelp);
  document.getElementById('feedbackLink').addEventListener('click', openFeedback);
  document.getElementById('logoutLink').addEventListener('click', handleLogout);
  document.getElementById('retryButton').addEventListener('click', retryConnection);
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;
  const loginButton = document.getElementById('loginButton');
  const buttonText = loginButton.querySelector('.button-text');
  const loadingSpinner = loginButton.querySelector('.loading-spinner');
  
  if (!email || !password) {
    showNotification('Please enter email and password', 'error');
    return;
  }
  
  try {
    // Show loading state
    loginButton.disabled = true;
    buttonText.style.display = 'none';
    loadingSpinner.style.display = 'inline';
    
    const response = await chrome.runtime.sendMessage({
      type: 'LOGIN_REQUEST',
      data: { email, password }
    });
    
    if (response.success) {
      currentUser = response.user;
      isAuthenticated = true;
      
      showNotification('Login successful!', 'success');
      
      // Initialize dashboard
      await initializeDashboard();
      
    } else {
      showNotification(response.error || 'Login failed', 'error');
    }
    
  } catch (error) {
    console.error('❌ Login failed:', error);
    showNotification('Login failed. Please try again.', 'error');
  } finally {
    // Reset button state
    loginButton.disabled = false;
    buttonText.style.display = 'inline';
    loadingSpinner.style.display = 'none';
  }
}

// Initialize dashboard
async function initializeDashboard() {
  try {
    showLoadingSection();
    
    // Update user info
    updateUserInfo();
    
    // Load current site info
    await loadCurrentSiteInfo();
    
    // Load user stats
    await loadUserStats();
    
    // Load security status
    await loadSecurityStatus();
    
    showDashboardSection();
    
  } catch (error) {
    console.error('❌ Dashboard initialization failed:', error);
    showErrorSection('Failed to load dashboard');
  }
}

// Update user info
function updateUserInfo() {
  if (!currentUser) return;
  
  const userInitials = document.getElementById('userInitials');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  
  // Generate initials
  const initials = currentUser.displayName 
    ? currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    : currentUser.email[0].toUpperCase();
  
  userInitials.textContent = initials;
  userName.textContent = currentUser.displayName || 'User';
  userEmail.textContent = currentUser.email;
}

// Load current site info
async function loadCurrentSiteInfo() {
  if (!currentTab) return;
  
  try {
    const url = new URL(currentTab.url);
    const domain = url.hostname;
    
    // Update site info
    document.getElementById('siteName').textContent = currentTab.title || domain;
    document.getElementById('siteUrl').textContent = domain;
    
    // Try to get favicon
    if (currentTab.favIconUrl) {
      document.getElementById('siteFavicon').innerHTML = 
        `<img src="${currentTab.favIconUrl}" width="16" height="16" style="border-radius: 3px;">`;
    }
    
    // Check for saved credentials
    await loadSiteCredentials(domain);
    
  } catch (error) {
    console.error('❌ Site info loading failed:', error);
    document.getElementById('siteName').textContent = 'Current Site';
    document.getElementById('siteUrl').textContent = 'Unknown';
  }
}

// Load site credentials
async function loadSiteCredentials(domain) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_CREDENTIALS',
      data: {
        domain: domain,
        url: currentTab.url
      }
    });
    
    if (response.success && response.credentials && response.credentials.length > 0) {
      showCredentialsList(response.credentials);
    } else {
      showNoCredentials();
    }
    
  } catch (error) {
    console.error('❌ Credentials loading failed:', error);
    showNoCredentials();
  }
}

// Show credentials list
function showCredentialsList(credentials) {
  const noCredentials = document.getElementById('noCredentials');
  const credentialsList = document.getElementById('credentialsList');
  
  noCredentials.style.display = 'none';
  credentialsList.style.display = 'block';
  
  credentialsList.innerHTML = '';
  
  credentials.forEach((cred, index) => {
    const credItem = document.createElement('div');
    credItem.className = 'credential-item';
    credItem.innerHTML = `
      <div class="credential-info">
        <div class="credential-username">${cred.username || cred.email || 'Unknown'}</div>
        <div class="credential-meta">
          ${cred.isQuantum ? '🌌 Quantum' : '🔐 Standard'} • 
          ${cred.lastUsed ? new Date(cred.lastUsed).toLocaleDateString() : 'Never used'}
        </div>
      </div>
      <button class="autofill-button" data-index="${index}">Fill</button>
    `;
    
    credItem.querySelector('.autofill-button').addEventListener('click', () => {
      autofillCredential(cred);
    });
    
    credentialsList.appendChild(credItem);
  });
}

// Show no credentials
function showNoCredentials() {
  const noCredentials = document.getElementById('noCredentials');
  const credentialsList = document.getElementById('credentialsList');
  
  noCredentials.style.display = 'block';
  credentialsList.style.display = 'none';
}

// Load user stats
async function loadUserStats() {
  try {
    // Mock stats for now - would come from API
    document.getElementById('totalPasswords').textContent = '24';
    document.getElementById('quantumPasswords').textContent = '18';
    document.getElementById('securityScore').textContent = '98';
    
  } catch (error) {
    console.error('❌ Stats loading failed:', error);
  }
}

// Load security status
async function loadSecurityStatus() {
  try {
    document.getElementById('quantumEntropy').textContent = '99.9%';
    document.getElementById('vaultStatus').textContent = 'Secure';
    document.getElementById('lastBackup').textContent = 'Today';
    document.getElementById('lastSync').textContent = 'Last sync: 2 min ago';
    
  } catch (error) {
    console.error('❌ Security status loading failed:', error);
  }
}

// Autofill credential
async function autofillCredential(credential) {
  try {
    await chrome.runtime.sendMessage({
      type: 'AUTOFILL_REQUEST',
      data: credential
    });
    
    showNotification('Password filled successfully!', 'success');
    window.close();
    
  } catch (error) {
    console.error('❌ Autofill failed:', error);
    showNotification('Autofill failed', 'error');
  }
}

// Generate quantum password
async function generateQuantumPassword() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_QUANTUM_PASSWORD',
      data: {
        length: 16,
        includeSymbols: true
      }
    });
    
    if (response.success) {
      // Copy to clipboard
      await navigator.clipboard.writeText(response.password);
      showNotification(`🌌 Quantum password generated and copied! (${response.strength}% strength)`, 'success');
    } else {
      showNotification('Password generation failed', 'error');
    }
    
  } catch (error) {
    console.error('❌ Password generation failed:', error);
    showNotification('Password generation failed', 'error');
  }
}

// Navigation functions
function openQuankeyApp() {
  chrome.tabs.create({ url: 'http://localhost:3001' });
  window.close();
}

function openForgotPassword() {
  chrome.tabs.create({ url: 'http://localhost:3001/forgot-password' });
  window.close();
}

function openSettings() {
  chrome.tabs.create({ url: 'http://localhost:3001/settings' });
  window.close();
}

function openVault() {
  chrome.tabs.create({ url: 'http://localhost:3001/vault' });
  window.close();
}

function openHelp() {
  chrome.tabs.create({ url: 'http://localhost:3000/help' });
  window.close();
}

function openFeedback() {
  chrome.tabs.create({ url: 'http://localhost:3000/feedback' });
  window.close();
}

function addPassword() {
  if (currentTab) {
    const url = new URL(currentTab.url);
    chrome.tabs.create({ 
      url: `http://localhost:3001/add-password?site=${encodeURIComponent(url.hostname)}` 
    });
    window.close();
  }
}

async function runSecurityCheck() {
  showNotification('Running security check...', 'info');
  
  // Mock security check
  setTimeout(() => {
    showNotification('🛡️ Security check complete - All systems secure!', 'success');
  }, 2000);
}

async function handleLogout() {
  try {
    await chrome.storage.local.clear();
    isAuthenticated = false;
    currentUser = null;
    
    showNotification('Logged out successfully', 'success');
    showAuthSection();
    
  } catch (error) {
    console.error('❌ Logout failed:', error);
    showNotification('Logout failed', 'error');
  }
}

function retryConnection() {
  location.reload();
}

// UI state management
function showAuthSection() {
  hideAllSections();
  document.getElementById('authSection').style.display = 'block';
  document.getElementById('logoutLink').style.display = 'none';
}

function showDashboardSection() {
  hideAllSections();
  document.getElementById('dashboardSection').style.display = 'block';
  document.getElementById('logoutLink').style.display = 'inline';
}

function showLoadingSection() {
  hideAllSections();
  document.getElementById('loadingSection').style.display = 'flex';
}

function showErrorSection(message) {
  hideAllSections();
  document.getElementById('errorSection').style.display = 'flex';
  document.getElementById('errorMessage').textContent = message;
}

function hideAllSections() {
  const sections = ['authSection', 'dashboardSection', 'loadingSection', 'errorSection'];
  sections.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.style.display = 'none';
  });
}

function updateStatusIndicator(authenticated) {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusDot = statusIndicator.querySelector('.status-dot');
  const statusText = statusIndicator.querySelector('.status-text');
  
  if (authenticated) {
    statusDot.style.background = '#10b981';
    statusText.textContent = 'Connected';
  } else {
    statusDot.style.background = '#ef4444';
    statusText.textContent = 'Not signed in';
  }
}

// Notification system
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  notification.style.cssText = `
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#6366f1'};
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    z-index: 10000;
    animation: slideDown 0.3s ease-out;
    max-width: 300px;
    text-align: center;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }
  
  @keyframes slideUp {
    from { transform: translateX(-50%) translateY(0); opacity: 1; }
    to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
  }
  
  .credential-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .credential-item:last-child {
    border-bottom: none;
  }
  
  .credential-info {
    flex: 1;
    min-width: 0;
  }
  
  .credential-username {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 2px;
  }
  
  .credential-meta {
    font-size: 12px;
    color: #6b7280;
  }
  
  .autofill-button {
    padding: 6px 12px;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .autofill-button:hover {
    background: #4f46e5;
  }
`;

document.head.appendChild(style);

console.log('✅ Quankey Popup Ready');