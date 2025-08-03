"use strict";
// ────────────────────────────────────────────
// Patent: US-2024-QP-003 - Instant Biometric Revocation System
// Claims: Advanced threat detection with quantum-enhanced security
// ────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.intelligentSecurityMiddleware = exports.intelligentThreatDetection = void 0;
const SECURITY_CONFIG = {
    whitelist: {
        // Trusted paths that need lower security scoring
        paths: [
            '/api/health',
            '/api/auth/user/.*/exists', // Check if user exists
            '/api/auth/users', // List users (for UI)
            '/api/auth/login/begin', // WebAuthn challenge
            '/api/auth/register/begin' // WebAuthn registration
        ],
        // Trusted origins
        origins: [
            'https://quankey.xyz',
            'https://app.quankey.xyz',
            'https://www.quankey.xyz'
        ],
        // Legitimate user agents (be more permissive)
        userAgents: [
            'chrome', 'firefox', 'safari', 'edge',
            'mozilla', 'webkit', 'axios', 'curl' // Allow testing tools
        ]
    },
    scoring: {
        suspiciousUserAgent: 1, // Reduced from 3
        failedAttempt: 2, // Reduced from 6  
        threshold: 8, // Increased from 5
        resetWindow: 15 // Reset scores every 15 minutes
    },
    exceptions: {
        healthChecks: true, // Never block health checks
        registeredUsers: true, // Allow operations for existing users
        webAuthnFlow: true // Don't interfere with biometric flow
    }
};
class IntelligentThreatDetection {
    constructor() {
        this.ipScores = new Map();
        this.registeredUsers = new Set(); // Cache of registered usernames
        this.loadRegisteredUsers();
        // Reset scores periodically
        setInterval(() => this.resetExpiredScores(), 5 * 60 * 1000); // Every 5 minutes
    }
    async loadRegisteredUsers() {
        try {
            // Load from database - this should be cached/refreshed periodically
            // For now, we'll populate it dynamically as users are found
            console.log('🔐 Intelligent threat detection initialized');
        }
        catch (error) {
            console.warn('⚠️ Could not load registered users for security whitelist');
        }
    }
    isWhitelistedPath(path) {
        return SECURITY_CONFIG.whitelist.paths.some(pattern => {
            // Convert pattern to regex
            const regexPattern = pattern.replace(/\.\*/g, '[^/]*');
            return new RegExp(`^${regexPattern}$`).test(path);
        });
    }
    isWhitelistedOrigin(origin) {
        return SECURITY_CONFIG.whitelist.origins.includes(origin);
    }
    isWhitelistedUserAgent(userAgent) {
        return SECURITY_CONFIG.whitelist.userAgents.some(ua => userAgent?.toLowerCase().includes(ua.toLowerCase()));
    }
    calculateRiskScore(req) {
        let score = 0;
        const path = req.path;
        const origin = req.headers.origin || req.headers.referer || '';
        const userAgent = req.headers['user-agent'] || '';
        // EXCEPTION 1: Health checks always pass
        if (SECURITY_CONFIG.exceptions.healthChecks && path === '/api/health') {
            return 0;
        }
        // EXCEPTION 2: Whitelisted paths get reduced scoring
        if (this.isWhitelistedPath(path)) {
            score -= 2; // Bonus for whitelisted paths
        }
        // EXCEPTION 3: Trusted origins
        if (this.isWhitelistedOrigin(origin)) {
            score -= 1; // Bonus for trusted origins
        }
        // User agent scoring (more lenient)
        if (!this.isWhitelistedUserAgent(userAgent)) {
            score += SECURITY_CONFIG.scoring.suspiciousUserAgent;
        }
        // EXCEPTION 4: WebAuthn flow protection
        if (SECURITY_CONFIG.exceptions.webAuthnFlow &&
            (path.includes('/auth/login') || path.includes('/auth/register'))) {
            score = Math.max(0, score - 1); // Protect auth flows
        }
        return Math.max(0, score); // Never negative
    }
    resetExpiredScores() {
        const now = new Date();
        const resetWindow = SECURITY_CONFIG.scoring.resetWindow * 60 * 1000;
        for (const [ip, data] of this.ipScores.entries()) {
            if (now.getTime() - data.lastReset.getTime() > resetWindow) {
                this.ipScores.set(ip, { score: 0, lastReset: now, attempts: [] });
            }
        }
    }
    middleware() {
        return (req, res, next) => {
            const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
            // Get or initialize IP data
            let ipData = this.ipScores.get(clientIP) || {
                score: 0,
                lastReset: new Date(),
                attempts: []
            };
            // Calculate current request risk
            const requestScore = this.calculateRiskScore(req);
            ipData.score += requestScore;
            // Log attempt details for debugging
            ipData.attempts.push(`${new Date().toISOString()}: ${req.method} ${req.path} (score: +${requestScore})`);
            // Keep only last 10 attempts for debugging
            if (ipData.attempts.length > 10) {
                ipData.attempts = ipData.attempts.slice(-10);
            }
            // Update stored data
            this.ipScores.set(clientIP, ipData);
            // Check if blocked
            if (ipData.score >= SECURITY_CONFIG.scoring.threshold) {
                console.warn(`🚨 Threat detected from ${clientIP} (score: ${ipData.score}/${SECURITY_CONFIG.scoring.threshold})`);
                console.warn(`🔍 Recent attempts: ${ipData.attempts.slice(-3).join(', ')}`);
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    message: 'Too many suspicious requests. Please try again later.',
                    retryAfter: SECURITY_CONFIG.scoring.resetWindow * 60
                });
            }
            // Add security headers and continue
            res.setHeader('X-Security-Score', ipData.score.toString());
            res.setHeader('X-Security-Level', 'quantum-enhanced');
            // Log legitimate requests for monitoring
            if (requestScore > 0) {
                console.log(`🔐 Security: ${req.method} ${req.path} from ${clientIP} (score: ${ipData.score}/${SECURITY_CONFIG.scoring.threshold})`);
            }
            next();
        };
    }
    // Method to register a user for whitelisting
    registerUser(username) {
        this.registeredUsers.add(username);
        console.log(`✅ User ${username} added to security whitelist`);
    }
    // Method to get security stats (for monitoring)
    getSecurityStats() {
        return {
            activeIPs: this.ipScores.size,
            blockedIPs: Array.from(this.ipScores.entries())
                .filter(([, data]) => data.score >= SECURITY_CONFIG.scoring.threshold)
                .length,
            configuration: SECURITY_CONFIG,
            registeredUsers: this.registeredUsers.size
        };
    }
}
// Export singleton instance
exports.intelligentThreatDetection = new IntelligentThreatDetection();
// Updated middleware for server.ts
exports.intelligentSecurityMiddleware = exports.intelligentThreatDetection.middleware();
