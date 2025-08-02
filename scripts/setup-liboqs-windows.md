# 🔧 libOQS Windows Setup Guide

**Date:** 02 Agosto 2025  
**Target**: Windows 11 Development Environment  
**Purpose**: Install and configure libOQS for Quankey PQC implementation

---

## 📋 Prerequisites Checklist

### **Required Software**
- [ ] **Visual Studio 2019+** with C++ development tools
- [ ] **CMake 3.16+** (https://cmake.org/download/)
- [ ] **Git** for repository cloning
- [ ] **Python 3.8+** for testing scripts
- [ ] **Node.js 18+** with npm

### **Environment Variables**
- [ ] `CMAKE_PREFIX_PATH` configured
- [ ] `Path` includes CMake and Visual Studio tools
- [ ] `VCPKG_ROOT` (if using vcpkg for dependencies)

---

## 🛠️ Installation Steps

### **Step 1: Install Prerequisites**

```powershell
# Install Chocolatey (if not already installed)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install required tools
choco install cmake
choco install git
choco install python3
choco install nodejs

# Install Visual Studio Build Tools (if Visual Studio not installed)
choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools"
```

### **Step 2: Clone and Configure libOQS**

```bash
# Navigate to development directory
cd C:\Users\JuanCano\dev

# Clone libOQS repository
git clone https://github.com/open-quantum-safe/liboqs.git
cd liboqs

# Check latest version (should be v0.12.0 or newer)
git tag --sort=-version:refname | head -5
git checkout main  # or specific version tag

# Create build directory
mkdir build
cd build
```

### **Step 3: Configure CMake Build**

```bash
# Configure for shared library (DLL) with Windows optimization
cmake .. -DBUILD_SHARED_LIBS=ON ^
         -DOQS_ENABLE_KEM_BIKE=OFF ^
         -DOQS_ENABLE_SIG_SPHINCS=OFF ^
         -DCMAKE_BUILD_TYPE=Release ^
         -DCMAKE_INSTALL_PREFIX=C:\liboqs ^
         -G "Visual Studio 16 2019" -A x64

# Alternative with Ninja (faster builds)
cmake .. -DBUILD_SHARED_LIBS=ON ^
         -DOQS_ENABLE_KEM_BIKE=OFF ^
         -DOQS_ENABLE_SIG_SPHINCS=OFF ^
         -DCMAKE_BUILD_TYPE=Release ^
         -DCMAKE_INSTALL_PREFIX=C:\liboqs ^
         -GNinja
```

### **Step 4: Build libOQS**

```bash
# Build with MSBuild (Visual Studio)
msbuild ALL_BUILD.vcxproj /p:Configuration=Release /m

# Build and install
msbuild INSTALL.vcxproj /p:Configuration=Release

# Alternative with Ninja
ninja
ninja install
```

### **Step 5: Verify Installation**

```bash
# Check if DLL was created
dir C:\liboqs\bin\oqs.dll
dir C:\liboqs\lib\oqs.lib

# Test basic functionality
cd C:\liboqs\bin
.\test_kem ML-KEM-768
.\test_sig ML-DSA-65
```

### **Step 6: Install Node.js Dependencies**

```bash
# Navigate to Quankey backend
cd C:\Users\JuanCano\dev\quankey-mvp\backend

# Install FFI dependencies
npm install ffi-napi ref-napi

# For alternative native addon approach
npm install node-gyp cmake-js node-addon-api
```

---

## 🔗 Node.js Integration

### **Option A: FFI-NAPI Integration (Recommended)**

```javascript
// backend/src/config/liboqs-config.js
const path = require('path');

const LIBOQS_CONFIG = {
  libraryPath: process.env.LIBOQS_PATH || 'C:\\liboqs\\bin\\oqs.dll',
  includePath: process.env.LIBOQS_INCLUDE || 'C:\\liboqs\\include',
  enabled: process.env.LIBOQS_ENABLED !== 'false'
};

module.exports = LIBOQS_CONFIG;
```

### **Environment Variables Setup**

```bash
# Add to .env file
LIBOQS_PATH=C:\liboqs\bin\oqs.dll
LIBOQS_INCLUDE=C:\liboqs\include
LIBOQS_ENABLED=true
PATH=%PATH%;C:\liboqs\bin
```

### **Test Integration**

```javascript
// Test script: backend/src/scripts/test-liboqs.js
const { pqcIntegrationService } = require('../services/pqcIntegrationService');

async function testLibOQS() {
  console.log('🧪 Testing libOQS integration...');
  
  if (!pqcIntegrationService.isAvailable()) {
    console.error('❌ libOQS not available');
    return;
  }

  const result = await pqcIntegrationService.runSelfTest();
  console.log(result.success ? '✅ libOQS integration successful' : '❌ Integration failed');
}

testLibOQS();
```

---

## 📊 Algorithm Availability Check

### **Verify ML-KEM and ML-DSA Support**

```bash
# Check available algorithms
cd C:\liboqs\bin

# List KEM algorithms
.\test_kem --list

# List signature algorithms  
.\test_sig --list

# Expected output should include:
# - ML-KEM-512, ML-KEM-768, ML-KEM-1024
# - ML-DSA-44, ML-DSA-65, ML-DSA-87
```

### **Performance Benchmarking**

```bash
# Benchmark ML-KEM-768
.\speed_kem ML-KEM-768

# Benchmark ML-DSA-65
.\speed_sig ML-DSA-65
```

---

## 🚨 Troubleshooting

### **Common Issues and Solutions**

#### **Issue: CMake not found**
```bash
# Solution: Add CMake to PATH
set PATH=%PATH%;C:\Program Files\CMake\bin
```

#### **Issue: Visual Studio compiler not found**
```bash
# Solution: Run from Visual Studio Developer Command Prompt
# Or set environment:
call "C:\Program Files (x86)\Microsoft Visual Studio\2019\Professional\VC\Auxiliary\Build\vcvars64.bat"
```

#### **Issue: DLL not found at runtime**
```bash
# Solution: Copy DLL to working directory or add to PATH
copy C:\liboqs\bin\oqs.dll C:\Users\JuanCano\dev\quankey-mvp\backend\
```

#### **Issue: FFI-NAPI compilation errors**
```bash
# Solution: Install Windows Build Tools
npm install --global --production windows-build-tools
npm install --global node-gyp
```

#### **Issue: Algorithm not available**
```bash
# Solution: Rebuild with specific algorithms enabled
cmake .. -DOQS_ENABLE_KEM_ML_KEM=ON -DOQS_ENABLE_SIG_ML_DSA=ON
```

---

## 🔒 Security Considerations

### **Production Deployment**
- Use Release build configuration for performance
- Enable hardware acceleration if available (AVX2, AES-NI)
- Validate libOQS checksum and signatures
- Regular security updates from Open Quantum Safe project

### **Memory Management**
- Properly free libOQS contexts and buffers
- Use secure memory allocation for sensitive keys
- Implement proper error handling for FFI calls

---

## 📝 Testing and Validation

### **Run NIST KAT Tests**

```bash
# Download official NIST test vectors
curl -O https://csrc.nist.gov/Projects/post-quantum-cryptography/documents/round-3/submissions/Kyber-Round3.zip
curl -O https://csrc.nist.gov/Projects/post-quantum-cryptography/documents/round-3/submissions/CRYSTALS-Dilithium-Round3.zip

# Extract test vectors
unzip Kyber-Round3.zip -d nist-test-vectors/
unzip CRYSTALS-Dilithium-Round3.zip -d nist-test-vectors/

# Run Quankey NIST KAT tests
cd C:\Users\JuanCano\dev\quankey-mvp\backend
npm run test:nist-kat
```

### **Performance Testing**

```bash
# Run performance benchmarks
npm run test:performance

# Expected results (approximate):
# ML-KEM-768 key generation: <50ms
# ML-KEM-768 encapsulation: <10ms
# ML-KEM-768 decapsulation: <10ms
# ML-DSA-65 key generation: <100ms
# ML-DSA-65 signing: <50ms
# ML-DSA-65 verification: <20ms
```

---

## 🎯 Next Steps

1. **Complete Installation**: Follow all steps above
2. **Integration Testing**: Run self-tests and KAT validation
3. **Update PostQuantumService**: Replace simulation with real libOQS calls
4. **Performance Optimization**: Tune for production deployment
5. **Documentation**: Update API documentation with real algorithm specs

---

**✅ Success Criteria:**
- libOQS compiles successfully on Windows
- All required algorithms available (ML-KEM-768, ML-DSA-65)
- Node.js FFI integration working
- NIST KAT tests passing
- Performance within acceptable limits (<500ms overhead)

This completes the foundational setup for real post-quantum cryptography in Quankey! 🔐