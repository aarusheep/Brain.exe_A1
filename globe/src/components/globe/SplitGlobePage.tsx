import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Globe from './Globe';
import SwipeDeck from './SwipeDeck';
import { SAMPLE_LEADS } from '@/lib/leadData';

const SplitGlobePage: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentCountry, setCurrentCountry] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (SAMPLE_LEADS[currentIndex]) {
            setCurrentCountry(SAMPLE_LEADS[currentIndex].country);
        }
    }, [currentIndex]);

    const handleSwipe = (id: string, direction: 'left' | 'right') => {
        console.log(`Lead ${id} swiped ${direction}`);
        setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
        }, 200);
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-[#fcfdfe] overflow-hidden">
            {/* Left Side: Globe (50%) */}
            <div className="w-full lg:w-1/2 h-[400px] lg:h-full relative bg-[#050b18]">
                <Globe targetCountry={currentCountry} />

                {/* Subtle Branding/Info Overlay */}
                <div className="absolute top-8 left-8 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm pointer-events-none">
                    <h2 className="text-xl font-bold text-white tracking-tight">Global Intel</h2>
                    <p className="text-xs text-blue-300 font-medium">Ranked Importers</p>
                </div>
            </div>

            {/* Right Side: Swipe Panel (50%) */}
            <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
                {/* Background Accent */}
                <div className="absolute inset-0 bg-[#f8fbff] opacity-40 -z-10" />

                <div className="w-full max-w-sm h-full flex flex-col pt-12">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                            Review Active
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lead Deck</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Qualify lead {currentIndex + 1} of {SAMPLE_LEADS.length}
                        </p>
                    </motion.div>

                    <div className="flex-1 relative">
                        <SwipeDeck
                            leads={SAMPLE_LEADS}
                            currentIndex={currentIndex}
                            onSwipe={handleSwipe}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplitGlobePage;
