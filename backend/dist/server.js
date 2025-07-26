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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const quantum_1 = require("./routes/quantum");
const auth_1 = require("./routes/auth");
const databaseService_1 = require("./services/databaseService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/quantum', quantum_1.quantumRouter);
app.use('/api/auth', auth_1.authRouter);
// Health check
app.get('/api/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const dbHealth = yield databaseService_1.DatabaseService.healthCheck();
    res.json({
        status: 'OK',
        message: 'Quankey Backend is running!',
        database: dbHealth ? 'Connected' : 'Disconnected',
        features: ['quantum-generation', 'webauthn-biometric', 'postgresql-persistence'],
        timestamp: new Date().toISOString()
    });
}));
// Initialize database and start server
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const dbConnected = yield databaseService_1.DatabaseService.initialize();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }
        app.listen(PORT, () => {
            console.log(`🚀 Quankey Backend running on port ${PORT}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🔐 WebAuthn biometric auth ready`);
            console.log(`⚛️ Quantum password generation ready`);
            console.log(`🗄️ PostgreSQL database connected`);
        });
    });
}
// Graceful shutdown
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n🛑 Shutting down gracefully...');
    yield databaseService_1.DatabaseService.disconnect();
    process.exit(0);
}));
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n🛑 Shutting down gracefully...');
    yield databaseService_1.DatabaseService.disconnect();
    process.exit(0);
}));
startServer().catch(console.error);
