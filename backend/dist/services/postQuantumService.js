"use strict";
// ────────────────────────────────────────────
// Patent: US-2024-QP-007 - Hybrid Post-Quantum WebAuthn
// Claims: 1, 2, 3
// GuideRef: P0A · Critical PQC Implementation - REAL libOQS Integration
// ────────────────────────────────────────────
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostQuantumService = void 0;
const crypto = __importStar(require("crypto"));
const libOQSBinaryService_1 = require("./libOQSBinaryService");
const libOQSDirectService_1 = require("./libOQSDirectService");
class PostQuantumService {
    // Generate hybrid key pair (ECDSA + REAL ML-DSA via libOQS)
    static async generateHybridKeyPair() {
        try {
            // Generate ECDSA P-256 key pair (current WebAuthn standard)
            const ecdsaKeyPair = crypto.generateKeyPairSync('ec', {
                namedCurve: 'P-256',
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'der'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'der'
                }
            });
            // Generate REAL ML-DSA-65 key pair via libOQS (prioritize Direct service)
            console.log('🔬 Generating ML-DSA-65 key pair via libOQS...');
            let mldsaKeyPair;
            // Try LibOQSDirectService first (most advanced), fallback to binary service
            if (libOQSDirectService_1.libOQSDirectService.isDirectLibraryAvailable()) {
                console.log('🚀 Using LibOQSDirectService (enhanced library detection)');
                mldsaKeyPair = await libOQSDirectService_1.libOQSDirectService.generateSignatureKeyPair();
            }
            else {
                console.log('⚡ Using LibOQSBinaryService (binary execution fallback)');
                mldsaKeyPair = await libOQSBinaryService_1.libOQSBinaryService.generateSignatureKeyPair();
            }
            const mldsaPublicKey = mldsaKeyPair.publicKey;
            const mldsaPrivateKey = mldsaKeyPair.secretKey;
            // Generate unique credential IDs
            const ecdsaCredentialId = crypto.randomBytes(16).toString('base64url');
            const mldsaCredentialId = crypto.randomBytes(16).toString('base64url');
            // Create hybrid ID by combining both
            const hybridId = crypto
                .createHash('sha256')
                .update(ecdsaCredentialId + mldsaCredentialId)
                .digest('base64url');
            return {
                ecdsaPublicKey: ecdsaKeyPair.publicKey,
                ecdsaCredentialId,
                mldsaPublicKey,
                mldsaCredentialId,
                hybridId,
                createdAt: new Date()
            };
        }
        catch (error) {
            console.error('Error generating hybrid key pair:', error);
            throw error;
        }
    }
    // Create hybrid signature (both ECDSA and ML-DSA)
    static async createHybridSignature(data, ecdsaPrivateKey, mldsaPrivateKey) {
        try {
            // Create ECDSA signature
            const ecdsaSign = crypto.createSign('SHA256');
            ecdsaSign.update(data);
            const ecdsaSignature = ecdsaSign.sign(ecdsaPrivateKey);
            // Generate REAL ML-DSA signature via libOQS (prioritize Direct service)
            console.log('🔬 Signing data with ML-DSA-65 via libOQS...');
            let mldsaSignature;
            // Try LibOQSDirectService first (most advanced), fallback to binary service
            if (libOQSDirectService_1.libOQSDirectService.isDirectLibraryAvailable()) {
                console.log('🚀 Using LibOQSDirectService for signing');
                mldsaSignature = await libOQSDirectService_1.libOQSDirectService.signData(data, mldsaPrivateKey);
            }
            else {
                console.log('⚡ Using LibOQSBinaryService for signing');
                mldsaSignature = await libOQSBinaryService_1.libOQSBinaryService.signData(data, mldsaPrivateKey);
            }
            // Combine both signatures with proof of hybrid verification
            const combinedProof = crypto
                .createHash('sha3-256')
                .update(ecdsaSignature)
                .update(mldsaSignature)
                .update(data)
                .digest();
            return {
                ecdsaSignature,
                mldsaSignature,
                combinedProof
            };
        }
        catch (error) {
            console.error('Error creating hybrid signature:', error);
            throw error;
        }
    }
    // Verify hybrid signature (requires both ECDSA and ML-DSA)
    static async verifyHybridSignature(data, signature, credential) {
        try {
            // Verify ECDSA signature
            const ecdsaVerify = crypto.createVerify('SHA256');
            ecdsaVerify.update(data);
            const ecdsaValid = ecdsaVerify.verify(credential.ecdsaPublicKey, signature.ecdsaSignature);
            if (!ecdsaValid) {
                console.log('❌ ECDSA signature verification failed');
                return false;
            }
            // Verify REAL ML-DSA signature via libOQS (prioritize Direct service)
            console.log('🔬 Verifying ML-DSA-65 signature via libOQS...');
            let mldsaValid;
            // Try LibOQSDirectService first (most advanced), fallback to binary service
            if (libOQSDirectService_1.libOQSDirectService.isDirectLibraryAvailable()) {
                console.log('🚀 Using LibOQSDirectService for verification');
                mldsaValid = await libOQSDirectService_1.libOQSDirectService.verifySignature(data, signature.mldsaSignature, credential.mldsaPublicKey);
            }
            else {
                console.log('⚡ Using LibOQSBinaryService for verification');
                mldsaValid = await libOQSBinaryService_1.libOQSBinaryService.verifySignature(data, signature.mldsaSignature, credential.mldsaPublicKey);
            }
            if (!mldsaValid) {
                console.log('❌ ML-DSA signature verification failed');
                return false;
            }
            // Verify combined proof
            const expectedProof = crypto
                .createHash('sha3-256')
                .update(signature.ecdsaSignature)
                .update(signature.mldsaSignature)
                .update(data)
                .digest();
            const proofValid = crypto.timingSafeEqual(signature.combinedProof, expectedProof);
            console.log('✅ Hybrid signature verification passed (ECDSA + ML-DSA)');
            return ecdsaValid && mldsaValid && proofValid;
        }
        catch (error) {
            console.error('Error verifying hybrid signature:', error);
            return false;
        }
    }
    // Prepare for quantum transition
    static async prepareQuantumTransition(currentCredentials) {
        try {
            let migratedCount = 0;
            let vulnerableCount = 0;
            for (const cred of currentCredentials) {
                if (cred.mldsaPublicKey && cred.mldsaCredentialId) {
                    migratedCount++;
                }
                else {
                    vulnerableCount++;
                }
            }
            const readyForQuantum = vulnerableCount === 0 && migratedCount > 0;
            console.log(`🔄 Quantum Transition Status:`);
            console.log(`   - Migrated to hybrid: ${migratedCount}`);
            console.log(`   - Still vulnerable: ${vulnerableCount}`);
            console.log(`   - Ready for quantum: ${readyForQuantum ? '✅' : '❌'}`);
            return {
                readyForQuantum,
                migratedCount,
                vulnerableCount
            };
        }
        catch (error) {
            console.error('Error preparing quantum transition:', error);
            throw error;
        }
    }
    // Get quantum resistance level
    static getQuantumResistanceLevel(credential) {
        if (credential.mldsaPublicKey && credential.ecdsaPublicKey) {
            return 'QUANTUM_RESISTANT';
        }
        else if (credential.ecdsaPublicKey) {
            return 'QUANTUM_VULNERABLE';
        }
        else {
            return 'UNKNOWN';
        }
    }
}
exports.PostQuantumService = PostQuantumService;
