import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { MapPin, Building2, Mail, Linkedin, Users, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import type { Lead } from '@/lib/leadData';
import { cn } from '@/lib/utils';

interface SwipeCardProps {
    lead: Lead;
    onSwipe: (direction: 'left' | 'right') => void;
    isFront?: boolean;
}

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

    return (
        <motion.div
            style={{ x, rotate, opacity }}
            drag={isFront ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "absolute w-full max-w-sm h-auto min-h-[500px] cursor-grab active:cursor-grabbing",
                "bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 flex flex-col justify-between select-none",
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
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-center">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                            {lead.companyName.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 leading-tight">{lead.companyName}</h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1 font-medium italic mt-0.5">
                                <Building2 size={12} /> {lead.industry}
                            </p>
                        </div>
                    </div>
                    <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-sm font-bold border border-blue-100/50">
                        {lead.matchPercentage}% Match
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-600">
                        <MapPin size={16} className="text-slate-400" />
                        <span className="text-sm font-medium">{lead.country}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                        <DollarSign size={16} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-800">{lead.estimatedValue}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                        <Users size={16} className="text-slate-400" />
                        <span className="text-sm font-medium">{lead.companySize} Employees</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Contact</p>
                        <p className="text-xs font-bold text-slate-700 leading-tight">{lead.contactName}</p>
                        <p className="text-[10px] text-slate-500 leading-tight">{lead.contactRole}</p>
                    </div>
                    <div className="flex flex-col justify-end items-end gap-1.5">
                        <div className="flex gap-2">
                            <Mail size={14} className="text-slate-400" />
                            <Linkedin size={14} className="text-blue-500" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">AI Reasoning</p>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                        "{lead.reasoning}"
                    </p>
                </div>

                <div className="flex gap-3 justify-center pt-2">
                    <div className="flex flex-col items-center gap-1 opacity-40">
                        <div className="bg-rose-50 p-2 rounded-full border border-rose-100">
                            <XCircle size={18} className="text-rose-500" />
                        </div>
                        <span className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter">Reject</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-40">
                        <div className="bg-emerald-50 p-2 rounded-full border border-emerald-100">
                            <CheckCircle size={18} className="text-emerald-500" />
                        </div>
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">Approve</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SwipeCard;
