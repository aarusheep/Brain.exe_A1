const mongoose = require('mongoose');

const importerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  // Add other relevant fields from the Excel/Python script if needed
  intent_score: {
    type: Number,
    default: 0
  },
  response_probability: {
    type: Number,
    default: 0
  },
  prompt_response: {
    type: Number,
    default: 0
  },
  trade_volume: String,
  industry: String,

  // Status tracking
  status: {
    type: String, // 'pending', 'accepted', 'rejected'
    default: 'pending',
    enum: ['pending', 'accepted', 'rejected']
  },

  // AI Generated fields
  summary: {
    type: String, // Full reasoning
  },
  pros: [String], // List of positives
  cons: [String], // List of negatives

  rank: Number, // Current rank in the list
}, { timestamps: true });

module.exports = mongoose.model('Importer', importerSchema);
