"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
//src/lib/prisma.ts
const client_1 = require("../generated/prisma/client");
require("dotenv/config");
const adapter_pg_1 = require("@prisma/adapter-pg");
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
exports.prisma = new client_1.PrismaClient({ adapter });
