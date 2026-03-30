import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Place, PlaceDocument } from './entities/place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';

@Injectable()
export class PlacesService {
  constructor(
    @InjectModel(Place.name) private readonly placeModel: Model<PlaceDocument>,
  ) {}

  async create(createPlaceDto: CreatePlaceDto): Promise<Place> {
    const place = new this.placeModel(createPlaceDto);
    return place.save();
  }

  async findAll(filters?: { type?: string; city?: string }): Promise<Place[]> {
    const query: any = {};
    if (filters?.type) query.type = filters.type;
    if (filters?.city) query['addressCache'] = { $regex: filters.city, $options: 'i' };
    return this.placeModel.find(query).exec();
  }

  async findOne(id: string): Promise<Place> {
    const place = await this.placeModel.findById(id).exec();
    if (!place) throw new NotFoundException(`Place #${id} not found`);
    return place;
  }

  async update(id: string, updatePlaceDto: UpdatePlaceDto): Promise<Place> {
    const place = await this.placeModel
      .findByIdAndUpdate(id, updatePlaceDto, { new: true })
      .exec();
    if (!place) throw new NotFoundException(`Place #${id} not found`);
    return place;
  }

  async remove(id: string): Promise<void> {
    const result = await this.placeModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Place #${id} not found`);
  }
}
