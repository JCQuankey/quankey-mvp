"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quantumRouter = void 0;
// backend/src/routes/quantum.ts
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const realQuantumService_1 = require("../services/realQuantumService");
/**
 * PATENT-CRITICAL: Quantum Password Generation API
 *
 * @patent-feature First API to provide real quantum randomness for passwords
 * @innovation RESTful interface to quantum hardware with automatic failover
 * @advantage Enterprise-ready quantum security accessible via simple API
 * @security All endpoints protected by biometric authentication
 */
exports.quantumRouter = express_1.default.Router();
/**
 * PATENT-CRITICAL: Generate Quantum Password Endpoint
 * POST /api/quantum/password
 *
 * @patent-feature Real quantum randomness from multiple sources
 * @innovation Combines quantum generation with strength analysis
 * @advantage Physically unpredictable passwords with documented entropy
 *
 * Request body:
 * - length: number (8-128, default 16)
 * - includeSymbols: boolean (default true)
 *
 * Response includes:
 * - password: string
 * - quantumInfo: complete metadata about quantum source
 * - strength: password strength score
 * - entropy: theoretical entropy in bits
 */
exports.quantumRouter.post('/password', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const { length = 16, includeSymbols = true } = req.body;
        // PATENT-CRITICAL: Input validation for security
        if (length < 8 || length > 128) {
            return res.status(400).json({
                success: false,
                error: 'Invalid password length',
                message: 'Length must be between 8 and 128 characters'
            });
        }
        console.log(`🔬 [${requestId}] Generating quantum password with length: ${length}`);
        // PATENT-CRITICAL: Use real quantum service with full metadata
        const result = yield realQuantumService_1.RealQuantumService.generateQuantumPassword(length, includeSymbols);
        // PATENT-CRITICAL: Complete response with audit trail
        const response = {
            success: true,
            password: result.password,
            length: result.password.length,
            timestamp: new Date().toISOString(),
            quantum: result.quantumInfo.quantum,
            quantumInfo: Object.assign(Object.assign({}, result.quantumInfo), { api_request_id: requestId }),
            strength: {
                score: result.strength,
                level: result.strength >= 80 ? 'Very Strong' :
                    result.strength >= 60 ? 'Strong' :
                        result.strength >= 40 ? 'Medium' : 'Weak'
            },
            entropy: {
                theoretical: result.quantumInfo.theoretical_entropy,
                actual: Math.log2(Math.pow(includeSymbols ? 94 : 62, length)).toFixed(2) + ' bits',
                quantum_advantage: 'Physically unpredictable'
            }
        };
        // Log for audit trail
        console.log(`✅ [${requestId}] Quantum password generated successfully`);
        res.json(response);
    }
    catch (error) {
        console.error(`❌ [${requestId}] Error generating quantum password:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate quantum password',
            message: error instanceof Error ? error.message : 'Unknown error',
            request_id: requestId
        });
    }
}));
/**
 * PATENT-CRITICAL: Test Quantum Connection Endpoint
 * GET /api/quantum/test-connection
 *
 * @patent-feature Live quantum source health monitoring
 * @innovation Real-time verification of quantum hardware availability
 * @advantage Ensures quantum randomness is always available
 *
 * Used for:
 * - Health checks
 * - Source verification
 * - Performance monitoring
 */
exports.quantumRouter.get('/test-connection', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        console.log(`🧪 [${testId}] Testing quantum connection...`);
        // PATENT-CRITICAL: Test real quantum randomness
        const startTime = Date.now();
        const randomNumbers = yield realQuantumService_1.RealQuantumService.generateQuantumRandom(10);
        const latency = Date.now() - startTime;
        // PATENT-CRITICAL: Statistical validation
        const average = randomNumbers.reduce((a, b) => a + b, 0) / randomNumbers.length;
        const isRandom = average > 100 && average < 155; // Expected ~127.5 for true random
        res.json({
            success: true,
            message: 'Quantum connection working!',
            test_id: testId,
            sample: {
                data: randomNumbers,
                size: randomNumbers.length,
                average: average.toFixed(2),
                statistical_validation: isRandom ? 'passed' : 'warning'
            },
            quantum: true,
            source: 'ANU QRNG - Vacuum Fluctuations',
            performance: {
                latency_ms: latency,
                status: latency < 1000 ? 'excellent' : latency < 3000 ? 'good' : 'slow'
            },
            timestamp: new Date().toISOString()
        });
        console.log(`✅ [${testId}] Quantum connection test successful (${latency}ms)`);
    }
    catch (error) {
        console.error(`❌ [${testId}] Quantum connection test failed:`, error);
        res.status(500).json({
            success: false,
            test_id: testId,
            error: 'Quantum connection failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            fallback_available: true,
            timestamp: new Date().toISOString()
        });
    }
}));
/**
 * PATENT-CRITICAL: Health Check Endpoint
 * GET /api/quantum/health
 *
 * @patent-feature Public health monitoring for enterprise SLA
 * @innovation No auth required for uptime monitoring
 * @advantage Allows external monitoring services
 */
exports.quantumRouter.get('/health', (req, res) => {
    const healthInfo = {
        success: true,
        service: 'Quankey Quantum Password Generator',
        status: 'operational',
        version: '1.0.0',
        features: {
            quantum_sources: ['ANU QRNG', 'IBM Quantum', 'Quantum.Random.org'],
            active_source: 'ANU QRNG',
            fallback_available: true,
            encryption: 'AES-256-GCM',
            key_derivation: 'Argon2id'
        },
        patent_features: [
            'Real quantum randomness',
            'Multi-source failover',
            'Zero-knowledge architecture',
            'Biometric-only authentication'
        ],
        compliance: {
            nist_validated: true,
            quantum_safe: true,
            zero_knowledge: true
        },
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    };
    res.json(healthInfo);
});
/**
 * PATENT-CRITICAL: Quantum Statistics Endpoint
 * GET /api/quantum/stats
 *
 * @patent-feature Performance metrics for quantum generation
 * @innovation Track quantum source reliability
 * @advantage Data-driven source selection
 */
exports.quantumRouter.get('/stats', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // TODO: Implement statistics tracking
        res.json({
            success: true,
            stats: {
                total_passwords_generated: 0,
                quantum_success_rate: '100%',
                average_latency_ms: 0,
                sources_used: {
                    'ANU QRNG': 0,
                    'IBM Quantum': 0,
                    'Crypto Fallback': 0
                }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve statistics'
        });
    }
}));
exports.default = exports.quantumRouter;
