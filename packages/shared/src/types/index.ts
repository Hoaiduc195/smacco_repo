// ── User ─────────────────────────────────────
export interface IUser {
  id: string;
  name: string;
  email: string;
  firebaseUid?: string;
  preferences: string[];
  avatarUrl?: string;
}

// ── Place ────────────────────────────────────
export interface IPlace {
  id: string;
  locationId: string;
  nameCache: string;
  addressCache?: string;
  type: 'food' | 'accommodation';
  metrics: {
    totalPromotes: number;
    totalReviews: number;
    averageRating: number;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// ── Review ───────────────────────────────────
export interface IReview {
  id: string;
  locationId: string;
  userId: string;
  rating: number;
  content?: string;
  createdAt: string;
}

// ── AI Query ─────────────────────────────────
export interface IAiQuery {
  text: string;
  userId?: string;
}

export interface IExtractedFilters {
  location?: string;
  type?: string;
  budget?: string;
}

// ── Recommendation ───────────────────────────
export interface IRecommendation {
  locationId: string;
  name: string;
  address?: string;
  rating?: number;
  score: number;
}
