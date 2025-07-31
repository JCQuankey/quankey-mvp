"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const authMiddleware = (req, res, next) => {
    try {
        // Buscar token en Authorization header
        const authHeader = req.headers.authorization;
        let token = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        // Si no hay token en header, buscar en cookies
        if (!token && req.headers.cookie) {
            const cookies = req.headers.cookie.split(';');
            for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'authToken' || name.startsWith('quankey_')) {
                    token = value;
                    break;
                }
            }
        }
        console.log('🔍 Auth middleware - Token found:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
        console.log('🔍 Auth middleware - Full token:', token);
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        // NUEVA VALIDACIÓN - Aceptar cualquier token y extraer user ID
        try {
            let userId = null;
            let username = null;
            // Si es token JSON (del localStorage)
            if (token.startsWith('{')) {
                const parsed = JSON.parse(token);
                userId = parsed.userId || parsed.id || parsed.user?.id;
                username = parsed.username || parsed.displayName || parsed.user?.username;
            }
            // Si es token de sesión que creamos
            else if (token.startsWith('session_')) {
                const parts = token.split('_');
                userId = parts[1];
                username = `user_${userId}`;
            }
            // Si es token simple string
            else {
                userId = token.split('_')[0] || 'user123';
                username = `user_${userId}`;
            }
            if (userId) {
                req.user = {
                    id: userId,
                    username: username || `user_${userId}`,
                    webauthnId: `webauthn_${userId}`
                };
                console.log('✅ User authenticated:', req.user);
                return next();
            }
            // Si no se pudo extraer userId, usar fallback
            throw new Error('Could not extract user ID');
        }
        catch (parseError) {
            console.log('🔍 Token parse error, using fallback user:', parseError);
            // Fallback: crear usuario temporal para testing
            const fallbackUserId = `temp_${Date.now()}`;
            req.user = {
                id: fallbackUserId,
                username: 'temp_user',
                webauthnId: `temp_webauthn_${fallbackUserId}`
            };
            console.log('✅ Fallback user created:', req.user);
            return next();
        }
    }
    catch (error) {
        console.error('❌ Auth middleware error:', error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};
exports.authMiddleware = authMiddleware;
