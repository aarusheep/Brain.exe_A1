import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { MapPin, Building2, Mail, Linkedin, Users, DollarSign, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import type { Lead } from '@/lib/leadData';
import { cn } from '@/lib/utils';

interface SwipeCardProps {
    lead: Lead & {
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
        weights?: {
            D1?: number;
            D2?: number;
            D3?: number;
            D4?: number;
            D5?: number;
        };
        dimension_status?: {
            D1?: string;
            D2?: string;
            D3?: string;
            D4?: string;
            D5?: string;
        };
    };
    onSwipe: (direction: 'left' | 'right') => void;
    isFront?: boolean;
}

const ScoreDimension: React.FC<{ 
    label: string; 
    value: number; 
    color: string;
    weight?: number;
    status?: string;
}> = ({ label, value, color, weight, status }) => {
    const percentage = Math.round(value * 100);
    const isAdaptive = status && status.toLowerCase().includes('adaptive');
    
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center gap-2">
                <div className="flex-1 min-w-0">
                    <span className="text-[9px] uppercase font-bold text-slate-500">{label}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 text-right">
                    <span className="text-[11px] font-bold text-slate-700">{percentage}%</span>
                    {weight !== undefined && (
                        <span className="text-[9px] text-slate-500 font-medium">(W: {weight.toFixed(2)})</span>
                    )}
                </div>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
            {status && (
                <div className="text-[8px] font-semibold text-slate-500 mt-0.5">
                    {isAdaptive ? '← adaptive' : `[${status.toUpperCase()}]`}
                </div>
            )}
        </div>
    );
};

const RiskBadge: React.FC<{ risk: string }> = ({ risk }) => {
    const riskConfig: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
        'Low': {
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
            border: 'border-emerald-200',
            icon: <TrendingUp size={14} />
        },
        'Medium': {
            bg: 'bg-amber-50',
            text: 'text-amber-600',
            border: 'border-amber-200',
            icon: <AlertCircle size={14} />
        },
        'High': {
            bg: 'bg-orange-50',
            text: 'text-orange-600',
            border: 'border-orange-200',
            icon: <AlertCircle size={14} />
        },
        'Very High': {
            bg: 'bg-rose-50',
            text: 'text-rose-600',
            border: 'border-rose-200',
            icon: <AlertCircle size={14} />
        }
    };

    const config = riskConfig[risk] || riskConfig['Medium'];

    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${config.bg} ${config.text} ${config.border}`}>
            {config.icon}
            <span className="text-[10px] font-bold uppercase tracking-wide">{risk}</span>
        </div>
    );
};

const SwipeCard: React.FC<SwipeCardProps> = ({ lead, onSwipe, isFront }) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
    const approveOpacity = useTransform(x, [50, 150], [0, 1]);
    const rejectOpacity = useTransform(x, [-50, -150], [0, 1]);

    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.x > 150) {
            onSwipe('right');
        } else if (info.offset.x < -150) {
            onSwipe('left');
        }
    };

    // Dimension colors
    const dimensionColors = {
        D1: 'bg-blue-400',
        D2: 'bg-purple-400',
        D3: 'bg-indigo-400',
        D4: 'bg-cyan-400',
        D5: 'bg-teal-400'
    };

    const finalScore = Math.round((lead.Final_Match_Score || lead.matchPercentage / 100) * 100);
    const riskLabel = lead.Risk_Label || 'Medium';

    return (
        <motion.div
            style={{ x, rotate, opacity }}
            drag={isFront ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "absolute w-full max-w-sm h-auto min-h-[600px] cursor-grab active:cursor-grabbing",
                "bg-white rounded-3xl p-7 shadow-2xl border border-slate-100 flex flex-col justify-between select-none",
                !isFront && "pointer-events-none opacity-90"
            )}
        >
            {/* Overlays for Visual Feedback */}
            <motion.div
                style={{ opacity: approveOpacity }}
                className="absolute inset-0 bg-emerald-500/10 pointer-events-none rounded-3xl flex items-center justify-center border-4 border-emerald-500/20 z-10"
            >
                <div className="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest shadow-lg text-sm">Approve</div>
            </motion.div>
            <motion.div
                style={{ opacity: rejectOpacity }}
                className="absolute inset-0 bg-rose-500/10 pointer-events-none rounded-3xl flex items-center justify-center border-4 border-rose-500/20 z-10"
            >
                <div className="bg-rose-500 text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest shadow-lg text-sm">Reject</div>
            </motion.div>

            {/* Card Content */}
            <div className="flex flex-col gap-5">
                {/* Header */}
                <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3 items-start flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {lead.companyName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-slate-800 leading-tight truncate">{lead.companyName}</h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                                <Building2 size={11} /> {lead.industry}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{lead.Match_Type || 'Primary'} Match</p>
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 px-3 py-1.5 rounded-xl text-sm font-bold border border-blue-100/70 text-center">
                            <div className="text-base font-bold">{finalScore}%</div>
                            <div className="text-[8px] uppercase font-semibold text-blue-600">Match</div>
                        </div>
                    </div>
                </div>

                {/* Dimension Scores */}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5">
                    <p className="text-[9px] uppercase font-bold text-slate-500 mb-3">Dimension Analysis</p>
                    <ScoreDimension 
                        label="D1: Product Compat" 
                        value={lead.D1_Product_Compat || 0} 
                        color={dimensionColors.D1}
                        weight={lead.weights?.D1}
                        status={lead.dimension_status?.D1}
                    />
                    <ScoreDimension 
                        label="D2: Geography Fit" 
                        value={lead.D2_Geography_Fit || 0} 
                        color={dimensionColors.D2}
                        weight={lead.weights?.D2}
                        status={lead.dimension_status?.D2}
                    />
                    <ScoreDimension 
                        label="D3: Trade Capacity" 
                        value={lead.D3_Trade_Capacity || 0} 
                        color={dimensionColors.D3}
                        weight={lead.weights?.D3}
                        status={lead.dimension_status?.D3}
                    />
                    <ScoreDimension 
                        label="D4: Intent & Activity" 
                        value={lead.D4_Intent_Activity || 0} 
                        color={dimensionColors.D4}
                        weight={lead.weights?.D4}
                        status={lead.dimension_status?.D4}
                    />
                    <ScoreDimension 
                        label="D5: Reliability" 
                        value={lead.D5_Reliability || 0} 
                        color={dimensionColors.D5}
                        weight={lead.weights?.D5}
                        status={lead.dimension_status?.D5}
                    />
                </div>

                {/* Risk & Details */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Risk Level</p>
                        <RiskBadge risk={riskLabel} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Location</p>
                        <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                            <MapPin size={14} className="text-blue-500" />
                            {lead.country}
                        </div>
                    </div>
                    {lead.Risk_Friction !== undefined && (
                        <div className="col-span-2">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Risk Friction</p>
                            <div className="text-sm font-semibold text-slate-700">
                                {(lead.Risk_Friction).toFixed(3)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Basic Info */}
                <div className="space-y-2.5">
                    <div className="flex items-center gap-3 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                        <DollarSign size={14} className="text-slate-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-slate-800">{lead.estimatedValue}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                        <Users size={14} className="text-slate-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-700">{lead.companySize}</span>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Primary Contact</p>
                    <p className="text-xs font-bold text-slate-700">{lead.contactName}</p>
                    <p className="text-[10px] text-slate-500">{lead.contactRole}</p>
                </div>
            </div>

            {/* AI Reasoning */}
            <div className="mt-5 flex flex-col gap-3">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5">
                    <p className="text-[10px] uppercase font-bold text-blue-600 mb-1.5 tracking-wide">AI Analysis</p>
                    <p className="text-xs text-slate-700 leading-relaxed">
                        {lead.summary || lead.reasoning || "High demand match with strong geographical fit and intent signals. Reliable payment history and relevant certifications."}
                    </p>
                </div>

                {/* Summary button temporarily disabled - route not available */}
                {/* <button
                    onClick={() => navigate(`/summary/${lead._id || lead.id || lead.companyName.replace(/\s+/g, '-')}`)}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <FileText size={16} />
                    View Full Summary & Analysis
                </button> */}

                <div className="flex gap-3 justify-center pt-1">
                    <div className="flex flex-col items-center gap-1 opacity-50">
                        <div className="bg-rose-50 p-2 rounded-full border border-rose-100">
                            <XCircle size={16} className="text-rose-500" />
                        </div>
                        <span className="text-[8px] font-bold text-rose-400 uppercase tracking-tighter">Reject</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-50">
                        <div className="bg-emerald-50 p-2 rounded-full border border-emerald-100">
                            <CheckCircle size={16} className="text-emerald-500" />
                        </div>
                        <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">Approve</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SwipeCard;

