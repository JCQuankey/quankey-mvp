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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = exports.prisma = exports.database = void 0;
// backend/src/config/database.ts - PRISMA
const client_1 = require("@prisma/client");
class DatabaseService {
    constructor() {
        this.prisma = new client_1.PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.prisma.$connect();
                console.log('✅ Database connected successfully');
            }
            catch (error) {
                console.error('❌ Database connection failed:', error);
                throw error;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.prisma.$disconnect();
                console.log('🔌 Database disconnected');
            }
            catch (error) {
                console.error('❌ Database disconnection failed:', error);
            }
        });
    }
    healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.prisma.$queryRaw `SELECT 1`;
                return true;
            }
            catch (error) {
                console.error('❌ Database health check failed:', error);
                return false;
            }
        });
    }
}
exports.DatabaseService = DatabaseService;
// Exportar instancia singleton
exports.database = DatabaseService.getInstance();
exports.prisma = exports.database.prisma;
exports.default = exports.database;
