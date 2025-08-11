# 🔐 QUANKEY BIOMETRIC IMPLEMENTATION GUIDE

**Version**: 1.0  
**Date**: 11 August 2025  
**Status**: READY FOR IMPLEMENTATION  
**Priority**: CRITICAL - Replace ALL password infrastructure

---

## 🎯 OBJECTIVE

Transform Quankey from password-based to **TRUE passwordless quantum-biometric identity** where your body IS your access.

---

## 📋 PHASE 1: REMOVE ALL PASSWORD INFRASTRUCTURE (Days 1-7)

### Day 1-2: Frontend Password Elimination

```typescript
// ❌ REMOVE from all components:
<input type="password" />
<PasswordField />
<PasswordStrengthMeter />
<ForgotPassword />
<ResetPassword />
<ChangePassword />

// ✅ REPLACE with:
<BiometricRegistration />
<BiometricLogin />
<MultiDeviceSetup />
```

### Day 3-4: Database Schema Migration

```sql
-- Migration: remove_all_password_columns.sql
ALTER TABLE users 
  DROP COLUMN password_hash,
  DROP COLUMN password_salt,
  DROP COLUMN password_reset_token,
  DROP COLUMN password_updated_at,
  DROP COLUMN recovery_code,
  ADD COLUMN quantum_public_key BYTEA,
  ADD COLUMN biometric_registered BOOLEAN DEFAULT FALSE;
```

### Day 5-7: Backend Password Code Removal

```typescript
// ❌ DELETE these files/functions:
src/services/PasswordService.ts
src/utils/passwordValidation.ts
src/routes/password-reset.ts
src/middleware/passwordCheck.ts

// ✅ CREATE these files:
src/services/QuantumBiometricService.ts
src/services/WebAuthnRealService.ts
src/routes/biometric-auth.ts
src/middleware/biometricVerification.ts
```

---

## 🔬 PHASE 2: IMPLEMENT QUANTUM-BIOMETRIC CORE (Days 8-14)

### Day 8-10: WebAuthn REAL Implementation

```typescript
// src/services/WebAuthnRealService.ts
import { 
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';

export class WebAuthnRealService {
  async registerBiometric(username: string): Promise<RegistrationOptions> {
    const options = await generateRegistrationOptions({
      rpName: 'Quankey',
      rpID: 'quankey.xyz',
      userID: username,
      userName: username,
      userDisplayName: username,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required'
      },
      attestationType: 'direct'
    });
    
    // Store challenge for verification
    await this.storeChallenge(username, options.challenge);
    
    return options;
  }
  
  async verifyBiometric(
    username: string,
    credential: AuthenticatorAttestationResponse
  ): Promise<QuantumIdentity> {
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: await this.getChallenge(username),
      expectedOrigin: 'https://quankey.xyz',
      expectedRPID: 'quankey.xyz'
    });
    
    if (!verification.verified) {
      throw new Error('Biometric verification failed');
    }
    
    // Derive quantum key from credential
    const quantumKey = await this.deriveQuantumKey(credential);
    
    return this.createQuantumIdentity(username, quantumKey);
  }
}
```

### Day 11-12: Quantum Key Derivation

```typescript
// src/services/QuantumKeyDerivation.ts
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';

export class QuantumKeyDerivation {
  private readonly QUANKEY_SALT = process.env.QUANTUM_SALT!;
  
  async deriveFromBiometric(
    credentialPublicKey: ArrayBuffer
  ): Promise<QuantumKeyPair> {
    // 1. Hash the credential to create seed
    const biometricHash = await this.hashCredential(credentialPublicKey);
    
    // 2. Derive quantum seed with high iterations
    const quantumSeed = await this.pbkdf2(
      biometricHash,
      this.QUANKEY_SALT,
      1000000 // 1 million iterations
    );
    
    // 3. Generate ML-KEM-768 keypair
    const kemKeys = ml_kem768.keygen(quantumSeed);
    
    // 4. Generate ML-DSA-65 signing keys
    const dsaKeys = ml_dsa65.keygen(quantumSeed);
    
    return {
      encryptionKeys: kemKeys,
      signingKeys: dsaKeys,
      algorithm: 'ML-KEM-768 + ML-DSA-65'
    };
  }
  
  async encryptForStorage(publicKey: Uint8Array): Promise<Uint8Array> {
    // Quantum-encrypt the public key before storage
    const serverKEM = ml_kem768.keygen();
    const { ciphertext, sharedSecret } = ml_kem768.encapsulate(
      serverKEM.publicKey
    );
    
    // Use shared secret to encrypt the user's public key
    const encrypted = await this.aesGcmEncrypt(publicKey, sharedSecret);
    
    return new Uint8Array([...ciphertext, ...encrypted]);
  }
}
```

### Day 13-14: Zero-Knowledge Proof Implementation

```typescript
// src/services/ZeroKnowledgeAuth.ts
export class ZeroKnowledgeAuth {
  async generateProof(
    assertion: AuthenticatorAssertionResponse,
    challenge: string
  ): Promise<ZKProof> {
    // Generate ZK proof that proves ownership without revealing biometric
    const proof = {
      commitment: await this.commit(assertion.signature),
      challenge: await this.hash(challenge),
      response: await this.respond(assertion, challenge)
    };
    
    return proof;
  }
  
  async verifyProof(
    proof: ZKProof,
    storedPublicKey: Uint8Array
  ): Promise<boolean> {
    // Verify the proof without seeing the actual biometric
    const valid = await this.verifyCommitment(
      proof.commitment,
      proof.challenge,
      proof.response,
      storedPublicKey
    );
    
    return valid;
  }
}
```

---

## 🔄 PHASE 3: MULTI-DEVICE QUANTUM BRIDGE (Days 15-21)

### Day 15-17: QR Bridge System

```typescript
// src/services/QuantumBridge.ts
export class QuantumBridge {
  async createBridge(
    authToken: string,
    newDeviceInfo: DeviceInfo
  ): Promise<BridgeToken> {
    // 1. Verify existing device authentication
    const identity = await this.verifyAuthToken(authToken);
    
    // 2. Generate temporal quantum bridge (60 seconds)
    const bridge = {
      id: generateSecureId(),
      identityId: identity.id,
      newDeviceFingerprint: newDeviceInfo.fingerprint,
      challenge: await this.generateQuantumChallenge(),
      expiresAt: Date.now() + 60000 // 60 seconds
    };
    
    // 3. Store bridge temporarily
    await this.redis.setex(
      `bridge:${bridge.id}`,
      60,
      JSON.stringify(bridge)
    );
    
    // 4. Generate QR code
    const qrData = {
      bridgeId: bridge.id,
      challenge: bridge.challenge,
      endpoint: 'https://quankey.xyz/bridge'
    };
    
    return {
      qrCode: await this.generateQR(qrData),
      bridgeId: bridge.id
    };
  }
  
  async completeBridge(
    bridgeId: string,
    newCredential: AuthenticatorAttestationResponse
  ): Promise<boolean> {
    // 1. Retrieve bridge
    const bridge = await this.redis.get(`bridge:${bridgeId}`);
    if (!bridge) throw new Error('Bridge expired');
    
    // 2. Verify new device credential
    const verified = await this.verifyCredential(
      newCredential,
      bridge.challenge
    );
    
    if (!verified) throw new Error('Invalid credential');
    
    // 3. Link devices
    await this.linkDevices(
      bridge.identityId,
      bridge.newDeviceFingerprint,
      newCredential.publicKey
    );
    
    // 4. Clean up bridge
    await this.redis.del(`bridge:${bridgeId}`);
    
    return true;
  }
}
```

### Day 18-19: Device Fingerprinting

```typescript
// src/utils/deviceFingerprint.ts
export class DeviceFingerprint {
  async generate(): Promise<string> {
    const components = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: await this.getCanvasFingerprint(),
      webgl: await this.getWebGLFingerprint()
    };
    
    // Generate stable hash
    const fingerprint = await this.hashComponents(components);
    
    return fingerprint;
  }
  
  private async getCanvasFingerprint(): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Draw unique pattern
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Quankey Quantum 🔐', 2, 2);
    
    return canvas.toDataURL();
  }
}
```

---

## 🧬 PHASE 4: MULTI-BIOMETRIC ENTERPRISE (Days 22-28)

### Day 22-24: Multi-Biometric Capture

```tsx
// src/components/MultiBiometricSetup.tsx
export const MultiBiometricSetup: React.FC = () => {
  const [biometrics, setBiometrics] = useState({
    fingerprint: null,
    face: null,
    voice: null
  });
  
  const captureFingerprint = async () => {
    const credential = await navigator.credentials.create({
      publicKey: {
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        }
      }
    });
    
    setBiometrics(prev => ({
      ...prev,
      fingerprint: credential
    }));
  };
  
  const captureFace = async () => {
    // Use WebAuthn with platform authenticator (Face ID)
    const credential = await navigator.credentials.create({
      publicKey: {
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        }
      }
    });
    
    setBiometrics(prev => ({
      ...prev,
      face: credential
    }));
  };
  
  const captureVoice = async () => {
    // Voice as additional factor
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const voiceprint = await this.processVoiceprint(stream);
    
    setBiometrics(prev => ({
      ...prev,
      voice: voiceprint
    }));
  };
  
  const registerMultiBiometric = async () => {
    // Create 2-of-3 threshold system
    const shares = await this.createThresholdShares(biometrics, 2, 3);
    
    await api.post('/register/multi-biometric', {
      username,
      shares,
      threshold: 2
    });
  };
  
  return (
    <div className="multi-biometric-setup">
      <h2>Enterprise Multi-Biometric Setup</h2>
      <p>Register 3 biometrics. Any 2 will grant access.</p>
      
      <button onClick={captureFingerprint}>
        {biometrics.fingerprint ? '✅' : '○'} Fingerprint
      </button>
      
      <button onClick={captureFace}>
        {biometrics.face ? '✅' : '○'} Face ID
      </button>
      
      <button onClick={captureVoice}>
        {biometrics.voice ? '✅' : '○'} Voice Print
      </button>
      
      <button 
        onClick={registerMultiBiometric}
        disabled={Object.values(biometrics).filter(Boolean).length < 3}
      >
        Complete Setup
      </button>
    </div>
  );
};
```

### Day 25-26: 2-of-3 Threshold Authentication

```typescript
// src/services/ThresholdAuthentication.ts
import { shamirSplit, shamirCombine } from '@stablelib/shamir';

export class ThresholdAuthentication {
  async createShares(
    identity: QuantumIdentity,
    threshold: number,
    total: number
  ): Promise<BiometricShare[]> {
    // Split the quantum key into shares
    const shares = shamirSplit(
      identity.quantumPrivateKey,
      total,
      threshold
    );
    
    return shares.map((share, index) => ({
      id: generateId(),
      identityId: identity.id,
      shareIndex: index,
      shareData: share,
      biometricType: ['fingerprint', 'face', 'voice'][index]
    }));
  }
  
  async authenticate(
    username: string,
    providedBiometrics: BiometricCredential[]
  ): Promise<AuthToken> {
    // Need at least 2 of 3 biometrics
    if (providedBiometrics.length < 2) {
      throw new Error('At least 2 biometrics required');
    }
    
    // Verify each biometric and collect shares
    const shares = [];
    for (const biometric of providedBiometrics) {
      const verified = await this.verifyBiometric(biometric);
      if (verified) {
        const share = await this.getShare(username, biometric.type);
        shares.push(share);
      }
    }
    
    if (shares.length < 2) {
      throw new Error('Insufficient valid biometrics');
    }
    
    // Reconstruct the quantum key
    const reconstructedKey = shamirCombine(shares);
    
    // Generate auth token
    return this.generateQuantumJWT(username, reconstructedKey);
  }
}
```

---

## 🚀 DEPLOYMENT & TESTING

### Production Deployment Checklist

```bash
# 1. Database migration
npm run migrate:remove-passwords

# 2. Deploy new backend
npm run build
pm2 restart quankey-backend

# 3. Deploy new frontend
npm run build:frontend
pm2 restart quankey-frontend

# 4. Verify WebAuthn
curl https://quankey.xyz/api/biometric/test

# 5. Monitor logs
pm2 logs --lines 100
```

### Testing Script

```typescript
// test/biometric-e2e.test.ts
describe('Quantum Biometric Identity', () => {
  it('should register with fingerprint only', async () => {
    const result = await registerBiometric('testuser');
    expect(result.quantum).toBe(true);
    expect(result.passwordRequired).toBe(false);
  });
  
  it('should login with biometric', async () => {
    const token = await loginBiometric('testuser');
    expect(token).toBeDefined();
    expect(jwt.decode(token).quantum).toBe(true);
  });
  
  it('should add new device via QR bridge', async () => {
    const bridge = await createDeviceBridge();
    const result = await completeBridge(bridge.id);
    expect(result.devices).toBe(2);
  });
  
  it('should recover with 2 of 3 biometrics', async () => {
    const result = await authenticateMultiBiometric([
      'fingerprint',
      'face'
      // voice not provided
    ]);
    expect(result.authenticated).toBe(true);
  });
});
```

---

## ⚠️ CRITICAL REMINDERS

### DO NOT:
- ❌ Keep ANY password code
- ❌ Use ANY biometric simulation
- ❌ Store ANY recovery codes
- ❌ Implement ANY password fallback
- ❌ Allow ANY non-biometric registration

### ALWAYS:
- ✅ Use platform authenticators only
- ✅ Require user verification
- ✅ Encrypt public keys with ML-KEM-768
- ✅ Implement zero-knowledge proofs
- ✅ Use 2-of-3 for enterprise

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

**Issue: "Biometric not available"**
```javascript
// Solution: Check platform support
if (!window.PublicKeyCredential) {
  // Fallback to... NOTHING. No passwords!
  showError("This device doesn't support biometric authentication");
}
```

**Issue: "Lost all devices"**
```javascript
// Solution: Multi-biometric recovery
// If user registered 3 biometrics, any 2 work
// If only 1 biometric registered, they need the QR bridge from support
```

**Issue: "Enterprise compliance"**
```javascript
// Solution: Audit logs with quantum signatures
const auditEntry = {
  action: 'BIOMETRIC_LOGIN',
  user: username,
  timestamp: Date.now(),
  signature: await ml_dsa65.sign(data, serverKey)
};
```

---

## 🎉 SUCCESS CRITERIA

Implementation is complete when:

- ✅ Zero password fields in entire codebase
- ✅ WebAuthn working without simulation
- ✅ ML-KEM-768 key derivation functional
- ✅ QR bridge adds new devices
- ✅ Multi-biometric 2-of-3 working
- ✅ 100 users registered with biometrics
- ✅ Zero password-related support tickets

---

**Welcome to the passwordless future. Your body IS your identity.**

**© 2025 Quankey - Quantum Biometric Identity System**