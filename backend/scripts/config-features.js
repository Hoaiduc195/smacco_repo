const fs = require('fs');
const path = require('path');
const readline = require('readline');

const configPath = path.join(__dirname, '../features.json');

// Read existing config or set defaults
let config = {
  hotelSearch: true,
  propertyDetails: true,
  photos: false,
  reviews: true,
  nearbyAmenities: true
};

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    // ignore
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('\n=============================================');
  console.log('       CẤU HÌNH TÍNH NĂNG HỆ THỐNG            ');
  console.log('=============================================');
  console.log('Quản lý sử dụng các dịch vụ ngoài hiệu quả (SerpAPI & Overpass API).\n');

  // 1. Hotel Search
  const searchAns = await askQuestion(`1. Cho phép Tìm kiếm Khách sạn qua SerpAPI (hiện tại: ${config.hotelSearch ? 'Bật' : 'Tắt'})? (y/n hoặc enter để giữ nguyên): `);
  config.hotelSearch = searchAns.trim().toLowerCase() === 'y' ? true : (searchAns.trim().toLowerCase() === 'n' ? false : config.hotelSearch);

  // 2. Property Details
  const detailsAns = await askQuestion(`2. Cho phép Tải chi tiết khách sạn qua SerpAPI Property Details (hiện tại: ${config.propertyDetails ? 'Bật' : 'Tắt'})? (y/n hoặc enter để giữ nguyên): `);
  config.propertyDetails = detailsAns.trim().toLowerCase() === 'y' ? true : (detailsAns.trim().toLowerCase() === 'n' ? false : config.propertyDetails);

  // 3. Photos
  const photoAns = await askQuestion(`3. Cho phép Tải ảnh chi tiết qua SerpAPI Photos (hiện tại: ${config.photos ? 'Bật' : 'Tắt'})? (y/n hoặc enter để giữ nguyên): `);
  config.photos = photoAns.trim().toLowerCase() === 'y' ? true : (photoAns.trim().toLowerCase() === 'n' ? false : config.photos);

  // 4. Reviews
  const reviewAns = await askQuestion(`4. Cho phép Tải đánh giá qua SerpAPI Reviews (hiện tại: ${config.reviews ? 'Bật' : 'Tắt'})? (y/n hoặc enter để giữ nguyên): `);
  config.reviews = reviewAns.trim().toLowerCase() === 'y' ? true : (reviewAns.trim().toLowerCase() === 'n' ? false : config.reviews);

  // 5. Nearby Amenities
  const amenitiesAns = await askQuestion(`5. Cho phép Đếm tiện ích xung quanh qua Overpass API (hiện tại: ${config.nearbyAmenities ? 'Bật' : 'Tắt'})? (y/n hoặc enter để giữ nguyên): `);
  config.nearbyAmenities = amenitiesAns.trim().toLowerCase() === 'y' ? true : (amenitiesAns.trim().toLowerCase() === 'n' ? false : config.nearbyAmenities);

  // Write new config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  console.log('\n[Thành công] Cấu hình mới đã được lưu thành công!');
  console.log('Đường dẫn:', configPath);
  console.log('Nội dung cấu hình:');
  console.log(JSON.stringify(config, null, 2));
  console.log('=============================================\n');

  rl.close();
}

main().catch(err => {
  console.error('Lỗi khi cấu hình:', err);
  rl.close();
});
