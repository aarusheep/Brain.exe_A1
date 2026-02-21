const mongoose = require('mongoose');

const exporterSchema = new mongoose.Schema({
  id: String,
  country: String,
  industry: String,
  manufacturing_capacity: Number,
  msme_status: String,
  certification: String,
  // ... other fields from exporter file
}, { timestamps: true });

module.exports = mongoose.model('Exporter', exporterSchema);
