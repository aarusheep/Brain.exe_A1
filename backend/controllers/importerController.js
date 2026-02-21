const Importer = require('../models/Importer');
const axios = require('axios');

// Gemini API Helper (to be used internally or via dedicated endpoint)
const generateReasoning = async (importerData) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { summary: "Gemini API Key missing", pros: [], cons: [] };

    const prompt = `
    Analyze the following importer data and provide a concise summary reasoning for exporting to them.
    Also generate a list of Pros (positive aspects) and Cons (negative risks).
    Importer: ${JSON.stringify(importerData)}
    
    Response format (JSON):
    {
      "summary": "...",
      "pros": ["..."],
      "cons": ["..."]
    }
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const text = response.data.candidates[0].content.parts[0].text;
    // Attempt to extract JSON from the text response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { summary: text, pros: [], cons: [] };
    } catch (e) {
      return { summary: text, pros: [], cons: [] };
    }

  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    return { summary: "Error generating content", pros: [], cons: [] };
  }
};


// @desc    Get top 15 ranked pending importers
// @route   GET /api/importers
// @access  Private (or Public for now)
const getTopImporters = async (req, res) => {
  try {
    // Logic: Fetch top 15 'pending' importers sorted by rank or score
    // Assuming 'rank' or 'intent_score' is populated.
    const importers = await Importer.find({ status: 'pending' })
      .sort({ score: -1 }) // or rank: 1
      .limit(15);

    // Create new array with summaries if missing (lazy load summary)
    // In a real app, this might be async or background job.
    // For demo, we might return as is, or trigger summary generation if missing.

    res.json(importers);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    // Generate new summary
    const aiData = await generateReasoning(importer);

    // Update DB
    importer.summary = aiData.summary;
    importer.pros = aiData.pros;
    importer.cons = aiData.cons;
    await importer.save();

    res.json(aiData);
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

    importer.status = status;
    await importer.save();

    res.json({ message: `Importer marked as ${status}`, id: importer._id });

    // NOTE: Rejected cards logic
    // "after 15 card the rejected cards are sent to the remaining card and they are scored again"
    // This implies triggering a re-score or ensuring we have enough pending cards.
    // We assume the DB has 12000 items, so `getTopImporters` will simply fetch the *next* available ones
    // since we filtered by status='pending'. 

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = { getTopImporters, getImporterSummary, reviewImporter };
