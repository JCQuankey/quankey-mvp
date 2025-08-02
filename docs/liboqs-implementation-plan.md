# 🔬 libOQS Real Implementation Plan - Week 3-4

**Created:** 02 Agosto 2025  
**Priority:** P0A - PQC Hybrid Critical Gap Resolution  
**Timeline:** Week 3-4 of Phase 1 Product Excellence  
**Goal:** Replace ECDSA + ML-DSA simulation with real post-quantum cryptography

---

## 🎯 Executive Summary

**Current State**: Quankey uses ECDSA-P256 + ML-DSA-65 **simulation** for hybrid credentials  
**Target State**: Real Kyber-768 + Dilithium-3 implementation via libOQS v0.12.0  
**Business Impact**: Eliminates quantum vulnerability identified by investor feedback  
**Technical Complexity**: High - C library integration with Node.js backend

---

## 📋 Implementation Strategy

### **Phase A: libOQS Windows Setup (Week 3)**
1. **Environment Setup**: CMake + Visual Studio build tools
2. **Library Compilation**: Build libOQS as shared DLL with ML-KEM/ML-DSA 
3. **Node.js Integration**: FFI-NAPI bindings for backend API calls
4. **Basic Testing**: Verify algorithm availability and basic functionality

### **Phase B: Kyber-768 Integration (Week 4)**
1. **Key Encapsulation**: Replace AES-GCM-SIV with ML-KEM-768 (FIPS 203 final)
2. **Vault Encryption**: Hybrid password storage with post-quantum protection
3. **Performance Testing**: Benchmark encryption/decryption overhead
4. **Migration Path**: Backwards compatibility with existing ECDSA vaults

### **Phase C: Dilithium-3 Signatures (Week 4)**
1. **Digital Signatures**: Replace ECDSA with ML-DSA-65 (FIPS 204 final)
2. **WebAuthn Hybrid**: True hybrid biometric + post-quantum authentication
3. **Integrity Verification**: PQC signatures for vault and recovery data
4. **NIST KAT Validation**: Known Answer Tests for compliance proof

---

## 🔧 Technical Architecture

### **libOQS Version Requirements**
- **Target Version**: v0.12.0 (December 2024) - Latest with FIPS final standards
- **Algorithms**: ML-KEM-768 (Kyber replacement) + ML-DSA-65 (Dilithium replacement)
- **Platform**: Windows x86_64 with Visual Studio compiler
- **Output**: Shared library (DLL) for Node.js FFI integration

### **Windows Build Configuration**
```bash
# Prerequisites
Visual Studio 2019+ with C++ tools
CMake 3.16+
Python 3.8+ (for testing)
Git

# Build commands
git clone https://github.com/open-quantum-safe/liboqs.git
cd liboqs
mkdir build && cd build

# Configure for Windows DLL
cmake .. -DBUILD_SHARED_LIBS=ON -DOQS_ENABLE_KEM_BIKE=OFF -DCMAKE_BUILD_TYPE=Release

# Build with MSBuild
msbuild ALL_BUILD.vcxproj /p:Configuration=Release
msbuild INSTALL.vcxproj /p:Configuration=Release
```

### **Node.js Integration Options**

#### **Option 1: FFI-NAPI (Recommended)**
```javascript
// Pros: No compilation, direct DLL calls, fastest development
// Cons: Manual memory management, potential stability issues

const ffi = require('ffi-napi');
const ref = require('ref-napi');

const liboqs = ffi.Library('liboqs.dll', {
  'OQS_KEM_new': ['pointer', ['string']],
  'OQS_KEM_keypair': ['int', ['pointer', 'pointer', 'pointer']],
  'OQS_KEM_encaps': ['int', ['pointer', 'pointer', 'pointer', 'pointer']],
  'OQS_KEM_decaps': ['int', ['pointer', 'pointer', 'pointer', 'pointer']],
  'OQS_SIG_new': ['pointer', ['string']],
  'OQS_SIG_keypair': ['int', ['pointer', 'pointer', 'pointer']],
  'OQS_SIG_sign': ['int', ['pointer', 'pointer', 'pointer', 'pointer', 'size_t', 'pointer']],
  'OQS_SIG_verify': ['int', ['pointer', 'pointer', 'size_t', 'pointer', 'size_t', 'pointer']]
});
```

#### **Option 2: Native Addon with N-API**
```javascript
// Pros: Memory safety, better error handling, production ready
// Cons: Longer development time, C++ knowledge required

// binding.gyp configuration for native addon
{
  "targets": [{
    "target_name": "quankey_pqc",
    "sources": ["src/quankey_pqc.cpp"],
    "include_dirs": ["<!@(node -p \"require('node-addon-api').include\")"],
    "dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
    "libraries": ["-loqs"],
    "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"]
  }]
}
```

### **PQC Service Architecture**

```typescript
// Enhanced PostQuantumService with real libOQS
interface LibOQSInterface {
  // KEM Operations (Kyber-768 → ML-KEM-768)
  kemNew(algorithmName: string): KemContext;
  kemKeypair(kem: KemContext): { publicKey: Buffer, secretKey: Buffer };
  kemEncaps(kem: KemContext, publicKey: Buffer): { ciphertext: Buffer, sharedSecret: Buffer };
  kemDecaps(kem: KemContext, ciphertext: Buffer, secretKey: Buffer): Buffer;
  
  // Signature Operations (Dilithium-3 → ML-DSA-65)
  sigNew(algorithmName: string): SigContext;
  sigKeypair(sig: SigContext): { publicKey: Buffer, secretKey: Buffer };
  sigSign(sig: SigContext, message: Buffer, secretKey: Buffer): Buffer;
  sigVerify(sig: SigContext, message: Buffer, signature: Buffer, publicKey: Buffer): boolean;
}

interface PQCCredential {
  // KEM for encryption
  kemPublicKey: Buffer;      // ML-KEM-768 public key
  kemSecretKey: Buffer;      // ML-KEM-768 secret key (encrypted)
  
  // Signature for integrity
  sigPublicKey: Buffer;      // ML-DSA-65 public key  
  sigSecretKey: Buffer;      // ML-DSA-65 secret key (encrypted)
  
  // Hybrid compatibility
  ecdsaPublicKey?: Buffer;   // Legacy ECDSA for transition period
  ecdsaCredentialId?: string;
  
  // Metadata
  algorithm: 'ML-KEM-768' | 'ML-DSA-65';
  created: Date;
  version: string;
}
```

---

## 🔐 Algorithm Implementation Details

### **ML-KEM-768 (Kyber Replacement)**

**NIST Standard**: FIPS 203 Final (implemented in libOQS v0.12.0)  
**Security Level**: Category 3 (equivalent to AES-192)  
**Key Sizes**:
- Public Key: 1,184 bytes
- Secret Key: 2,400 bytes  
- Ciphertext: 1,088 bytes
- Shared Secret: 32 bytes

**Use Cases in Quankey**:
- **Password Vault Encryption**: Replace AES-GCM-SIV with hybrid ML-KEM + AES
- **Session Key Exchange**: Quantum-safe key establishment
- **Cross-device Sync**: Secure key transport between devices

```typescript
class MLKEMService {
  private kemContext: KemContext;
  
  constructor() {
    this.kemContext = liboqs.kemNew('ML-KEM-768');
  }
  
  async generateKeyPair(): Promise<{ publicKey: Buffer, secretKey: Buffer }> {
    return liboqs.kemKeypair(this.kemContext);
  }
  
  async encapsulate(publicKey: Buffer): Promise<{ ciphertext: Buffer, sharedSecret: Buffer }> {
    return liboqs.kemEncaps(this.kemContext, publicKey);
  }
  
  async decapsulate(ciphertext: Buffer, secretKey: Buffer): Promise<Buffer> {
    return liboqs.kemDecaps(this.kemContext, ciphertext, secretKey);
  }
}
```

### **ML-DSA-65 (Dilithium Replacement)**

**NIST Standard**: FIPS 204 Final (implemented in libOQS v0.12.0)  
**Security Level**: Category 3 (equivalent to AES-192)  
**Key Sizes**:
- Public Key: 1,952 bytes
- Secret Key: 4,000 bytes
- Signature: ~3,293 bytes (variable)

**Use Cases in Quankey**:
- **WebAuthn Hybrid**: PQC signatures alongside biometric authentication
- **Vault Integrity**: Digital signatures for encrypted password data
- **Recovery Verification**: Quantum-safe social recovery signatures

```typescript
class MLDSAService {
  private sigContext: SigContext;
  
  constructor() {
    this.sigContext = liboqs.sigNew('ML-DSA-65');
  }
  
  async generateKeyPair(): Promise<{ publicKey: Buffer, secretKey: Buffer }> {
    return liboqs.sigKeypair(this.sigContext);
  }
  
  async sign(message: Buffer, secretKey: Buffer): Promise<Buffer> {
    return liboqs.sigSign(this.sigContext, message, secretKey);
  }
  
  async verify(message: Buffer, signature: Buffer, publicKey: Buffer): Promise<boolean> {
    return liboqs.sigVerify(this.sigContext, message, signature, publicKey);
  }
}
```

---

## 🚀 Integration Roadmap

### **Week 3: Foundation Setup**

#### **Day 1-2: Environment Setup**
- [ ] Install Visual Studio 2019+ with C++ tools
- [ ] Install CMake 3.16+ and configure PATH
- [ ] Clone libOQS repository and verify Windows build
- [ ] Create dedicated PQC development branch

#### **Day 3-4: libOQS Compilation**
- [ ] Build libOQS with ML-KEM/ML-DSA enabled
- [ ] Generate liboqs.dll shared library
- [ ] Test algorithm availability and basic functionality
- [ ] Document build process and dependencies

#### **Day 5-7: Node.js Integration**
- [ ] Install ffi-napi and dependencies
- [ ] Create libOQS FFI wrapper module
- [ ] Test basic key generation and encryption
- [ ] Implement error handling and memory management

### **Week 4: Algorithm Implementation**

#### **Day 1-3: ML-KEM-768 Integration**
- [ ] Replace password vault AES-GCM-SIV with hybrid ML-KEM
- [ ] Implement key encapsulation for session management
- [ ] Add backwards compatibility for existing ECDSA vaults
- [ ] Performance testing and optimization

#### **Day 4-5: ML-DSA-65 Integration**
- [ ] Replace WebAuthn ECDSA signatures with ML-DSA
- [ ] Implement vault integrity verification
- [ ] Update recovery system with PQC signatures
- [ ] Test hybrid biometric + PQC authentication

#### **Day 6-7: Testing and Validation**
- [ ] NIST Known Answer Tests (KAT) implementation
- [ ] Performance benchmarking vs classical algorithms
- [ ] Security validation and penetration testing
- [ ] Documentation and deployment preparation

---

## 📊 Success Metrics

### **Technical Metrics**
- **Algorithm Compliance**: 100% NIST FIPS 203/204 compatibility
- **Performance Overhead**: <500ms additional latency for PQC operations
- **Memory Usage**: <50MB increase for libOQS integration
- **Backwards Compatibility**: 100% existing vault migration support

### **Security Metrics**
- **Quantum Resistance**: Protection against Shor's and Grover's algorithms
- **Classical Security**: Equivalent to AES-192 security level
- **Standard Compliance**: NIST Post-Quantum Cryptography approved
- **KAT Validation**: Pass all official test vectors

### **Business Metrics**
- **Investor Confidence**: Eliminate quantum vulnerability red flag
- **Competitive Advantage**: First password manager with NIST PQC
- **Market Positioning**: Quantum-ready for enterprise customers
- **Certification Readiness**: Foundation for SOC 2 + pen-testing

---

## ⚠️ Risk Analysis

### **High Risk - Technical Complexity**
- **C Library Integration**: FFI stability and memory management
- **Windows Compatibility**: Build tools and DLL dependencies
- **Performance Impact**: Large key sizes and computation overhead

**Mitigation**: 
- Extensive testing with automated CI/CD
- Fallback to classical algorithms if PQC fails
- Performance monitoring and optimization

### **Medium Risk - Algorithm Migration**
- **Backwards Compatibility**: Existing vaults use ECDSA
- **Data Migration**: Seamless upgrade from classical to PQC
- **User Experience**: Transparent transition without interruption

**Mitigation**:
- Hybrid period supporting both classical and PQC
- Gradual migration with user consent
- Comprehensive testing with existing data

### **Low Risk - Timeline Pressure**
- **2-week Implementation**: Aggressive timeline for complex integration
- **Dependencies**: libOQS compilation and Node.js binding
- **Testing Coverage**: Limited time for comprehensive validation

**Mitigation**:
- Parallel development with simulation fallback
- MVP approach with essential features first
- Extended testing in Phase 2 internal validation

---

## 📝 Next Steps

1. **Immediate Action**: Begin libOQS Windows environment setup
2. **Resource Allocation**: Dedicate Week 3-4 to PQC implementation
3. **Documentation**: Maintain detailed implementation log
4. **Testing Strategy**: Prepare NIST KAT validation framework
5. **Stakeholder Communication**: Update investor on PQC progress

This implementation eliminates the critical quantum vulnerability and establishes Quankey as the first password manager with NIST-approved post-quantum cryptography.

---

*🔐 Quantum-ready cryptography implementation for enterprise-grade security*