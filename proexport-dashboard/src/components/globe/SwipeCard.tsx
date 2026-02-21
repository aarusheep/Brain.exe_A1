import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { MapPin, Building2, Mail, Linkedin, Users, DollarSign } from 'lucide-react';
import type { Lead } from '@/lib/leadData';
import { cn } from '@/lib/utils';

interface SwipeCardProps {
    lead: Lead;
    isFront: boolean;
    onSwipe: (direction: 'left' | 'right') => void;
    currentIndex: number;
    totalLeads: number;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ lead, isFront, onSwipe, currentIndex, totalLeads }) => {
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

    return (
        <motion.div
            style={{ x, rotate, opacity }}
            drag={isFront ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "absolute w-[95%] max-w-[600px] h-[85vh] min-h-[700px] cursor-grab active:cursor-grabbing",
                "bg-[#FDFBF7] rounded-[4rem] p-16 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] border border-[#F1ECE4] flex flex-col justify-between select-none",
                !isFront && "pointer-events-none opacity-90"
            )}
        >
            {/* Overlays for Visual Feedback */}
            <motion.div
                style={{ opacity: approveOpacity }}
                className="absolute inset-0 bg-emerald-500/5 pointer-events-none rounded-[4rem] flex items-center justify-center border-4 border-emerald-500/10 z-10"
            >
                <div className="bg-emerald-500 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest shadow-2xl text-xl">Approve</div>
            </motion.div>
            <motion.div
                style={{ opacity: rejectOpacity }}
                className="absolute inset-0 bg-rose-500/5 pointer-events-none rounded-[4rem] flex items-center justify-center border-4 border-rose-500/10 z-10"
            >
                <div className="bg-rose-500 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest shadow-2xl text-xl">Reject</div>
            </motion.div>

            {/* Card Content */}
            <div className="flex flex-col gap-12">
                {/* Internal Page Header (inside the card) */}
                <div className="flex flex-col mb-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em]">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            Analyzing Origin
                        </div>
                        <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Lead {currentIndex + 1} of {totalLeads}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex gap-6 items-center">
                            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-slate-900/10">
                                {lead.companyName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{lead.companyName}</h3>
                                <p className="text-base text-slate-500 flex items-center gap-2 font-bold italic mt-2">
                                    <Building2 size={16} className="text-slate-400" /> {lead.industry}
                                </p>
                            </div>
                        </div>
                        <div className="bg-blue-600 text-white px-6 py-3 rounded-[1.5rem] text-sm font-black shadow-lg shadow-blue-600/20">
                            {lead.matchPercentage}% Strong Match
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-8 px-2">
                    <div className="space-y-6">
                        <div className="flex items-center gap-5 text-slate-700">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200/50">
                                <MapPin size={24} className="text-slate-500" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">{lead.country}</span>
                        </div>
                        <div className="flex items-center gap-5 text-slate-700">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100/50">
                                <DollarSign size={24} className="text-blue-600" />
                            </div>
                            <span className="text-xl font-black text-slate-900 tracking-tight">Est. {lead.estimatedValue}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-5 text-slate-700">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200/50">
                                <Users size={24} className="text-slate-500" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">{lead.companySize} Team</span>
                        </div>
                        <div className="flex items-center gap-5 text-slate-700">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200/50">
                                <Building2 size={24} className="text-slate-500" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">Tier 1 Exporter</span>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-slate-200/60">
                    <p className="text-xs uppercase tracking-[0.2em] font-black text-slate-400 mb-5">Decision Intelligence</p>
                    <p className="text-lg text-slate-700 leading-relaxed font-semibold italic">
                        "{lead.reasoning}"
                    </p>
                </div>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-slate-200/60 pt-10">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.contactName}`} alt="Contact" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Direct Contact</p>
                        <p className="text-xl font-black text-slate-800 leading-none tracking-tight">{lead.contactName}</p>
                        <p className="text-sm font-bold text-slate-500 mt-1">{lead.contactRole}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-[1.2rem] bg-[#E8E2D8] flex items-center justify-center text-slate-600 cursor-pointer hover:bg-slate-800 hover:text-white transition-all shadow-sm">
                        <Mail size={24} />
                    </div>
                    <div className="w-14 h-14 rounded-[1.2rem] bg-blue-600 flex items-center justify-center text-white cursor-pointer hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                        <Linkedin size={24} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SwipeCard;
