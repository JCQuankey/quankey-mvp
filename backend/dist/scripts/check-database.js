"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
async function checkDatabase() {
    const prisma = new client_1.PrismaClient();
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connection successful');
        // Test a simple query
        const userCount = await prisma.user.count();
        console.log(`✅ Database query successful. Users: ${userCount}`);
        // List all tables
        const tables = await prisma.$queryRaw `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
        console.log('✅ Database tables:', tables);
    }
    catch (error) {
        console.error('❌ Database check failed:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
checkDatabase();
