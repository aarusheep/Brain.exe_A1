const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Importer = require('./models/Importer');
const Exporter = require('./models/Exporter');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const importCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

const seedData = async () => {
  try {
    // 1. Clear Database
    await Importer.deleteMany();
    await Exporter.deleteMany();
    console.log('Cleared existing data...');

    // 2. Load Exporters (Example: Take 1st one or a few)
    const exportersData = await importCSV(path.join(__dirname, 'data', 'exporters.csv'));
    // We only need one example exporter for the demo context
    // Mapping CSV fields to Schema if needed
    // Assuming CSV headers match somewhat or we just store raw for this MVP
    if (exportersData.length > 0) {
      const demoExporter = {
        id: exportersData[0].Exporter_ID,
        country: exportersData[0].Country,
        industry: exportersData[0].Industry,
        manufacturing_capacity: parseFloat(exportersData[0].Manufacturing_Capacity_Tons) || 0,
        msme_status: exportersData[0].MSME_Udyam,
        certification: exportersData[0].Certification
      };
      await Exporter.create(demoExporter);
      console.log(`Seeded Exporter: ${demoExporter.id}`);
    }


    // 3. Load Importers
    const importersData = await importCSV(path.join(__dirname, 'data', 'importers.csv'));

    // Transform CSV data to match Mongoose Schema
    const importersToInsert = importersData.map(row => ({
      name: row.Buyer_ID || 'Unknown Buyer', // CSV doesn't have "Name" but has Buyer_ID
      country: row.Country,
      industry: row.Industry,

      // Metrics
      intent_score: parseFloat(row.Intent_Score) || 0,
      response_probability: parseFloat(row.Response_Probability) || 0,
      prompt_response: parseFloat(row.Prompt_Response) || 0,
      trade_volume: row.Avg_Order_Tons, // Mapping similar field

      // Full Data Points
      avg_order_tons: parseFloat(row.Avg_Order_Tons) || 0,
      revenue: parseFloat(row.Revenue_Size_USD) || 0,
      team_size: parseFloat(row.Team_Size) || 0,
      certification: row.Certification,
      good_payment_history: parseInt(row.Good_Payment_History) === 1,
      hiring_growth: parseInt(row.Hiring_Growth) === 1,
      funding_event: row.Funding_Event,
      engagement_spike: parseInt(row.Engagement_Spike) === 1,
      sales_nav_visits: parseFloat(row.SalesNav_ProfileVisits) || 0,
      decision_maker_change: parseInt(row.DecisionMaker_Change) === 1,
      preferred_channel: row.Preferred_Channel,

      // Risk Booleans
      tariff_news: parseInt(row.Tariff_News) === 1,
      stock_market_shock: parseInt(row.StockMarket_Shock) === 1,
      war_event: parseInt(row.War_Event) === 1,
      natural_calamity: parseInt(row.Natural_Calamity) === 1,
      currency_fluctuation: parseFloat(row.Currency_Fluctuation) || 0,

      status: 'pending', // Default all to pending
    }));

    // Insert in chunks if too large
    // We'll insert enough for the flow.
    await Importer.insertMany(importersToInsert.slice(0, 500));

    console.log(`Seeded ${Math.min(importersToInsert.length, 500)} Importers.`);

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
