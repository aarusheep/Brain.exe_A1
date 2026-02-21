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

  // Extended Data Fields from CSV
  avg_order_tons: Number,
  revenue: Number, // Mapped from Revenue_Size_USD
  team_size: Number,
  certification: String,
  good_payment_history: Boolean,
  hiring_growth: Boolean,
  funding_event: String, // '1', '0', or 'Unknown'
  engagement_spike: Boolean,
  sales_nav_visits: Number,
  decision_maker_change: Boolean,
  preferred_channel: String,

  // Risk Factors
  tariff_news: Boolean,
  stock_market_shock: Boolean,
  war_event: Boolean,
  natural_calamity: Boolean,
  currency_fluctuation: Number,

  // AI Generated fields
  summary: {
    type: String, // Full reasoning
  },
  pros: [String], // List of positives
  cons: [String], // List of negatives

  rank: Number, // Current rank in the list
}, { timestamps: true });

module.exports = mongoose.model('Importer', importerSchema);
