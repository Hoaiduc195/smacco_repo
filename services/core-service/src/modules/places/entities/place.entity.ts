import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlaceDocument = Place & Document;

@Schema({ timestamps: true })
export class Place {
  @Prop({ required: true })
  locationId: string; // External ID from Google Places API / OpenStreetMap

  @Prop({ required: true })
  nameCache: string; // Cached name for fast UI loading

  @Prop()
  addressCache: string; // Cached address

  @Prop()
  type: string; // 'food' | 'accommodation'

  @Prop({ type: Object, default: {} })
  metrics: {
    totalPromotes: number;
    totalReviews: number;
    averageRating: number;
  };

  @Prop()
  imageUrl: string;

  @Prop({ type: Object })
  coordinates: {
    lat: number;
    lng: number;
  };

  @Prop()
  lastUpdated: Date;
}

export const PlaceSchema = SchemaFactory.createForClass(Place);
