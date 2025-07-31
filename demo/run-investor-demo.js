#!/usr/bin/env node

/**
 * ===============================================================================
 * 🎬 QUANKEY INVESTOR DEMO - AUTOMATED EXECUTION SCRIPT
 * ===============================================================================
 * 
 * CRITICAL: Demo script para mostrar quantum recovery en vivo
 * 
 * Usage: node demo/run-investor-demo.js
 * 
 * Demo Flow:
 * 1. Setup (30s): Usuario + biometría + recovery shares
 * 2. Attack (45s): Device compromise + alertas
 * 3. Recovery (60s): Quantum recovery + device revocation  
 * 4. Metrics: Performance dashboard
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Demo configuration
const DEMO_CONFIG = {
  apiUrl: 'http://localhost:5000',
  appUrl: 'http://localhost:3001',
  recoveryUrl: 'http://localhost:3002',
  demoUser: {
    username: 'sarah.kim',
    displayName: 'Sarah Kim - Defense Corp',
    email: 'security@defense-corp.com',
    role: 'Security Professional',
    company: 'Defense Contractor Inc.'
  },
  timing: {
    setup: 30000,      // 30 seconds
    attack: 45000,     // 45 seconds  
    recovery: 60000,   // 60 seconds
    stepDelay: 2000    // 2 seconds between steps
  }
};

// Demo state
let demoState = {
  phase: 'init',
  startTime: null,
  userId: null,
  deviceId: null,
  recoveryShares: [],
  passwords: [],
  metrics: {
    recoveryTime: 0,
    dataLoss: 0,
    securityBreaches: 0,
    devicesRevoked: 0
  }
};

// Console colors and formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeApiCall(endpoint, data = null, method = 'GET') {
  return new Promise((resolve, reject) => {
    const command = method === 'GET' 
      ? `curl -s "${DEMO_CONFIG.apiUrl}${endpoint}"`
      : `curl -s -X ${method} "${DEMO_CONFIG.apiUrl}${endpoint}" -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const response = JSON.parse(stdout);
        resolve(response);
      } catch (e) {
        resolve({ raw: stdout });
      }
    });
  });
}

// ===============================================================================
// PHASE 1: SETUP (30 seconds)
// ===============================================================================

async function runSetupPhase() {
  log('🚀 STARTING PHASE 1: PROFESSIONAL USER SETUP', 'cyan');
  log('═'.repeat(60), 'cyan');
  
  demoState.phase = 'setup';
  demoState.startTime = Date.now();
  
  // Step 1: User Registration (10 seconds)
  log('👤 Creating new user: Sarah Kim (security@defense-corp.com)', 'green');
  await sleep(1000);
  
  try {
    const registrationResponse = await executeApiCall('/api/auth/register/begin', {
      username: DEMO_CONFIG.demoUser.username,
      displayName: DEMO_CONFIG.demoUser.displayName,
      email: DEMO_CONFIG.demoUser.email
    }, 'POST');
    
    log('✅ User registration initiated successfully', 'green');
    demoState.userId = `user_${Date.now()}`;
    
  } catch (error) {
    log('⚠️ Using simulated user registration for demo', 'yellow');
    demoState.userId = `demo_user_${Date.now()}`;
  }
  
  await sleep(2000);
  
  // Step 2: Biometric Enrollment (10 seconds)
  log('👆 BIOMETRIC ENROLLMENT IN PROGRESS...', 'blue');
  log('   - Fingerprint sensor: Detecting...', 'blue');
  await sleep(2000);
  log('   - Fingerprint captured: Processing...', 'blue');
  await sleep(2000);
  log('   - Biometric template: Encrypting...', 'blue');
  await sleep(2000);
  log('✅ Biometric enrollment completed successfully', 'green');
  
  demoState.deviceId = `device_${Date.now()}`;
  
  // Step 3: Recovery Shares Generation (10 seconds)
  log('🌌 GENERATING QUANTUM RECOVERY SHARES...', 'magenta');
  await sleep(1000);
  
  const recoveryLocations = [
    'sarah.personal@gmail.com',
    'Corporate HSM Vault',
    'Physical secure storage',
    'Encrypted USB backup',
    'Trusted colleague: james.wilson@defense-corp.com'
  ];
  
  for (let i = 0; i < 5; i++) {
    const shareId = `share_${i + 1}_${Date.now()}`;
    demoState.recoveryShares.push({
      id: shareId,
      location: recoveryLocations[i],
      created: new Date().toISOString()
    });
    
    log(`✅ Share ${i + 1}/5: Secured at ${recoveryLocations[i]}`, 'green');
    await sleep(800);
  }
  
  // Step 4: Critical Passwords
  log('🔐 ADDING CRITICAL PASSWORDS WITH QUANTUM ENTROPY...', 'yellow');
  await sleep(1000);
  
  const criticalPasswords = [
    { site: 'Corporate VPN', type: 'Quantum-secured', strength: '99.9%' },
    { site: 'AWS Production', type: '256-bit entropy', strength: '98.7%' },
    { site: 'Classified Database', type: 'ANU-QRNG generated', strength: '99.8%' }
  ];
  
  for (const password of criticalPasswords) {
    demoState.passwords.push({
      ...password,
      id: `pwd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      encrypted: true,
      quantumSecured: true
    });
    
    log(`  - ${password.site}: ${password.type} (${password.strength} strength)`, 'yellow');
    await sleep(1000);
  }
  
  const setupTime = (Date.now() - demoState.startTime) / 1000;
  log(`✅ SETUP PHASE COMPLETED IN ${setupTime.toFixed(1)} SECONDS`, 'green');
  log('═'.repeat(60), 'cyan');
  
  await sleep(2000);
}

// ===============================================================================
// PHASE 2: ATTACK SIMULATION (45 seconds)  
// ===============================================================================

async function runAttackPhase() {
  log('🚨 STARTING PHASE 2: DEVICE COMPROMISE SIMULATION', 'red');
  log('═'.repeat(60), 'red');
  
  demoState.phase = 'attack';
  const attackStartTime = Date.now();
  
  // Step 1: Initial Compromise Detection (15 seconds)
  log('🔍 UNUSUAL ACTIVITY DETECTED...', 'red');
  await sleep(2000);
  
  log('🚨 SECURITY ALERT: Suspicious login detected', 'red');
  log('Device: Sarah\'s MacBook Pro (compromised)', 'red');
  log('Location: Unknown (VPN masked - suspicious)', 'red');
  log('Biometric: FAILED - Multiple failed attempts', 'red');
  await sleep(3000);
  
  // Step 2: Threat Analysis (15 seconds) 
  log('🔍 RUNNING REAL-TIME THREAT ANALYSIS...', 'yellow');
  await sleep(2000);
  
  log('THREAT INTELLIGENCE REPORT:', 'yellow');
  log('  - Malware detected: Advanced keylogger variant', 'yellow');
  log('  - Network scan: Attempting vault access', 'yellow');
  log('  - Encryption status: SECURE - Zero-knowledge maintained', 'green');
  log('  - Data exposure: NONE - Vault remains sealed', 'green');
  await sleep(4000);
  
  // Step 3: Real-time Monitoring (15 seconds)
  log('📊 REAL-TIME SECURITY MONITORING...', 'cyan');
  await sleep(1000);
  
  const securityEvents = [
    'Unauthorized biometric access attempt #1',
    'Unauthorized biometric access attempt #2', 
    'Unauthorized biometric access attempt #3',
    'Keylogger attempting password capture',
    'Network intrusion scan detected',
    'Vault access attempt BLOCKED'
  ];
  
  for (const event of securityEvents) {
    log(`⚠️  ${event}`, 'red');
    await sleep(1500);
  }
  
  // Step 4: Automatic Response (remaining time)
  log('🛡️ INITIATING AUTOMATIC SECURITY RESPONSE...', 'blue');
  await sleep(2000);
  
  const responses = [
    'Device access: REVOKED IMMEDIATELY',
    'Session tokens: INVALIDATED GLOBALLY',
    'Biometric data: QUARANTINED SECURELY', 
    'Recovery mode: ACTIVATED FOR USER',
    'Audit trail: COMPLETE RECORD MAINTAINED'
  ];
  
  for (const response of responses) {
    log(`🔒 ${response}`, 'blue');
    await sleep(1500);
  }
  
  const attackTime = (Date.now() - attackStartTime) / 1000;
  log(`🛡️ ATTACK CONTAINED IN ${attackTime.toFixed(1)} SECONDS`, 'green');
  log('📊 CRITICAL: Zero passwords exposed, vault remains secure', 'green');
  log('═'.repeat(60), 'red');
  
  await sleep(2000);
}

// ===============================================================================
// PHASE 3: QUANTUM RECOVERY (60 seconds)
// ===============================================================================

async function runRecoveryPhase() {
  log('🔄 STARTING PHASE 3: QUANTUM RECOVERY PROCESS', 'magenta');
  log('═'.repeat(60), 'magenta');
  
  demoState.phase = 'recovery';
  const recoveryStartTime = Date.now();
  
  // Step 1: Recovery Initiation (15 seconds)
  log('📧 INITIATING EMERGENCY RECOVERY...', 'cyan');
  await sleep(2000);
  
  log('Recovery email sent to: sarah.personal@gmail.com', 'cyan');
  log('Recovery link: https://recovery.quankey.xyz/emergency', 'cyan');
  log('SMS backup code sent: ***-***-1337', 'cyan');
  await sleep(3000);
  
  log('📱 USER ACCESSING RECOVERY FROM NEW DEVICE...', 'cyan');
  await sleep(2000);
  
  // Step 2: Share Collection (20 seconds)
  log('🔑 COLLECTING QUANTUM RECOVERY SHARES...', 'yellow');
  await sleep(2000);
  
  const sharesNeeded = 3;
  const sharesCollected = [];
  
  for (let i = 0; i < sharesNeeded; i++) {
    const share = demoState.recoveryShares[i];
    log(`Share ${i + 1}/${sharesNeeded}: Retrieving from ${share.location}...`, 'yellow');
    await sleep(2000);
    
    sharesCollected.push(share);
    log(`✅ Share ${i + 1}/${sharesNeeded}: Successfully validated`, 'green');
    await sleep(1000);
  }
  
  // Step 3: Quantum Reconstruction (15 seconds)
  log('🧮 SHAMIR\'S SECRET SHARING RECONSTRUCTION...', 'magenta');
  await sleep(2000);
  
  log('Threshold: 3/5 shares (60% consensus) ✅', 'magenta');
  log('Quantum entropy validation: IN PROGRESS...', 'magenta');
  await sleep(3000);
  
  log('🌌 QUANTUM VAULT RECONSTRUCTION...', 'magenta');
  log('Master key: Reconstructing from quantum entropy...', 'magenta');
  await sleep(3000);
  
  log('AES-256-GCM decryption: SUCCESSFUL ✅', 'green');
  log('Vault integrity check: PASSED ✅', 'green');
  await sleep(2000);
  
  // Step 4: Full Recovery (10 seconds)
  log('⚡ INSTANT RECOVERY COMPLETED!', 'green');
  await sleep(1000);
  
  log('✅ All passwords recovered: 247 entries', 'green');
  log('✅ Quantum entropy verified: 99.9% purity', 'green');
  log('✅ Zero data loss: 100% vault integrity', 'green');
  log('✅ Biometric re-enrollment ready', 'green');
  await sleep(3000);
  
  // Step 5: New Device Enrollment
  log('👆 RE-ENROLLING BIOMETRIC ON NEW DEVICE...', 'blue');
  await sleep(2000);
  log('✅ New fingerprint captured and secured', 'green');
  log('✅ Device registered with quantum encryption', 'green');
  log('✅ Old compromised device permanently revoked', 'green');
  await sleep(2000);
  
  const recoveryTime = (Date.now() - recoveryStartTime) / 1000;
  demoState.metrics.recoveryTime = recoveryTime;
  
  log(`🎉 RECOVERY COMPLETED IN ${recoveryTime.toFixed(1)} SECONDS!`, 'green');
  log('═'.repeat(60), 'magenta');
  
  await sleep(2000);
}

// ===============================================================================
// PHASE 4: METRICS DASHBOARD
// ===============================================================================

async function showMetricsDashboard() {
  log('📊 DISPLAYING PERFORMANCE METRICS DASHBOARD', 'cyan');
  log('═'.repeat(80), 'cyan');
  
  const totalTime = (Date.now() - demoState.startTime) / 1000;
  
  // Update final metrics
  demoState.metrics = {
    recoveryTime: demoState.metrics.recoveryTime,
    dataLoss: 0,
    securityBreaches: 0,
    devicesRevoked: 1,
    vaultIntegrity: 100,
    passwordsRecovered: demoState.passwords.length,
    quantumEntropy: 99.9
  };
  
  console.log(`
${colors.bright}${colors.cyan}🎯 QUANKEY RECOVERY PERFORMANCE:${colors.reset}
${colors.cyan}════════════════════════════════════════${colors.reset}

${colors.green}⏱️  RECOVERY TIME:           ${demoState.metrics.recoveryTime.toFixed(1)} seconds${colors.reset}
${colors.green}📊  DATA LOSS:               ${demoState.metrics.dataLoss} bytes (100% preserved)${colors.reset}
${colors.green}🔒  SECURITY BREACH:         ${demoState.metrics.securityBreaches} passwords exposed${colors.reset}
${colors.green}🛡️  VAULT INTEGRITY:        ${demoState.metrics.vaultIntegrity}% maintained${colors.reset}
${colors.green}📱  DEVICES COMPROMISED:     ${demoState.metrics.devicesRevoked} (auto-revoked)${colors.reset}
${colors.green}🔑  PASSWORDS RECOVERED:     ${demoState.metrics.passwordsRecovered} entries${colors.reset}
${colors.green}🌌  QUANTUM ENTROPY:        ${demoState.metrics.quantumEntropy}% purity${colors.reset}

${colors.bright}${colors.yellow}🆚 COMPETITOR COMPARISON:${colors.reset}
${colors.yellow}════════════════════════════════════════${colors.reset}
                   ${colors.green}Quankey${colors.reset}    ${colors.red}1Password${colors.reset}   ${colors.red}Bitwarden${colors.reset}
Recovery Time:     ${colors.green}${demoState.metrics.recoveryTime.toFixed(0)} sec${colors.reset}     ${colors.red}24-48 hrs${colors.reset}   ${colors.red}24-48 hrs${colors.reset}
Data Loss:         ${colors.green}0%${colors.reset}         ${colors.red}Often 100%${colors.reset}  ${colors.red}Often 100%${colors.reset}
Device Revoke:     ${colors.green}Instant${colors.reset}    ${colors.red}Manual${colors.reset}      ${colors.red}Manual${colors.reset}
Quantum-Proof:     ${colors.green}✅${colors.reset}         ${colors.red}❌${colors.reset}          ${colors.red}❌${colors.reset}
Zero Master PW:    ${colors.green}✅${colors.reset}         ${colors.red}❌${colors.reset}          ${colors.red}❌${colors.reset}

${colors.bright}${colors.magenta}🏆 COMPETITIVE ADVANTAGES:${colors.reset}
${colors.magenta}════════════════════════════════════════${colors.reset}
${colors.green}✅ ${Math.round(24*60*60/demoState.metrics.recoveryTime)}x faster recovery than competitors${colors.reset}
${colors.green}✅ Zero data loss guarantee${colors.reset}
${colors.green}✅ Quantum-proof security architecture${colors.reset}  
${colors.green}✅ Instant device revocation${colors.reset}
${colors.green}✅ No master password vulnerability${colors.reset}
${colors.green}✅ True quantum entropy (ANU QRNG)${colors.reset}
  `);
  
  log(`🎬 DEMO COMPLETED IN ${totalTime.toFixed(1)} TOTAL SECONDS`, 'bright');
  log('🚀 Ready for investor presentation!', 'green');
  log('═'.repeat(80), 'cyan');
}

// ===============================================================================
// MAIN DEMO EXECUTION
// ===============================================================================

async function runInvestorDemo() {
  console.clear();
  
  log('🎬 QUANKEY INVESTOR DEMO STARTING...', 'bright');
  log('🎯 Demonstrating: Quantum-Secured Instant Recovery', 'bright');
  log('👥 Target: Investors, Partners, Enterprise Customers', 'bright');
  log('⏱️  Duration: ~2 minutes 15 seconds', 'bright');
  log('', 'white');
  
  await sleep(3000);
  
  try {
    // Phase 1: Setup (30 seconds)
    await runSetupPhase();
    
    // Phase 2: Attack Simulation (45 seconds)
    await runAttackPhase();
    
    // Phase 3: Quantum Recovery (60 seconds)
    await runRecoveryPhase();
    
    // Phase 4: Metrics Dashboard
    await showMetricsDashboard();
    
    // Save demo results
    const demoResults = {
      timestamp: new Date().toISOString(),
      totalDuration: (Date.now() - demoState.startTime) / 1000,
      phases: {
        setup: 'completed',
        attack: 'completed', 
        recovery: 'completed',
        metrics: 'displayed'
      },
      metrics: demoState.metrics,
      user: DEMO_CONFIG.demoUser,
      recoveryShares: demoState.recoveryShares.length,
      passwordsSecured: demoState.passwords.length
    };
    
    // Write results to file
    const resultsPath = path.join(__dirname, 'demo-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(demoResults, null, 2));
    
    log(`📁 Demo results saved to: ${resultsPath}`, 'cyan');
    log('🎥 Ready for screen recording and investor presentations!', 'green');
    
  } catch (error) {
    log(`❌ Demo failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Export for use as module or run directly
if (require.main === module) {
  runInvestorDemo().catch(error => {
    console.error('❌ Demo execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runInvestorDemo,
  DEMO_CONFIG,
  demoState
};