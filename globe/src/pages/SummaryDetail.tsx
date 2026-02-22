import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Share2, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

interface BuyerSummary {
  _id: string;
  companyName: string;
  country: string;
  industry: string;
  D1_Product_Compat?: number;
  D2_Geography_Fit?: number;
  D3_Trade_Capacity?: number;
  D4_Intent_Activity?: number;
  D5_Reliability?: number;
  Final_Match_Score?: number;
  Risk_Friction?: number;
  Risk_Label?: string;
  Match_Type?: string;
  summary?: string;
  team_size?: number;
  trade_volume?: string;
  revenue?: string;
  avg_order_tons?: number;
  estimatedValue?: string;
  companySize?: string;
}

interface ChartData {
  month: string;
  avgOrder: number;
  revenue: number;
}

const SummaryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [buyer, setBuyer] = useState<BuyerSummary | null>(null);
  const [humanizedSummary, setHumanizedSummary] = useState<string>('');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBuyerDetails();
  }, [id]);

  const fetchBuyerDetails = async () => {
    try {
      setLoading(true);
      // Fetch buyer from API
      const response = await fetch('http://localhost:5000/api/importers');
      const importers = await response.json();
      
      // Find the importer matching the ID (could be by name or _id)
      const found = importers.find(
        (imp: any) => 
          imp._id === id || 
          imp.name.replace(/\s+/g, '-') === id ||
          imp.companyName?.replace(/\s+/g, '-') === id
      );

      if (!found) {
        setError('Buyer not found');
        return;
      }

      setBuyer(found);
      
      // Fetch humanized summary from backend
      const summaryResponse = await fetch(`http://localhost:5000/api/importers/${found._id}/summary`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setHumanizedSummary(summaryData.humanized_summary || found.summary || '');
      } else {
        setHumanizedSummary(found.summary || '');
      }

      // Generate mock chart data based on buyer metrics
      generateChartData(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load buyer details');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (buyer: BuyerSummary) => {
    // Generate realistic chart data based on buyer data
    const baseAvgOrder = buyer.avg_order_tons || 50;
    const baseRevenue = parseInt(buyer.revenue?.replace(/\D/g, '') || '500') * 1000;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data: ChartData[] = months.map((month, idx) => ({
      month,
      avgOrder: baseAvgOrder + Math.sin(idx) * 15 + Math.random() * 10,
      revenue: baseRevenue + (idx * baseRevenue * 0.08) + Math.random() * baseRevenue * 0.1
    }));

    setChartData(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  if (error || !buyer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <AlertCircle size={24} />
            <h2 className="text-xl font-bold">Error</h2>
          </div>
          <p className="text-slate-600 mb-6">{error || 'Buyer not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  const finalScore = Math.round((buyer.Final_Match_Score || 0) * 100);
  const dimensions = [
    { label: 'D1: Product Compat', value: buyer.D1_Product_Compat || 0 },
    { label: 'D2: Geography Fit', value: buyer.D2_Geography_Fit || 0 },
    { label: 'D3: Trade Capacity', value: buyer.D3_Trade_Capacity || 0 },
    { label: 'D4: Intent & Activity', value: buyer.D4_Intent_Activity || 0 },
    { label: 'D5: Reliability', value: buyer.D5_Reliability || 0 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-lg bg-white/80 border-b border-blue-100/20 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-semibold"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Share2 size={20} className="text-slate-600" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Download size={20} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto px-6 py-12"
      >
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 text-white mb-8 shadow-lg">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{buyer.companyName}</h1>
              <p className="text-blue-100 text-lg flex items-center gap-2">
                {buyer.country} • {buyer.industry}
              </p>
              {buyer.Match_Type && (
                <div className="mt-3 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur">
                  <CheckCircle size={14} />
                  <span className="text-sm font-semibold">{buyer.Match_Type} Match</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{finalScore}%</div>
              <div className="text-blue-100 text-sm font-medium">Overall Match Score</div>
              {buyer.Risk_Label && (
                <div className={`mt-3 px-4 py-2 rounded-lg font-semibold text-sm ${
                  buyer.Risk_Label === 'Low' ? 'bg-emerald-400' :
                  buyer.Risk_Label === 'Medium' ? 'bg-amber-400' :
                  buyer.Risk_Label === 'High' ? 'bg-orange-400' :
                  'bg-rose-400'
                }`}>
                  {buyer.Risk_Label} Risk
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column: Company Info & Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Details */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-blue-100/20">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Company Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase font-bold text-slate-500 mb-1">Team Size</p>
                  <p className="text-lg font-semibold text-slate-900">{buyer.team_size || 'N/A'} employees</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-slate-500 mb-1">Trade Volume</p>
                  <p className="text-lg font-semibold text-slate-900">{buyer.trade_volume || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-slate-500 mb-1">Annual Revenue</p>
                  <p className="text-lg font-semibold text-slate-900">{buyer.revenue || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-slate-500 mb-1">Avg Order</p>
                  <p className="text-lg font-semibold text-slate-900">{buyer.avg_order_tons || 'N/A'} tons</p>
                </div>
              </div>
            </div>

            {/* AI-Generated Humanized Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-md p-6 border border-blue-200/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <h3 className="text-xl font-bold text-slate-900">AI-Generated Insights</h3>
              </div>
              <p className="text-slate-700 leading-relaxed text-base">
                {humanizedSummary || 'Generating insights...'}
              </p>
            </div>

            {/* Dimension Breakdown */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-blue-100/20">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Score Breakdown</h3>
              <div className="space-y-3">
                {dimensions.map((dim, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold text-slate-700">{dim.label}</span>
                      <span className="text-sm font-bold text-slate-900">{Math.round(dim.value * 100)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dim.value * 100}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Key Metrics Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-md p-6 border border-blue-100/20 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Key Metrics</h3>
              
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                  <p className="text-xs uppercase font-bold text-blue-600 mb-1">Final Match Score</p>
                  <p className="text-3xl font-bold text-blue-900">{(buyer.Final_Match_Score || 0).toFixed(2)}</p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl">
                  <p className="text-xs uppercase font-bold text-amber-600 mb-1">Risk Friction</p>
                  <p className="text-3xl font-bold text-amber-900">{(buyer.Risk_Friction || 0).toFixed(3)}</p>
                </div>

                <div className={`p-4 rounded-xl ${
                  buyer.Risk_Label === 'Low' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100' :
                  buyer.Risk_Label === 'Medium' ? 'bg-gradient-to-br from-amber-50 to-amber-100' :
                  'bg-gradient-to-br from-rose-50 to-rose-100'
                }`}>
                  <p className={`text-xs uppercase font-bold mb-1 ${
                    buyer.Risk_Label === 'Low' ? 'text-emerald-600' :
                    buyer.Risk_Label === 'Medium' ? 'text-amber-600' :
                    'text-rose-600'
                  }`}>Risk Assessment</p>
                  <p className={`text-2xl font-bold ${
                    buyer.Risk_Label === 'Low' ? 'text-emerald-900' :
                    buyer.Risk_Label === 'Medium' ? 'text-amber-900' :
                    'text-rose-900'
                  }`}>{buyer.Risk_Label || 'Medium'}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-blue-100/20 space-y-3">
              <h3 className="text-lg font-bold text-slate-900">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Country</span>
                  <span className="font-semibold text-slate-900">{buyer.country}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Industry</span>
                  <span className="font-semibold text-slate-900">{buyer.industry}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Match Type</span>
                  <span className="font-semibold text-slate-900">{buyer.Match_Type || 'Primary'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Average Order vs Date */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-md p-6 border border-blue-100/20"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4">Average Order Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgOrder" 
                  stroke="#2563eb" 
                  name="Avg Order (tons)"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Revenue vs Date */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-md p-6 border border-blue-100/20"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  fill="#4f46e5" 
                  name="Revenue ($)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Combined View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6 border border-blue-100/20"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4">Performance Overview (Avg Order + Revenue)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis yAxisId="left" stroke="#64748b" />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avgOrder" 
                  stroke="#2563eb" 
                  name="Avg Order (tons)"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb' }}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="revenue" 
                  fill="#4f46e5" 
                  name="Revenue ($)"
                  opacity={0.7}
                  radius={[8, 8, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="flex gap-4 justify-center pb-8"
        >
          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
            Approve Buyer
          </button>
          <button className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all">
            Reject Buyer
          </button>
          <button className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-all">
            Request More Info
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SummaryDetail;
