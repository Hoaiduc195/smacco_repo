export default function HomePage() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Khám phá Chỗ ở & Ẩm thực
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Tìm kiếm địa điểm ăn uống và chỗ ở tốt nhất với AI
      </p>
      <a
        href="/search"
        className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition"
      >
        Bắt đầu tìm kiếm
      </a>
    </div>
  );
}
