import mongoose, { Document, Schema } from 'mongoose'

export interface IClick extends Document {
  linkId: mongoose.Types.ObjectId
  timestamp: Date
  ip?: string
  referrer?: string
  userAgent?: string
  browser?: string
  os?: string
  device?: string
}

const ClickSchema = new Schema(
  {
    linkId: {
      type: Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ip: String,
    referrer: String,
    userAgent: String,
    browser: String,
    os: String,
    device: String,
  },
  { timestamps: false }
)

// Создаем индекс для более быстрого поиска
ClickSchema.index({ linkId: 1 })
ClickSchema.index({ timestamp: 1 })

export default mongoose.model<IClick>('Click', ClickSchema)
