const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Importer = require('./models/Importer');
const connectDB = require('./config/db');

dotenv.config();

const seedImporters = [
  {
    name: 'Global Trade Co',
    country: 'USA',
    industry: 'Manufacturing',
    intent_score: 95,
    response_probability: 80,
    prompt_response: 90,
    trade_volume: '$500K - $1M',
    status: 'pending',
    team_size: 250,
    summary: 'High intent score and stable market presence. Strong product compatibility with expanding operations.',
    pros: ['High Intent', 'Stable Economy', 'Large Capacity'],
    cons: ['High Competition'],
    // Score Engine Dimensions
    D1_Product_Compat: 0.92,
    D2_Geography_Fit: 0.88,
    D3_Trade_Capacity: 0.85,
    D4_Intent_Activity: 0.95,
    D5_Reliability: 0.90,
    Final_Match_Score: 0.90,
    Risk_Friction: 0.08,
    Risk_Label: 'Low',
    Match_Type: 'Primary',
    // Weights and Status
    weights: {
      D1: 0.25,
      D2: 0.20,
      D3: 0.15,
      D4: 0.25,
      D5: 0.15
    },
    dimension_status: {
      D1: 'LOCKED',
      D2: 'LOCKED',
      D3: 'LOCKED',
      D4: 'adaptive',
      D5: 'adaptive'
    }
  },
  {
    name: 'Asia Imports Ltd',
    country: 'Singapore',
    industry: 'Electronics',
    intent_score: 88,
    response_probability: 75,
    prompt_response: 85,
    trade_volume: '$200K - $500K',
    status: 'pending',
    team_size: 180,
    summary: 'Emerging market player with strong intent signals. Good geographical fit for Southeast Asian trade routes.',
    pros: ['Growing Intent', 'Strategic Location', 'Mobile Presence'],
    cons: ['Newer Market'],
    // Score Engine Dimensions
    D1_Product_Compat: 0.85,
    D2_Geography_Fit: 0.94,
    D3_Trade_Capacity: 0.78,
    D4_Intent_Activity: 0.88,
    D5_Reliability: 0.82,
    Final_Match_Score: 0.85,
    Risk_Friction: 0.12,
    Risk_Label: 'Low',
    Match_Type: 'Primary',
    // Weights and Status
    weights: {
      D1: 0.25,
      D2: 0.20,
      D3: 0.15,
      D4: 0.25,
      D5: 0.15
    },
    dimension_status: {
      D1: 'LOCKED',
      D2: 'LOCKED',
      D3: 'LOCKED',
      D4: 'adaptive',
      D5: 'adaptive'
    }
  },
  {
    name: 'Euro Goods GmbH',
    country: 'Germany',
    industry: 'Electronics',
    intent_score: 92,
    response_probability: 85,
    prompt_response: 88,
    trade_volume: '$1M - $2M',
    status: 'pending',
    team_size: 450,
    summary: 'Premium electronics supplier with exceptional reliability ratings. Ideal for high-value trade partnerships.',
    pros: ['Premium Quality', 'ISO Certified', 'Large Orders'],
    cons: ['High Standards'],
    // Score Engine Dimensions
    D1_Product_Compat: 0.95,
    D2_Geography_Fit: 0.91,
    D3_Trade_Capacity: 0.92,
    D4_Intent_Activity: 0.92,
    D5_Reliability: 0.97,
    Final_Match_Score: 0.93,
    Risk_Friction: 0.06,
    Risk_Label: 'Low',
    Match_Type: 'Primary',
    // Weights and Status
    weights: {
      D1: 0.25,
      D2: 0.20,
      D3: 0.15,
      D4: 0.25,
      D5: 0.15
    },
    dimension_status: {
      D1: 'LOCKED',
      D2: 'LOCKED',
      D3: 'LOCKED',
      D4: 'adaptive',
      D5: 'adaptive'
    }
  },
  {
    name: 'Pacific Electronics',
    country: 'Japan',
    industry: 'Electronics',
    intent_score: 80,
    response_probability: 78,
    prompt_response: 82,
    trade_volume: '$300K - $800K',
    status: 'pending',
    team_size: 320,
    summary: 'Leading electronics manufacturer with strong intent in expanding Indian partnerships. Excellent compliance record.',
    pros: ['Tech Expertise', 'Responsive', 'Scalable'],
    cons: ['Competitive Market'],
    // Score Engine Dimensions
    D1_Product_Compat: 0.88,
    D2_Geography_Fit: 0.85,
    D3_Trade_Capacity: 0.87,
    D4_Intent_Activity: 0.80,
    D5_Reliability: 0.88,
    Final_Match_Score: 0.86,
    Risk_Friction: 0.10,
    Risk_Label: 'Low',
    Match_Type: 'Primary',
    // Weights and Status
    weights: {
      D1: 0.25,
      D2: 0.20,
      D3: 0.15,
      D4: 0.25,
      D5: 0.15
    },
    dimension_status: {
      D1: 'LOCKED',
      D2: 'LOCKED',
      D3: 'LOCKED',
      D4: 'adaptive',
      D5: 'adaptive'
    }
  },
  {
    name: 'MediTrade Solutions',
    country: 'Switzerland',
    industry: 'Electronics',
    intent_score: 85,
    response_probability: 82,
    prompt_response: 86,
    trade_volume: '$400K - $1M',
    status: 'pending',
    team_size: 210,
    summary: 'High-compliance electronics buyer with proven track record. Strong fit for regulated products.',
    pros: ['Compliance Expert', 'Steady Growth', 'Premium Pricing'],
    cons: ['Strict Requirements'],
    // Score Engine Dimensions
    D1_Product_Compat: 0.93,
    D2_Geography_Fit: 0.89,
    D3_Trade_Capacity: 0.81,
    D4_Intent_Activity: 0.85,
    D5_Reliability: 0.95,
    Final_Match_Score: 0.88,
    Risk_Friction: 0.09,
    Risk_Label: 'Low',
    Match_Type: 'Primary',
    // Weights and Status
    weights: {
      D1: 0.25,
      D2: 0.20,
      D3: 0.15,
      D4: 0.25,
      D5: 0.15
    },
    dimension_status: {
      D1: 'LOCKED',
      D2: 'LOCKED',
      D3: 'LOCKED',
      D4: 'adaptive',
      D5: 'adaptive'
    }
  },
  {
    name: 'Quantum Logistics',
    country: 'UAE',
    industry: 'Electronics',
    intent_score: 78,
    response_probability: 72,
    prompt_response: 76,
    trade_volume: '$150K - $400K',
    status: 'pending',
    team_size: 140,
    summary: 'Middle East electronics gateway with developing intent signals. Growing operations in South Asia trade.',
    pros: ['Hub Location', 'Fast Growth'],
    cons: ['Political Risk', 'Emerging'],
    // Score Engine Dimensions
    D1_Product_Compat: 0.76,
    D2_Geography_Fit: 0.88,
    D3_Trade_Capacity: 0.72,
    D4_Intent_Activity: 0.78,
    D5_Reliability: 0.75,
    Final_Match_Score: 0.78,
    Risk_Friction: 0.18,
    Risk_Label: 'Medium',
    Match_Type: 'Adjacent',
    // Weights and Status
    weights: {
      D1: 0.25,
      D2: 0.20,
      D3: 0.15,
      D4: 0.25,
      D5: 0.15
    },
    dimension_status: {
      D1: 'LOCKED',
      D2: 'LOCKED',
      D3: 'LOCKED',
      D4: 'adaptive',
      D5: 'adaptive'
    }
  },
  {
    name: 'TechTrade Americas',
    country: 'Canada',
    industry: 'Electronics',
    intent_score: 82,
    response_probability: 76,
    prompt_response: 80,
    trade_volume: '$250K - $600K',
    status: 'pending',
    team_size: 160,
    summary: 'Established North American electronics trader with solid intent metrics. Good partnership potential.',
    pros: ['Tech Savvy', 'North American Hub'],
    cons: ['Distance Factor'],
    // Score Engine Dimensions
    D1_Product_Compat: 0.82,
    D2_Geography_Fit: 0.80,
    D3_Trade_Capacity: 0.83,
    D4_Intent_Activity: 0.82,
    D5_Reliability: 0.86,
    Final_Match_Score: 0.82,
    Risk_Friction: 0.11,
    Risk_Label: 'Low',
    Match_Type: 'Primary',
    // Weights and Status
    weights: {
      D1: 0.25,
      D2: 0.20,
      D3: 0.15,
      D4: 0.25,
      D5: 0.15
    },
    dimension_status: {
      D1: 'LOCKED',
      D2: 'LOCKED',
      D3: 'LOCKED',
      D4: 'adaptive',
      D5: 'adaptive'
    }
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
    console.log('✅ Data Imported Successfully!');
    console.log(`✅ Seeded ${seedImporters.length} importers with score engine data`);
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

importData();
