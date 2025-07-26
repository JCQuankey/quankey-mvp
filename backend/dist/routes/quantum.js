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
const express_1 = __importDefault(require("express"));
const quantumService_1 = require("../services/quantumService");
exports.quantumRouter = express_1.default.Router();
// Generate quantum password
exports.quantumRouter.post('/generate-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { length = 16, includeSymbols = true } = req.body;
        console.log(`🔬 Generating quantum password with length: ${length}`);
        const password = yield (0, quantumService_1.generateQuantumPassword)(length, includeSymbols);
        res.json({
            success: true,
            password,
            length: password.length,
            timestamp: new Date().toISOString(),
            quantum: true,
            entropy: Math.log2(Math.pow(94, password.length)).toFixed(2) + ' bits'
        });
    }
    catch (error) {
        console.error('❌ Error generating quantum password:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate quantum password',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Test quantum connection
exports.quantumRouter.get('/test-connection', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Test basic quantum randomness
        const testNumbers = yield (0, quantumService_1.generateQuantumPassword)(8, false);
        res.json({
            success: true,
            message: 'Quantum connection working!',
            sample: testNumbers,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Quantum connection failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
