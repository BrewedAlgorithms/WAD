const mongoose = require('mongoose');

const searchQuerySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, default: null },
    query: { type: String, required: true, trim: true },
    normalized: { type: String, required: true, index: true },
    lastUsedAt: { type: Date, default: Date.now, index: true },
    count: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient lookups
searchQuerySchema.index({ normalized: 1, userId: 1 });
searchQuerySchema.index({ normalized: 1, count: -1 });
searchQuerySchema.index({ lastUsedAt: -1 });

searchQuerySchema.statics.record = async function record(userId, query) {
  const trimmed = (query || '').trim();
  const normalized = trimmed.toLowerCase();
  if (!normalized) return null;

  const update = {
    $setOnInsert: { query: trimmed, normalized },
    $set: { lastUsedAt: new Date() },
    $inc: { count: 1 },
  };

  // Record user-specific history if userId present
  const filterUser = { normalized, userId: userId || null };
  const updated = await this.findOneAndUpdate(filterUser, update, {
    new: true,
    upsert: true,
  });

  // Also maintain a global record (userId = null) for community suggestions
  if (userId) {
    await this.findOneAndUpdate({ normalized, userId: null }, update, {
      upsert: true,
      new: true,
    });
  }

  return updated;
};

module.exports = mongoose.model('SearchQuery', searchQuerySchema);
