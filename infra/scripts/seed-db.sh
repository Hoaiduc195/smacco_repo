#!/bin/bash
# ============================================
# Initialize MongoDB with seed data
# ============================================

echo "Seeding MongoDB..."

mongosh --host mongo --username admin --password changeme --authenticationDatabase admin <<EOF
use accommodation_db;

// Users
db.users.insertMany([
  {
    name: "Nguyen Van A",
    email: "a@example.com",
    preferences: ["cafe", "nature"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Tran Thi B",
    email: "b@example.com",
    preferences: ["food", "budget"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Places
db.places.insertMany([
  {
    locationId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
    nameCache: "Cà phê vợt Cheo Leo",
    addressCache: "Quận 3, TP.HCM",
    type: "food",
    metrics: { totalPromotes: 150, totalReviews: 45, averageRating: 4.6 },
    coordinates: { lat: 10.7769, lng: 106.6869 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    locationId: "ChIJ_example_danang",
    nameCache: "Bún chả cá Đà Nẵng",
    addressCache: "Hải Châu, Đà Nẵng",
    type: "food",
    metrics: { totalPromotes: 89, totalReviews: 32, averageRating: 4.3 },
    coordinates: { lat: 16.0544, lng: 108.2022 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    locationId: "ChIJ_example_homestay",
    nameCache: "Homestay Chill Đà Lạt",
    addressCache: "Phường 1, Đà Lạt",
    type: "accommodation",
    metrics: { totalPromotes: 210, totalReviews: 67, averageRating: 4.8 },
    coordinates: { lat: 11.9404, lng: 108.4583 },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Reviews
db.reviews.insertMany([
  {
    locationId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
    userId: "u001",
    rating: 5,
    content: "Quán ăn ngon, giá rẻ, hợp lý!",
    createdAt: new Date()
  },
  {
    locationId: "ChIJ_example_homestay",
    userId: "u002",
    rating: 4,
    content: "Phòng sạch sẽ, view đẹp!",
    createdAt: new Date()
  }
]);

print("Seed data inserted successfully!");
EOF
