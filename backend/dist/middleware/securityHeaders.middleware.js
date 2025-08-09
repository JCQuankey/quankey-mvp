"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = exports.SecurityHeadersMiddleware = void 0;
const auditLogger_service_1 = require("../services/auditLogger.service");
/**
 * 🔒 COMPREHENSIVE SECURITY HEADERS MIDDLEWARE
 * Military-grade HTTP security headers for Quankey
 * Implements all security headers required by the testing suite
 */
class SecurityHeadersMiddleware {
    /**
     * 🛡️ APPLY ALL SECURITY HEADERS
     */
    static applyHeaders(req, res, next) {
        try {
            // 1. Content Security Policy
            const csp = SecurityHeadersMiddleware.buildCSP();
            res.setHeader('Content-Security-Policy', csp);
            // 2. X-Frame-Options (Clickjacking Protection)
            res.setHeader('X-Frame-Options', 'DENY');
            // 3. X-Content-Type-Options (MIME Sniffing Protection)
            res.setHeader('X-Content-Type-Options', 'nosniff');
            // 4. X-XSS-Protection (Legacy XSS Filter)
            res.setHeader('X-XSS-Protection', '1; mode=block');
            // 5. Strict Transport Security (HSTS)
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
            // 6. Referrer Policy
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            // 7. Permissions Policy (Feature Policy)
            const permissionsPolicy = SecurityHeadersMiddleware.buildPermissionsPolicy();
            res.setHeader('Permissions-Policy', permissionsPolicy);
            // 8. Cross-Origin-Embedder-Policy
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            // 9. Cross-Origin-Opener-Policy
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            // 10. Cross-Origin-Resource-Policy
            res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
            // 11. Remove Server Information (Security by Obscurity)
            res.removeHeader('Server');
            res.removeHeader('X-Powered-By');
            // 12. Cache Control for Sensitive Pages
            if (SecurityHeadersMiddleware.isSensitivePath(req.path)) {
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            }
            // 13. CSRF Protection Headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
            // 14. Security Reporting
            if (process.env.CSP_REPORT_URI) {
                res.setHeader('Report-To', JSON.stringify({
                    group: 'csp-endpoint',
                    max_age: 31536000,
                    endpoints: [{ url: process.env.CSP_REPORT_URI }]
                }));
            }
            // 15. Custom Quankey Security Headers
            res.setHeader('X-Quankey-Security', 'military-grade');
            res.setHeader('X-Quantum-Protected', 'ML-KEM-768,ML-DSA-65');
            next();
        }
        catch (error) {
            SecurityHeadersMiddleware.auditLogger.logSecurityEvent({
                type: 'SECURITY_HEADERS_ERROR',
                userId: req.user?.id || 'anonymous',
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: `${req.method} ${req.path}`,
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
                severity: 'high'
            });
            // Don't fail the request, but log the error
            next();
        }
    }
    /**
     * 🔐 BUILD CONTENT SECURITY POLICY
     */
    static buildCSP() {
        const csp = SecurityHeadersMiddleware.SECURITY_CONFIG.CONTENT_SECURITY_POLICY;
        const directives = [];
        for (const [directive, values] of Object.entries(csp)) {
            if (directive === 'upgrade-insecure-requests' && values === true) {
                directives.push(directive);
            }
            else if (Array.isArray(values)) {
                if (values.length > 0) {
                    directives.push(`${directive} ${values.join(' ')}`);
                }
                else {
                    directives.push(`${directive} 'none'`);
                }
            }
        }
        // Add nonce for inline scripts if needed
        const nonce = SecurityHeadersMiddleware.generateNonce();
        const cspWithNonce = directives.join('; ').replace("'strict-dynamic'", `'nonce-${nonce}' 'strict-dynamic'`);
        return cspWithNonce;
    }
    /**
     * 🔧 BUILD PERMISSIONS POLICY
     */
    static buildPermissionsPolicy() {
        const permissions = SecurityHeadersMiddleware.SECURITY_CONFIG.PERMISSIONS_POLICY;
        const policies = [];
        for (const [feature, allowList] of Object.entries(permissions)) {
            if (allowList.length === 0) {
                policies.push(`${feature}=()`);
            }
            else {
                const origins = allowList.map(origin => origin === 'self' ? 'self' : `"${origin}"`);
                policies.push(`${feature}=(${origins.join(' ')})`);
            }
        }
        return policies.join(', ');
    }
    /**
     * 🔍 CHECK IF PATH IS SENSITIVE
     */
    static isSensitivePath(path) {
        const sensitivePaths = [
            '/api/auth',
            '/api/vault',
            '/api/quantum',
            '/app/vault',
            '/settings',
            '/profile'
        ];
        return sensitivePaths.some(sensitivePath => path.startsWith(sensitivePath));
    }
    /**
     * 🎲 GENERATE CSP NONCE
     */
    static generateNonce() {
        const crypto = require('crypto');
        return crypto.randomBytes(16).toString('base64');
    }
    /**
     * 📊 SECURITY HEADERS STATUS
     */
    static getHeadersStatus(req, res) {
        const headers = {
            'Content-Security-Policy': res.getHeader('Content-Security-Policy'),
            'X-Frame-Options': res.getHeader('X-Frame-Options'),
            'X-Content-Type-Options': res.getHeader('X-Content-Type-Options'),
            'X-XSS-Protection': res.getHeader('X-XSS-Protection'),
            'Strict-Transport-Security': res.getHeader('Strict-Transport-Security'),
            'Referrer-Policy': res.getHeader('Referrer-Policy'),
            'Permissions-Policy': res.getHeader('Permissions-Policy'),
            'Cross-Origin-Embedder-Policy': res.getHeader('Cross-Origin-Embedder-Policy'),
            'Cross-Origin-Opener-Policy': res.getHeader('Cross-Origin-Opener-Policy'),
            'Cross-Origin-Resource-Policy': res.getHeader('Cross-Origin-Resource-Policy')
        };
        const status = {
            headers_applied: Object.keys(headers).length,
            security_level: 'military-grade',
            csp_enabled: !!headers['Content-Security-Policy'],
            hsts_enabled: !!headers['Strict-Transport-Security'],
            clickjacking_protection: headers['X-Frame-Options'] === 'DENY',
            xss_protection: !!headers['X-XSS-Protection'],
            mime_sniffing_blocked: headers['X-Content-Type-Options'] === 'nosniff',
            quantum_headers: {
                'X-Quankey-Security': res.getHeader('X-Quankey-Security'),
                'X-Quantum-Protected': res.getHeader('X-Quantum-Protected')
            },
            timestamp: new Date().toISOString()
        };
        res.json({
            success: true,
            data: status,
            message: 'Security headers status retrieved'
        });
    }
    /**
     * 🔬 VALIDATE SECURITY HEADERS
     */
    static validateHeaders(req, res, next) {
        try {
            const requiredHeaders = [
                'X-Frame-Options',
                'X-Content-Type-Options',
                'X-XSS-Protection',
                'Strict-Transport-Security',
                'Content-Security-Policy'
            ];
            const missingHeaders = [];
            for (const header of requiredHeaders) {
                if (!res.getHeader(header)) {
                    missingHeaders.push(header);
                }
            }
            if (missingHeaders.length > 0) {
                SecurityHeadersMiddleware.auditLogger.logSecurityEvent({
                    type: 'MISSING_SECURITY_HEADERS',
                    userId: req.user?.id || 'anonymous',
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    endpoint: `${req.method} ${req.path}`,
                    details: { missingHeaders },
                    severity: 'medium'
                });
            }
            next();
        }
        catch (error) {
            SecurityHeadersMiddleware.auditLogger.logSecurityEvent({
                type: 'HEADER_VALIDATION_ERROR',
                userId: req.user?.id || 'anonymous',
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: `${req.method} ${req.path}`,
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
                severity: 'high'
            });
            next();
        }
    }
    /**
     * 🔄 UPDATE CSP FOR DEVELOPMENT
     */
    static updateCSPForDevelopment(req, res, next) {
        if (process.env.NODE_ENV === 'development') {
            // More relaxed CSP for development
            const devCSP = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:* *.localhost:*",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https: http: localhost:*",
                "connect-src 'self' ws: wss: localhost:* *.localhost:* https://qrng.anu.edu.au",
                "object-src 'none'",
                "frame-src 'none'",
                "base-uri 'self'"
            ].join('; ');
            res.setHeader('Content-Security-Policy', devCSP);
        }
        next();
    }
}
exports.SecurityHeadersMiddleware = SecurityHeadersMiddleware;
SecurityHeadersMiddleware.auditLogger = new auditLogger_service_1.AuditLogger();
// Security configuration
SecurityHeadersMiddleware.SECURITY_CONFIG = {
    CONTENT_SECURITY_POLICY: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'strict-dynamic'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'", 'https://qrng.anu.edu.au', 'https://api.quankey.xyz'],
        'object-src': ["'none'"],
        'media-src': ["'none'"],
        'frame-src': ["'none'"],
        'child-src': ["'none'"],
        'worker-src': ["'self'"],
        'manifest-src': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'upgrade-insecure-requests': true
    },
    PERMISSIONS_POLICY: {
        'camera': [],
        'microphone': [],
        'geolocation': [],
        'payment': [],
        'usb': [],
        'accelerometer': [],
        'gyroscope': [],
        'magnetometer': [],
        'fullscreen': ['self'],
        'picture-in-picture': []
    }
};
/**
 * 🔒 EXPORT SECURITY HEADERS MIDDLEWARE
 */
exports.securityHeaders = SecurityHeadersMiddleware;
