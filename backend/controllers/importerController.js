const Importer = require('../models/Importer');
const axios = require('axios');

const PYTHON_AI_URL = 'http://localhost:8000';
const DEFAULT_EXPORTER_ID = 'EXP_1715'; // Hardcoded for demo flow

// Helper to init session if needed
const ensureSessionInitialized = async () => {
  try {
    // Try to init session
    await axios.post(`${PYTHON_AI_URL}/session/init`, {
      exporter_id: DEFAULT_EXPORTER_ID
    });
    console.log('Python Session Initialized');
  } catch (error) {
    console.error('Failed to init Python session:', error.message);
  }
};

// @desc    Get top ranked pending importers (via AI Engine)
// @route   GET /api/importers
const getTopImporters = async (req, res) => {
  try {
    let response;
    try {
      response = await axios.get(`${PYTHON_AI_URL}/recommendations?limit=10`);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        // Session not init, try initializing
        await ensureSessionInitialized();
        response = await axios.get(`${PYTHON_AI_URL}/recommendations?limit=10`);
      } else {
        throw err;
      }
    }

    const aiData = response.data; // { round, weights, buyers: [...] }

    // Return the AI data directly as it contains the rich scoring breakdown
    // If the frontend expects a flat array, we return aiData.buyers
    res.json(aiData.buyers);

  } catch (error) {
    console.error("AI Engine Error:", error.message);
    // Fallback to MongoDB if Python fails
    console.log("Falling back to MongoDB...");
    const importers = await Importer.find({ status: 'pending' })
      .sort({ score: -1, intent_score: -1 })
      .limit(10);
    res.json(importers);
  }
};

// @desc    Get details including AI summary for a specific importer
// @route   GET /api/importers/:id/summary
// @access  Private
const getImporterSummary = async (req, res) => {
  try {
    const importer = await Importer.findById(req.params.id);
    if (!importer) return res.status(404).json({ message: 'Importer not found' });

    // If summary already exists, return it
    if (importer.summary && importer.pros.length > 0) {
      return res.json({
        summary: importer.summary,
        pros: importer.pros,
        cons: importer.cons
      });
    }

    // Generate generative reasoning using Gemini via another endpoint or service
    // For now returning mock or existing if any
    res.json({
      summary: "AI Summary not generated yet.",
      pros: [],
      cons: []
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept or Reject an importer
// @route   POST /api/importers/:id/review
// @access  Private
const reviewImporter = async (req, res) => {
  const { status } = req.body; // 'accepted' or 'rejected'

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const importer = await Importer.findById(req.params.id);
    if (!importer) return res.status(404).json({ message: 'Importer not found' });

    // Update MongoDB
    importer.status = status;
    await importer.save();

    // Notify Python AI Engine
    // Map _id/name to Buyer_ID
    const buyerId = importer.name; // In seed_csv.js we mapped Buyer_ID -> name

    // Construct payload
    const payload = {
      accepted_ids: status === 'accepted' ? [buyerId] : [],
      rejected_ids: status === 'rejected' ? [buyerId] : []
    };

    try {
      await axios.post(`${PYTHON_AI_URL}/feedback`, payload);
      console.log(`Feedback sent to AI Engine for ${buyerId}: ${status}`);
    } catch (aiError) {
      console.error("Failed to send feedback to AI Engine:", aiError.message);
      // Don't fail the request if AI creates an error, just log it
    }

    res.json({ message: `Importer marked as ${status}`, id: importer._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTopImporters, getImporterSummary, reviewImporter };

