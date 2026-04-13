export interface ExtractedFilters {
  location?: string;
  type?: string;
  budget?: string;
}

export interface RecommendationItem {
  locationId: string;
  name: string;
  address?: string;
  rating?: number;
  score: number;
  type?: string;
  lat?: number;
  lng?: number;
}

export interface ParseResponseDto {
  query: string;
  extractedFilters: ExtractedFilters;
  recommendations: RecommendationItem[];
}
