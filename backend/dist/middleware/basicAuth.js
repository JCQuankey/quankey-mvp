"use strict";
/**
 * Basic Authentication Middleware for Development/Staging Protection
 * Protects the entire application with HTTP Basic Auth when enabled
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.basicAuthMiddleware = void 0;
const config = {
    enabled: process.env.BASIC_AUTH_ENABLED === 'true',
    username: process.env.BASIC_AUTH_USERNAME || 'quankey',
    password: process.env.BASIC_AUTH_PASSWORD || 'quantum2025',
    realm: process.env.BASIC_AUTH_REALM || 'Quankey Development'
};
const basicAuthMiddleware = (req, res, next) => {
    // Skip if Basic Auth is disabled
    if (!config.enabled) {
        return next();
    }
    // Skip for health checks to avoid breaking monitoring
    if (req.path === '/api/health') {
        return next();
    }
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
        return sendAuthChallenge(res);
    }
    try {
        // Extract and decode credentials
        const credentials = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
        const [username, password] = credentials.split(':');
        // Validate credentials
        if (username === config.username && password === config.password) {
            console.log(`[BASIC-AUTH] Access granted for user: ${username}`);
            return next();
        }
        else {
            console.log(`[BASIC-AUTH] Access denied for user: ${username || 'unknown'}`);
            return sendAuthChallenge(res);
        }
    }
    catch (error) {
        console.error('[BASIC-AUTH] Error parsing credentials:', error);
        return sendAuthChallenge(res);
    }
};
exports.basicAuthMiddleware = basicAuthMiddleware;
function sendAuthChallenge(res) {
    res.set('WWW-Authenticate', `Basic realm="${config.realm}"`);
    res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide valid credentials to access this resource',
        realm: config.realm
    });
}
exports.default = exports.basicAuthMiddleware;
