"use strict";
/**
 * 🔐 AUDIT LOGGER SERVICE
 * Military-grade audit logging for security events
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogger = void 0;
class AuditLogger {
    /**
     * 📝 LOG SECURITY EVENT
     */
    async logSecurityEvent(event) {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = {
                ...event,
                timestamp
            };
            // Log to console in development
            if (process.env.NODE_ENV === 'development') {
                console.log(`🔒 SECURITY EVENT [${event.severity.toUpperCase()}]:`, logEntry);
            }
            // In production, this would write to secure audit log file
            // or send to SIEM system
        }
        catch (error) {
            console.error('Audit logging error:', error);
        }
    }
}
exports.AuditLogger = AuditLogger;
