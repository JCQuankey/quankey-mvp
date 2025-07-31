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
exports.authRouter = void 0;
const express_1 = __importDefault(require("express"));
const webauthnService_1 = require("../services/webauthnService");
exports.authRouter = express_1.default.Router();
// Register new user with biometric authentication
exports.authRouter.post('/register/begin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, displayName } = req.body;
        if (!username || !displayName) {
            return res.status(400).json({
                success: false,
                error: 'Username and display name are required'
            });
        }
        console.log(`🔐 Starting biometric registration for: ${username}`);
        const options = yield webauthnService_1.WebAuthnService.generateRegistrationOptions(username, displayName);
        res.json({
            success: true,
            options
        });
    }
    catch (error) {
        console.error('❌ Registration begin error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate registration options',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Complete registration - CAMBIADO DE /complete A /finish
exports.authRouter.post('/register/finish', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, response, displayName } = req.body;
        if (!username || !response) {
            return res.status(400).json({
                success: false,
                error: 'Username and response are required'
            });
        }
        console.log(`🔐 Completing biometric registration for: ${username}`);
        // Pass displayName in the response object for the verification
        const responseWithDisplayName = Object.assign(Object.assign({}, response), { displayName: displayName || username });
        const verification = yield webauthnService_1.WebAuthnService.verifyRegistration(username, responseWithDisplayName);
        if (verification.verified) {
            res.json({
                success: true,
                message: 'Biometric authentication registered successfully',
                user: verification.user
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: 'Registration verification failed'
            });
        }
    }
    catch (error) {
        console.error('❌ Registration complete error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete registration',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Start authentication - AÑADIDO ALIAS PARA /login/begin
exports.authRouter.post('/login/begin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.body;
        console.log(`🔍 Starting biometric authentication for: ${username || 'any user'}`);
        const options = yield webauthnService_1.WebAuthnService.generateAuthenticationOptions(username);
        res.json({
            success: true,
            options
        });
    }
    catch (error) {
        console.error('❌ Authentication begin error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate authentication options',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Complete authentication - AÑADIDO ALIAS PARA /login/finish
exports.authRouter.post('/login/finish', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, response } = req.body;
        console.log(`🔍 Completing biometric authentication for: ${username || 'credential-based'}`);
        const verification = yield webauthnService_1.WebAuthnService.verifyAuthentication(response, username);
        if (verification.verified) {
            res.json({
                success: true,
                message: 'Authentication successful',
                user: verification.user
            });
        }
        else {
            res.status(401).json({
                success: false,
                error: 'Authentication failed'
            });
        }
    }
    catch (error) {
        console.error('❌ Authentication complete error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete authentication',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Start authentication - TU CÓDIGO ORIGINAL
exports.authRouter.post('/authenticate/begin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.body;
        console.log(`🔍 Starting biometric authentication for: ${username || 'any user'}`);
        const options = yield webauthnService_1.WebAuthnService.generateAuthenticationOptions(username);
        res.json({
            success: true,
            options
        });
    }
    catch (error) {
        console.error('❌ Authentication begin error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate authentication options',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Complete authentication - TU CÓDIGO ORIGINAL
exports.authRouter.post('/authenticate/complete', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, response } = req.body;
        console.log(`🔍 Completing biometric authentication for: ${username || 'credential-based'}`);
        const verification = yield webauthnService_1.WebAuthnService.verifyAuthentication(response, username);
        if (verification.verified) {
            res.json({
                success: true,
                message: 'Authentication successful',
                user: verification.user
            });
        }
        else {
            res.status(401).json({
                success: false,
                error: 'Authentication failed'
            });
        }
    }
    catch (error) {
        console.error('❌ Authentication complete error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete authentication',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Check if user exists - TU CÓDIGO ORIGINAL
exports.authRouter.get('/user/:username/exists', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.params;
        const exists = yield webauthnService_1.WebAuthnService.userExists(username);
        res.json({
            success: true,
            exists,
            username
        });
    }
    catch (error) {
        console.error('❌ User check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check user existence'
        });
    }
}));
// Get user info - TU CÓDIGO ORIGINAL
exports.authRouter.get('/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield webauthnService_1.WebAuthnService.getAllUsers();
        res.json({
            success: true,
            users,
            count: users.length
        });
    }
    catch (error) {
        console.error('❌ Users list error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get users list'
        });
    }
}));
// Añadir AL FINAL de tu auth.ts, después de todos los endpoints existentes:
// Complete registration - ALIAS para compatibilidad frontend
exports.authRouter.post('/register/complete', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, response, displayName } = req.body;
        if (!username || !response) {
            return res.status(400).json({
                success: false,
                error: 'Username and response are required'
            });
        }
        console.log(`🔐 Completing biometric registration for: ${username}`);
        // Pass displayName in the response object for the verification
        const responseWithDisplayName = Object.assign(Object.assign({}, response), { displayName: displayName || username });
        const verification = yield webauthnService_1.WebAuthnService.verifyRegistration(username, responseWithDisplayName);
        if (verification.verified) {
            res.json({
                success: true,
                message: 'Biometric authentication registered successfully',
                user: verification.user
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: 'Registration verification failed'
            });
        }
    }
    catch (error) {
        console.error('❌ Registration complete error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete registration',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Login existing user with biometric authentication
exports.authRouter.post('/login/begin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({
                success: false,
                error: 'Username is required'
            });
        }
        console.log(`🔐 Starting biometric login for: ${username}`);
        const options = yield webauthnService_1.WebAuthnService.generateAuthenticationOptions(username);
        res.json({
            success: true,
            options
        });
    }
    catch (error) {
        console.error('❌ Login begin error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate login options',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
exports.authRouter.post('/login/finish', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, response } = req.body;
        if (!username || !response) {
            return res.status(400).json({
                success: false,
                error: 'Username and response are required'
            });
        }
        console.log(`🔐 Completing biometric login for: ${username}`);
        const verification = yield webauthnService_1.WebAuthnService.verifyAuthentication(username, response);
        if (verification.verified && verification.user) {
            // CREAR SESIÓN/TOKEN AQUÍ
            res.json({
                success: true,
                message: 'Login successful',
                user: verification.user,
                token: `session_${verification.user.id}_${Date.now()}` // Token temporal
            });
        }
        else {
            res.status(401).json({
                success: false,
                error: 'Login verification failed'
            });
        }
    }
    catch (error) {
        console.error('❌ Login complete error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete login',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
