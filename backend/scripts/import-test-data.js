const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('fs');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/accommodation_db?schema=public';
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('==================================================');
  console.log('      IMPORTING LOCAL TEST DATA TO DATABASE       ');
  console.log('==================================================\n');

  const testDataPath = path.join(__dirname, '../test/fixtures/data.json');
  const testImagesDir = path.join(__dirname, '../test/fixtures/images');
  const destImagesDir = path.join(__dirname, '../../frontend/public/images');

  if (!fs.existsSync(testDataPath)) {
    console.error(`[Lỗi] Không tìm thấy file test data tại: ${testDataPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(testDataPath, 'utf8');
  const data = JSON.parse(rawData);
  console.log(`Đã đọc ${data.length} địa điểm từ test data.`);

  // 1. Dọn dẹp các địa điểm và reviews có source = 'local' cũ để tránh trùng lặp
  console.log('Đang xóa các địa điểm local cũ trong database...');
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
    console.log(`Đã xóa ${oldPlaceIds.length} địa điểm local cũ.`);
  }

  // 2. Import dữ liệu mới
  console.log('\nBắt đầu import các địa điểm mới...');
  let importedPlacesCount = 0;
  let importedReviewsCount = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const index = String(i);

    // Tính toán thông số đánh giá trung bình
    const reviewsList = item.reviews || [];
    const reviewCount = reviewsList.length;
    const averageRating = reviewCount > 0
      ? reviewsList.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount
      : null;

    // Ảnh bìa mặc định là ảnh đầu tiên (ví dụ: /images/0-1.jpg)
    const coverImageUrl = item.images && item.images.length > 0
      ? `/images/${item.images[0]}`
      : null;

    // Lưu toàn bộ thông tin bổ sung vào rawSerpApiPropertyDetails dưới dạng JSON
    const details = {
      phone: item.phone,
      email: item.email,
      rooms: item.rooms,
      website: item.website,
      images: item.images, // Mảng ảnh local đầy đủ
      amenities: item.amenities,
    };

    // Tạo Place
    const place = await prisma.place.create({
      data: {
        source: 'local',
        sourcePlaceId: index,
        placeName: item.name,
        placeAddress: item.address,
        categories: [item.type],
        lat: item.latitude,
        lng: item.longitude,
        coverImageUrl,
        averageRating,
        reviewCount,
        rawSerpApiPropertyDetails: details,
      }
    });

    // Tạo PlaceSource
    await prisma.placeSource.create({
      data: {
        placeId: place.id,
        source: 'local',
        sourcePlaceId: index,
        rawName: item.name,
        rawAddress: item.address,
        normalizedName: item.name.toLowerCase(),
        normalizedAddress: item.address ? item.address.toLowerCase() : '',
        lat: item.latitude,
        lng: item.longitude,
      }
    });

    // Tạo Reviews
    for (const r of reviewsList) {
      await prisma.review.create({
        data: {
          placeId: place.id,
          rating: r.rating,
          reviewText: r.content,
          source: 'user', // Đánh giá do người dùng viết
        }
      });
      importedReviewsCount++;
    }

    importedPlacesCount++;
  }

  console.log(`[Thành công] Đã import thành công ${importedPlacesCount} địa điểm và ${importedReviewsCount} đánh giá.`);

  // 3. Giữ nguyên ảnh ở folder test_data
  console.log('\n[Thông báo] Ảnh test được giữ nguyên tại test_data/images và sẽ được Backend phục vụ động qua API.');

  console.log('\n==================================================');
  console.log('              HOÀN TẤT IMPORT DỮ LIỆU             ');
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error('Lỗi khi import dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
