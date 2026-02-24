/**
 * SwipeCard.tsx  –  proexport-dashboard/src/components/SwipeCard.tsx
 *
 * Same visual design as before — updated to consume real GlobexMatch
 * buyer data from the backend instead of static leadData.
 *
 * The parent page/component should use the useGlobex() hook and pass
 * currentBuyer as the `lead` prop.
 */

import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { MapPin, Building2, Mail, Linkedin, Users, DollarSign, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface BuyerLead {
  // Core identity
  id:              string;   // Buyer_ID
  companyName:     string;
  country:         string;
  industry:        string;
  matchPercentage: number;   // 0-100
  estimatedValue:  string;   // formatted
  companySize:     string;   // formatted
  reasoning:       string;
  contactName:     string;
  contactRole:     string;
  riskLabel:       'Low' | 'Medium' | 'High' | 'Very High';

  // Score breakdown (optional display)
  scores?: {
    d1ProductCompat:  number;
    d2GeographyFit:   number;
    d3TradeCapacity:  number;
    d4IntentActivity: number;
    d5Reliability:    number;
    riskFriction:     number;
    final:            number;
  };

  // Raw fields from engine (pass-through)
  Buyer_ID?:         string;
  Preferred_Channel?: string;
  Match_Type?:        string;
}

interface SwipeCardProps {
  lead:         BuyerLead;
  isFront:      boolean;
  onSwipe:      (direction: 'left' | 'right') => void;
  currentIndex: number;
  totalLeads:   number;
}

// ── Risk colour map ───────────────────────────────────────────────────────────
const RISK_STYLES: Record<string, string> = {
  'Low':       'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Medium':    'bg-amber-50   text-amber-700   border-amber-200',
  'High':      'bg-orange-50  text-orange-700  border-orange-200',
  'Very High': 'bg-rose-50    text-rose-700    border-rose-200',
};

// ── Component ─────────────────────────────────────────────────────────────────
const SwipeCard: React.FC<SwipeCardProps> = ({
  lead, isFront, onSwipe, currentIndex, totalLeads,
}) => {
  const x             = useMotionValue(0);
  const rotate        = useTransform(x, [-200, 200], [-15, 15]);
  const opacity       = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const approveOpacity = useTransform(x, [50, 150],   [0, 1]);
  const rejectOpacity  = useTransform(x, [-50, -150], [0, 1]);

  const handleDragEnd = (_: any, info: any) => {
    if      (info.offset.x >  150) onSwipe('right');
    else if (info.offset.x < -150) onSwipe('left');
  };

  const riskStyle     = RISK_STYLES[lead.riskLabel] || RISK_STYLES['Medium'];
  const isAdjacent    = lead.Match_Type === 'Adjacent';
  const channel       = lead.Preferred_Channel || '—';

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={isFront ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'absolute w-[95%] max-w-[600px] h-[85vh] min-h-[700px]',
        'cursor-grab active:cursor-grabbing select-none',
        'bg-[#FDFBF7] rounded-[4rem] p-16',
        'shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)]',
        'border border-[#F1ECE4] flex flex-col justify-between',
        !isFront && 'pointer-events-none opacity-90',
      )}
    >
      {/* ── Swipe Overlays ─────────────────────────────────────────────────── */}
      <motion.div style={{ opacity: approveOpacity }}
        className="absolute inset-0 bg-emerald-500/5 pointer-events-none rounded-[4rem]
                   flex items-center justify-center border-4 border-emerald-500/10 z-10">
        <div className="bg-emerald-500 text-white px-10 py-4 rounded-full
                        font-black uppercase tracking-widest shadow-2xl text-xl">
          Approve
        </div>
      </motion.div>

      <motion.div style={{ opacity: rejectOpacity }}
        className="absolute inset-0 bg-rose-500/5 pointer-events-none rounded-[4rem]
                   flex items-center justify-center border-4 border-rose-500/10 z-10">
        <div className="bg-rose-500 text-white px-10 py-4 rounded-full
                        font-black uppercase tracking-widest shadow-2xl text-xl">
          Reject
        </div>
      </motion.div>

      {/* ── Card Body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-10">

        {/* Header row */}
        <div className="flex flex-col mb-2">
          <div className="flex items-center gap-3 mb-5">
            {/* Match-type pill */}
            <div className={cn(
              'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px]',
              'font-black uppercase tracking-[0.2em]',
              isAdjacent
                ? 'bg-purple-50 text-purple-600'
                : 'bg-blue-50 text-blue-600',
            )}>
              <div className={cn(
                'w-2 h-2 rounded-full animate-pulse',
                isAdjacent ? 'bg-purple-600' : 'bg-blue-600',
              )} />
              {isAdjacent ? 'Adjacent Sector' : 'Primary Match'}
            </div>
            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">
              Lead {currentIndex + 1} of {totalLeads}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-5 items-center">
              {/* Company avatar */}
              <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center
                              justify-center text-white font-black text-3xl
                              shadow-xl shadow-slate-900/10">
                {lead.companyName.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-none tracking-tighter">
                  {lead.companyName}
                </h3>
                <p className="text-sm text-slate-500 flex items-center gap-2 font-bold italic mt-1.5">
                  <Building2 size={14} className="text-slate-400" />
                  {lead.industry}
                </p>
              </div>
            </div>

            {/* Match score badge */}
            <div className="bg-blue-600 text-white px-5 py-2.5 rounded-[1.5rem]
                            text-sm font-black shadow-lg shadow-blue-600/20 text-center">
              {lead.matchPercentage}%
              <div className="text-[9px] font-bold opacity-80 tracking-wider">MATCH</div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 px-2">
          {/* Col 1 */}
          <div className="space-y-5">
            <StatRow icon={<MapPin size={20} className="text-slate-500" />}
                     bg="bg-slate-100" label={lead.country} />
            <StatRow icon={<DollarSign size={20} className="text-blue-600" />}
                     bg="bg-blue-50"
                     label={`Est. ${lead.estimatedValue}`}
                     bold />
          </div>
          {/* Col 2 */}
          <div className="space-y-5">
            <StatRow icon={<Users size={20} className="text-slate-500" />}
                     bg="bg-slate-100"
                     label={`${lead.companySize} Team`} />
            <StatRow icon={<Zap size={20} className="text-amber-500" />}
                     bg="bg-amber-50"
                     label={`Via ${channel}`} />
          </div>
        </div>

        {/* Risk label */}
        <div className="flex items-center gap-3">
          <ShieldCheck size={16} className="text-slate-400" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Risk
          </span>
          <span className={cn(
            'text-xs font-black px-3 py-1 rounded-full border',
            riskStyle,
          )}>
            {lead.riskLabel}
          </span>
        </div>

        {/* Score breakdown (compact) */}
        {lead.scores && (
          <div className="grid grid-cols-5 gap-2">
            {[
              { key: 'D1', val: lead.scores.d1ProductCompat,  label: 'Product' },
              { key: 'D2', val: lead.scores.d2GeographyFit,   label: 'Geo' },
              { key: 'D3', val: lead.scores.d3TradeCapacity,  label: 'Capacity' },
              { key: 'D4', val: lead.scores.d4IntentActivity, label: 'Intent' },
              { key: 'D5', val: lead.scores.d5Reliability,    label: 'Reliable' },
            ].map(({ key, val, label }) => (
              <div key={key} className="flex flex-col items-center gap-1">
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.round(val * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  {label}
                </span>
                <span className="text-[10px] font-black text-slate-600">
                  {Math.round(val * 100)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Reasoning */}
        <div className="pt-6 border-t border-slate-200/60">
          <p className="text-xs uppercase tracking-[0.2em] font-black text-slate-400 mb-3">
            Decision Intelligence
          </p>
          <p className="text-base text-slate-700 leading-relaxed font-semibold italic">
            "{lead.reasoning}"
          </p>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="mt-auto flex items-center justify-between
                      border-t border-slate-200/60 pt-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden
                          border-2 border-white shadow-sm">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.contactName}`}
              alt="Contact"
            />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
              Direct Contact
            </p>
            <p className="text-lg font-black text-slate-800 leading-none tracking-tight">
              {lead.contactName}
            </p>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              {lead.contactRole}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="w-12 h-12 rounded-[1.2rem] bg-[#E8E2D8] flex items-center
                             justify-center text-slate-600 hover:bg-slate-800
                             hover:text-white transition-all shadow-sm">
            <Mail size={20} />
          </button>
          <button className="w-12 h-12 rounded-[1.2rem] bg-blue-600 flex items-center
                             justify-center text-white hover:bg-blue-700
                             transition-all shadow-lg shadow-blue-600/20">
            <Linkedin size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Tiny helper ───────────────────────────────────────────────────────────────
const StatRow: React.FC<{
  icon: React.ReactNode;
  bg: string;
  label: string;
  bold?: boolean;
}> = ({ icon, bg, label, bold }) => (
  <div className="flex items-center gap-4 text-slate-700">
    <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', bg)}>
      {icon}
    </div>
    <span className={cn('text-lg tracking-tight', bold ? 'font-black text-slate-900' : 'font-bold')}>
      {label}
    </span>
  </div>
);

export default SwipeCard;
