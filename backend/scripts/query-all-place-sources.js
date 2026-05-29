"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const databaseUrl = 'postgresql://postgres:postgres@localhost:5433/accommodation_db?schema=public';
const pool = new pg_1.Pool({ connectionString: databaseUrl });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Querying all place sources...');
    const placeSources = await prisma.placeSource.findMany({
        take: 100,
    });
    console.log('Total place sources:', placeSources.length);
    for (const ps of placeSources) {
        console.log(`- ID: ${ps.id}, PlaceID: ${ps.placeId}, Source: ${ps.source}, SourcePlaceID: ${ps.sourcePlaceId}, Name: ${ps.rawName}`);
    }
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
//# sourceMappingURL=query-all-place-sources.js.map