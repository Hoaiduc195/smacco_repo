import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search places by keyword, type, location' })
  @ApiQuery({ name: 'q', required: false, description: 'Search keyword' })
  @ApiQuery({ name: 'type', required: false, description: 'Place type (food/accommodation)' })
  @ApiQuery({ name: 'location', required: false, description: 'Location/city name' })
  @ApiQuery({ name: 'budget', required: false, description: 'Budget range' })
  @ApiQuery({ name: 'checkInDate', required: false, description: 'Check-in date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'checkOutDate', required: false, description: 'Check-out date (YYYY-MM-DD)' })
  search(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('location') location?: string,
    @Query('budget') budget?: string,
    @Query('checkInDate') checkInDate?: string,
    @Query('checkOutDate') checkOutDate?: string,
  ) {
    return this.searchService.search({ q, type, location, budget, checkInDate, checkOutDate });
  }
}
