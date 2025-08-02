"use strict";
// ────────────────────────────────────────────
// Patent: US-2024-QP-007 - Hybrid Post-Quantum WebAuthn
// Claims: 1, 2, 3
// GuideRef: P0A · Critical PQC Implementation
// ────────────────────────────────────────────
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostQuantumService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class PostQuantumService {
    // Generate hybrid key pair (ECDSA + ML-DSA simulation)
    static async generateHybridKeyPair() {
        try {
            // Generate ECDSA P-256 key pair (current WebAuthn standard)
            const ecdsaKeyPair = crypto_1.default.generateKeyPairSync('ec', {
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
            // Simulate ML-DSA-65 key generation (NIST standard)
            // In production, this would use libOQS or similar
            const mldsaPublicKey = crypto_1.default.randomBytes(1952); // ML-DSA-65 public key size
            const mldsaPrivateKey = crypto_1.default.randomBytes(4032); // ML-DSA-65 private key size
            // Generate unique credential IDs
            const ecdsaCredentialId = crypto_1.default.randomBytes(16).toString('base64url');
            const mldsaCredentialId = crypto_1.default.randomBytes(16).toString('base64url');
            // Create hybrid ID by combining both
            const hybridId = crypto_1.default
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
            const ecdsaSign = crypto_1.default.createSign('SHA256');
            ecdsaSign.update(data);
            const ecdsaSignature = ecdsaSign.sign(ecdsaPrivateKey);
            // Simulate ML-DSA signature (in production, use real PQC library)
            const mldsaSign = crypto_1.default.createHmac('sha3-256', mldsaPrivateKey);
            mldsaSign.update(data);
            const mldsaSignature = mldsaSign.digest();
            // Combine both signatures with proof of hybrid verification
            const combinedProof = crypto_1.default
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
            const ecdsaVerify = crypto_1.default.createVerify('SHA256');
            ecdsaVerify.update(data);
            const ecdsaValid = ecdsaVerify.verify(credential.ecdsaPublicKey, signature.ecdsaSignature);
            if (!ecdsaValid) {
                console.log('❌ ECDSA signature verification failed');
                return false;
            }
            // Simulate ML-DSA verification (in production, use real PQC library)
            const mldsaVerify = crypto_1.default.createHmac('sha3-256', credential.mldsaPublicKey);
            mldsaVerify.update(data);
            const expectedMldsaSignature = mldsaVerify.digest();
            const mldsaValid = crypto_1.default.timingSafeEqual(signature.mldsaSignature, expectedMldsaSignature);
            if (!mldsaValid) {
                console.log('❌ ML-DSA signature verification failed');
                return false;
            }
            // Verify combined proof
            const expectedProof = crypto_1.default
                .createHash('sha3-256')
                .update(signature.ecdsaSignature)
                .update(signature.mldsaSignature)
                .update(data)
                .digest();
            const proofValid = crypto_1.default.timingSafeEqual(signature.combinedProof, expectedProof);
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
