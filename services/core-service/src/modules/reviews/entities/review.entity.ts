import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ required: true })
  locationId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  content: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
