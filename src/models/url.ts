import mongoose, { Document, Schema } from 'mongoose';

export interface IUrl extends Document {
  originalUrl: string;
  shortUrl: string;
  hits: number;
  lastAccessed: Date;
  createdAt: Date;
  enabled: boolean;
}

const UrlSchema = new Schema<IUrl>({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
  hits: { type: Number, default: 0 },
  lastAccessed: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  enabled: { type: Boolean, default: true },
});

const Url = mongoose.model<IUrl>('Url', UrlSchema);
export default Url;
