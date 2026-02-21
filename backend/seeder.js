const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Importer = require('./models/Importer');
const connectDB = require('./config/db');

dotenv.config();

const seedImporters = [
  {
    name: 'Global Trade Co',
    country: 'USA',
    intent_score: 95,
    response_probability: 80,
    prompt_response: 90,
    trade_volume: 'High',
    industry: 'Manufacturing',
    status: 'pending',
    summary: 'High intent score and stable market presence make this a top candidate.',
    pros: ['High Intent', 'Stable Economy'],
    cons: ['High Competition']
  },
  {
    name: 'Asia Imports Ltd',
    country: 'Singapore',
    intent_score: 88,
    response_probability: 75,
    prompt_response: 85,
    trade_volume: 'Medium',
    industry: 'Logistics',
    status: 'pending'
  },
  {
    name: 'Euro Goods GmbH',
    country: 'Germany',
    intent_score: 92,
    response_probability: 85,
    prompt_response: 88,
    trade_volume: 'High',
    industry: 'Automotive',
    status: 'pending'
  }
];

const importData = async () => {
  try {
    await connectDB();
    try {
      await Importer.collection.drop(); // Drop collection to clear indexes
      console.log('Collection dropped.');
    } catch (error) {
      if (error.code === 26) {
        console.log('Collection not found, skipping drop.');
      } else {
        throw error;
      }
    }
    await Importer.insertMany(seedImporters);
    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

importData();
