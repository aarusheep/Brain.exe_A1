import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Lead } from '@/lib/leadData';
import SwipeCard from './SwipeCard';

interface SwipeDeckProps {
    leads: Lead[];
    onSwipe: (id: string, direction: 'left' | 'right') => void;
    currentIndex: number;
}

const SwipeDeck: React.FC<SwipeDeckProps> = ({ leads, onSwipe, currentIndex }) => {
    const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

    const handleSwipe = (direction: 'left' | 'right') => {
        setExitDirection(direction);
        onSwipe(leads[currentIndex].id, direction);
    };

    const remainingLeads = leads.slice(currentIndex, currentIndex + 3);

    if (currentIndex >= leads.length) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center space-y-4"
            >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                    <span className="text-3xl text-slate-300 italic font-serif">!</span>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800">No more ranked importers</h3>
                    <p className="text-sm text-slate-500 max-w-[200px] mt-2">
                        You've reviewed all intelligence for this region.
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="relative w-full flex justify-center items-start h-full">
            <AnimatePresence mode="popLayout">
                {remainingLeads.map((lead, idx) => {
                    const isFront = idx === 0;
                    const scale = isFront ? 1 : 1 - idx * 0.05;
                    const yOffset = idx * 10;
                    const zIndex = remainingLeads.length - idx;

                    return (
                        <motion.div
                            key={lead.id}
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{
                                scale,
                                opacity: 1,
                                y: 0,
                                zIndex
                            }}
                            exit={{
                                x: exitDirection === 'left' ? -500 : 500,
                                opacity: 0,
                                scale: 0.5,
                                transition: { duration: 0.4, ease: "easeInOut" }
                            }}
                            className="absolute w-full max-w-2xl flex justify-center items-start"
                        >
                            <SwipeCard
                                lead={lead}
                                isFront={isFront}
                                onSwipe={handleSwipe}
                                currentIndex={currentIndex}
                                totalLeads={leads.length}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default SwipeDeck;
