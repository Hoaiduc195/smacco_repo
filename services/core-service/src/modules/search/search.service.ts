import { Injectable } from '@nestjs/common';
import { PlacesService } from '../places/places.service';

export interface SearchFilters {
  q?: string;
  type?: string;
  location?: string;
  budget?: string;
}

@Injectable()
export class SearchService {
  constructor(private readonly placesService: PlacesService) {}

  async search(filters: SearchFilters) {
    // TODO: Implement full-text search & advanced filtering
    // For now, delegate to places service
    return this.placesService.findAll({
      type: filters.type,
      city: filters.location,
    });
  }
}
