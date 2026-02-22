const Importer = require('../models/Importer');
const axios = require('axios');

const PYTHON_AI_URL = 'http://localhost:8000';
const DEFAULT_EXPORTER_ID = 'EXP_1715'; // Hardcoded for demo flow
const TOP_N = 7; // Top 7 cards as per requirements

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

// Helper to parse and update importer with score engine data including weights
const updateImporterWithScores = async (importer, scoreData) => {
  if (!scoreData) return importer;

  importer.D1_Product_Compat = scoreData.D1 || scoreData.D1_Product_Compat || 0;
  importer.D2_Geography_Fit = scoreData.D2 || scoreData.D2_Geography_Fit || 0;
  importer.D3_Trade_Capacity = scoreData.D3 || scoreData.D3_Trade_Capacity || 0;
  importer.D4_Intent_Activity = scoreData.D4 || scoreData.D4_Intent_Activity || 0;
  importer.D5_Reliability = scoreData.D5 || scoreData.D5_Reliability || 0;
  importer.Final_Match_Score = scoreData.Final_Match_Score || scoreData.Raw_Score || 0;
  importer.Risk_Friction = scoreData.Risk_Friction || 0;
  importer.Risk_Label = scoreData.Risk_Label || 'Medium';
  importer.Match_Type = scoreData.Match_Type || 'Primary';

  // Store weights from score engine
  if (scoreData.weights) {
    importer.weights = {
      D1: scoreData.weights.D1_Product_Compat || 0.30,
      D2: scoreData.weights.D2_Geography_Fit || 0.20,
      D3: scoreData.weights.D3_Trade_Capacity || 0.20,
      D4: scoreData.weights.D4_Intent_Activity || 0.20,
      D5: scoreData.weights.D5_Reliability || 0.10,
    };
  }

  // Store status (locked/adaptive)
  importer.dimension_status = scoreData.dimension_status || {
    D1: 'LOCKED',
    D2: 'LOCKED',
    D3: 'LOCKED',
    D4: 'adaptive',
    D5: 'adaptive'
  };

  if (scoreData.reasoning) {
    importer.summary = scoreData.reasoning;
  }

  return importer;
};

// @desc    Get top ranked pending importers (via AI Engine) - Top 7 from Score Engine
// @route   GET /api/importers
const getTopImporters = async (req, res) => {
  try {
    let enrichedBuyers = [];
    let aiRound = 1;
    let aiWeights = null;

    // Try to fetch from Python Score Engine first
    try {
      console.log(`Fetching recommendations for ${DEFAULT_EXPORTER_ID} from Python Score Engine...`);
      const response = await axios.get(`${PYTHON_AI_URL}/recommendations?limit=${TOP_N}`);
      const aiData = response.data;
      
      aiRound = aiData.round || 1;
      aiWeights = aiData.weights;
      const buyers = aiData.buyers || [];

      console.log(`✅ Score Engine returned ${buyers.length} buyers for round ${aiRound}`);

      // Process buyers from score engine
      for (const buyerData of buyers.slice(0, TOP_N)) {
        try {
          let importer = await Importer.findOne({ name: buyerData.Buyer_ID || buyerData.name });
          
          if (!importer) {
            importer = new Importer({
              name: buyerData.Buyer_ID || buyerData.name,
              country: buyerData.Country || buyerData.country || 'Unknown',
              industry: buyerData.Industry || buyerData.industry || 'Electronics',
              status: 'pending',
            });
          }

          // Update with score engine data including weights
          importer = await updateImporterWithScores(importer, {
            ...buyerData,
            weights: aiWeights
          });
          await importer.save();
          enrichedBuyers.push(importer);
        } catch (err) {
          console.error(`Error processing buyer ${buyerData.name}:`, err.message);
        }
      }
    } catch (err) {
      console.log(`⚠️  Score Engine not available (${err.message}), falling back to MongoDB Electronics suppliers...`);
      
      // Fallback: Get Electronics suppliers from MongoDB (EXP_1715's industry)
      const electronics = await Importer.find({
        industry: { $regex: 'Electronics', $options: 'i' },
        status: 'pending'
      })
        .sort({ Final_Match_Score: -1 })
        .limit(TOP_N);

      enrichedBuyers = electronics;
    }

    // Ensure we have buyers to return
    if (enrichedBuyers.length === 0) {
      console.log('No electronics suppliers found, returning all pending importers...');
      enrichedBuyers = await Importer.find({ status: 'pending' })
        .sort({ Final_Match_Score: -1 })
        .limit(TOP_N);
    }

    res.json(enrichedBuyers);

  } catch (error) {
    console.error("Error in getTopImporters:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get approved and accepted importers
// @route   GET /api/importers/approved
const getApprovedImporters = async (req, res) => {
  try {
    const approved = await Importer.find({
      $or: [
        { status: 'accepted' },
        { status: 'approved' }
      ]
    })
      .sort({ Final_Match_Score: -1, updatedAt: -1 })
      .lean();

    res.json(approved);
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

  if (!['accepted', 'rejected', 'approved'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const importer = await Importer.findById(req.params.id);
    if (!importer) return res.status(404).json({ message: 'Importer not found' });

    // Update MongoDB
    importer.status = status === 'approved' ? 'accepted' : status;
    await importer.save();

    // Notify Python AI Engine
    // Map _id/name to Buyer_ID
    const buyerId = importer.name; // In seed_csv.js we mapped Buyer_ID -> name

    // Construct payload
    const payload = {
      accepted_ids: status === 'accepted' || status === 'approved' ? [buyerId] : [],
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

// @desc    Get humanized summary for a specific importer
// @route   GET /api/importers/:id/summary
const getImporterSummary = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the importer by ID or name
    const importer = await Importer.findOne({
      $or: [
        { _id: id },
        { name: id }
      ]
    });

    if (!importer) {
      return res.status(404).json({ message: 'Importer not found' });
    }

    // Generate humanized summary from score data
    const humanizedSummary = generateHumanizedSummary(importer);

    res.json({
      _id: importer._id,
      name: importer.name,
      country: importer.country,
      industry: importer.industry,
      humanized_summary: humanizedSummary,
      dimensions: {
        D1_Product_Compat: importer.D1_Product_Compat,
        D2_Geography_Fit: importer.D2_Geography_Fit,
        D3_Trade_Capacity: importer.D3_Trade_Capacity,
        D4_Intent_Activity: importer.D4_Intent_Activity,
        D5_Reliability: importer.D5_Reliability
      },
      scores: {
        Final_Match_Score: importer.Final_Match_Score,
        Risk_Friction: importer.Risk_Friction,
        Risk_Label: importer.Risk_Label
      }
    });
  } catch (error) {
    console.error("Error in getImporterSummary:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to generate humanized summary from importer data
const generateHumanizedSummary = (importer) => {
  const productScore = importer.D1_Product_Compat || 0;
  const geoScore = importer.D2_Geography_Fit || 0;
  const capacityScore = importer.D3_Trade_Capacity || 0;
  const intentScore = importer.D4_Intent_Activity || 0;
  const reliabilityScore = importer.D5_Reliability || 0;
  const overallScore = importer.Final_Match_Score || 0;
  const riskFriction = importer.Risk_Friction || 0;

  // Build summary text
  let summary = `${importer.name} is a ${importer.industry} importer based in ${importer.country}. `;

  // Product Compatibility
  if (productScore > 0.8) {
    summary += `The company demonstrates excellent product compatibility with a strong alignment to our offerings. `;
  } else if (productScore > 0.6) {
    summary += `The company shows good product compatibility with moderate alignment to our product range. `;
  } else {
    summary += `The company has developing product compatibility with room for alignment improvement. `;
  }

  // Geographic Fit
  if (geoScore > 0.8) {
    summary += `Geographically, they are exceptionally well-positioned with excellent regional market access. `;
  } else if (geoScore > 0.6) {
    summary += `Their geographic location provides good market access and distribution advantages. `;
  } else {
    summary += `Geographic positioning requires consideration but remains viable for our strategy. `;
  }

  // Trading Capacity
  if (capacityScore > 0.8) {
    summary += `With significant trading capacity of ${importer.trade_volume || 'substantial volume'}, they can handle large orders efficiently. `;
  } else if (capacityScore > 0.6) {
    summary += `Trading capacity is adequate at ${importer.trade_volume || 'moderate volume'} for sustained business. `;
  } else {
    summary += `Trading capacity at ${importer.trade_volume || 'lower volumes'} suggests focused niche engagement. `;
  }

  // Intent & Activity
  if (intentScore > 0.8) {
    summary += `Market intent signals are very strong with active engagement indicators across multiple channels. `;
  } else if (intentScore > 0.6) {
    summary += `The company shows solid intent with consistent market engagement. `;
  } else {
    summary += `Market intent indicators suggest cautious approach warranted. `;
  }

  // Reliability
  if (reliabilityScore > 0.85) {
    summary += `Reliability metrics are exceptional with ${importer.team_size || 'a strong'} team and proven operational excellence. `;
  } else if (reliabilityScore > 0.7) {
    summary += `The company maintains good reliability standards with a ${importer.team_size || 'capable'} team structure. `;
  } else {
    summary += `Reliability monitoring recommended with current team of ${importer.team_size || 'limited'} members. `;
  }

  // Overall Assessment
  const overallPercent = Math.round(overallScore * 100);
  summary += `\n\nOverall Match: ${overallPercent}% compatibility. `;

  if (overallScore > 0.85) {
    summary += `This is a premium match opportunity with minimal risk factors. `;
  } else if (overallScore > 0.70) {
    summary += `This represents a strong match with manageable risk considerations. `;
  } else if (overallScore > 0.55) {
    summary += `This is a viable match with moderate risk that warrants careful management. `;
  } else {
    summary += `This requires significant risk mitigation before proceeding. `;
  }

  // Risk Assessment
  if (importer.Risk_Label === 'Low') {
    summary += `Risk friction indicators at ${(riskFriction).toFixed(3)} suggest a low-risk partnership. `;
  } else if (importer.Risk_Label === 'Medium') {
    summary += `With risk friction at ${(riskFriction).toFixed(3)}, moderate safeguards are recommended. `;
  } else {
    summary += `Risk friction at ${(riskFriction).toFixed(3)} indicates heightened caution necessary. `;
  }

  // Trade Recommendations
  if (overallScore > 0.75 && importer.Risk_Label === 'Low') {
    summary += `\n\nRecommendation: HIGHLY RECOMMENDED for partnership discussion. Strong fundamentals with minimal risk.`;
  } else if (overallScore > 0.65) {
    summary += `\n\nRecommendation: RECOMMENDED for further engagement with standard due diligence.`;
  } else if (overallScore > 0.50) {
    summary += `\n\nRecommendation: CONSIDER with enhanced due diligence and risk mitigation strategies.`;
  } else {
    summary += `\n\nRecommendation: REVIEW further before commitment. Address key risk areas first.`;
  }

  return summary;
};

module.exports = { getTopImporters, getApprovedImporters, getImporterSummary, reviewImporter };

