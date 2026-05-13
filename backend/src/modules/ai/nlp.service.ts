import { Injectable } from '@nestjs/common';
import { ExtractedFilters } from './dto/parse-response.dto';

/**
 * NLP Service for parsing user natural language queries.
 * Extracts structured filters (location, type, budget) from free-text input.
 * Ported from Python NLPService.
 */
@Injectable()
export class NlpService {
  // Simple keyword mappings for MVP
  private readonly locationKeywords: Record<string, string> = {
    'đà nẵng': 'Đà Nẵng',
    'hồ chí minh': 'TP.HCM',
    'hcm': 'TP.HCM',
    'hà nội': 'Hà Nội',
    'củ chi': 'Củ Chi',
    'huế': 'Huế',
    'nha trang': 'Nha Trang',
    'đà lạt': 'Đà Lạt',
  };

  private readonly typeKeywords: Record<string, string> = {
    'ăn': 'restaurant',
    'quán ăn': 'restaurant',
    'nhà hàng': 'restaurant',
    'cafe': 'cafe',
    'cà phê': 'cafe',
    'khách sạn': 'hotel',
    'homestay': 'homestay',
    'resort': 'resort',
    'khu nghỉ dưỡng': 'resort',
    'villa': 'villa',
    'biệt thự': 'villa',
    'chỗ ở': 'hotel',
    'phòng': 'hotel',
    'công viên': 'park',
    'du lịch': 'tourist_attraction',
    'tham quan': 'tourist_attraction',
  };

  private readonly budgetKeywords: Record<string, string> = {
    'rẻ': 'low',
    'bình dân': 'low',
    'trung bình': 'mid',
    'vừa': 'mid',
    'sang': 'high',
    'cao cấp': 'high',
  };

  extractFilters(text: string): ExtractedFilters {
    const textLower = text.toLowerCase();

    let location: string | undefined;
    for (const [keyword, value] of Object.entries(this.locationKeywords)) {
      if (textLower.includes(keyword)) {
        location = value;
        break;
      }
    }

    let type: string | undefined;
    for (const [keyword, value] of Object.entries(this.typeKeywords)) {
      if (textLower.includes(keyword)) {
        type = value;
        break;
      }
    }

    let budget: string | undefined;
    for (const [keyword, value] of Object.entries(this.budgetKeywords)) {
      if (textLower.includes(keyword)) {
        budget = value;
        break;
      }
    }

    return { location, type, budget };
  }
}
