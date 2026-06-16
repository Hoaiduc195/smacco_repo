"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
}
const pool = new pg_1.Pool({ connectionString: databaseUrl });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    const placeId = '5fe818d1-1025-4e08-bd92-02dd2217947f';
    console.log(`Querying place: ${placeId}...`);
    const place = await prisma.place.findUnique({
        where: { id: placeId },
    });
    console.log('Result:', JSON.stringify(place, null, 2));
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});
//# sourceMappingURL=query-place.js.map
