import mongoose, { Document, Schema } from 'mongoose'
import { nanoid } from 'nanoid'

export interface ILink extends Document {
  originalUrl: string
  shortId: string
  alias?: string
  userId?: mongoose.Types.ObjectId
  clicks: number
  createdAt: Date
  updatedAt: Date
}

const LinkSchema = new Schema(
  {
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    shortId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: () => nanoid(8), // Генерируем короткий ID длиной 8 символов
    },
    alias: {
      type: String,
      unique: true,
      sparse: true, // Позволяет иметь несколько документов с null/undefined
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    clicks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

// Создаем индексы для более быстрого поиска
LinkSchema.index({ shortId: 1 })
LinkSchema.index({ alias: 1 })
LinkSchema.index({ userId: 1 })

export default mongoose.model<ILink>('Link', LinkSchema)
