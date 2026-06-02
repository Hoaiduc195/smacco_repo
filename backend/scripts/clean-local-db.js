const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/accommodation_db?schema=public';
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('==================================================');
  console.log('       CLEANING UP LOCAL TEST DATA FROM DB        ');
  console.log('==================================================\n');

  const oldPlaces = await prisma.place.findMany({
    where: { source: 'local' },
    select: { id: true }
  });
  const oldPlaceIds = oldPlaces.map(p => p.id);

  if (oldPlaceIds.length > 0) {
    await prisma.review.deleteMany({
      where: { placeId: { in: oldPlaceIds } }
    });
    await prisma.placeSource.deleteMany({
      where: { placeId: { in: oldPlaceIds } }
    });
    await prisma.place.deleteMany({
      where: { id: { in: oldPlaceIds } }
    });
    console.log(`Đã xóa thành công ${oldPlaceIds.length} địa điểm local cũ.`);
  } else {
    console.log('Không có địa điểm local nào trong database.');
  }

  console.log('\n==================================================');
  console.log('                HOÀN TẤT DỌN DẸP                  ');
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error('Lỗi khi dọn dẹp:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
