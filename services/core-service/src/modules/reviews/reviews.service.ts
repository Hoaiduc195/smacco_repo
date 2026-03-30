import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const review = new this.reviewModel(createReviewDto);
    return review.save();
  }

  async findAll(locationId?: string): Promise<Review[]> {
    const query = locationId ? { locationId } : {};
    return this.reviewModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewModel.findById(id).exec();
    if (!review) throw new NotFoundException(`Review #${id} not found`);
    return review;
  }

  async remove(id: string): Promise<void> {
    const result = await this.reviewModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Review #${id} not found`);
  }
}
