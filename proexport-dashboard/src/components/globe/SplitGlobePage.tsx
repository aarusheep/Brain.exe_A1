import React, { useState, useEffect } from 'react';
import Globe from './Globe';
import SwipeDeck from './SwipeDeck';
import { SAMPLE_LEADS } from '@/lib/leadData';

interface SplitGlobePageProps {
    onAction?: (action: 'approve' | 'reject') => void;
}

const SplitGlobePage: React.FC<SplitGlobePageProps> = ({ onAction }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentCountry, setCurrentCountry] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (SAMPLE_LEADS[currentIndex]) {
            setCurrentCountry(SAMPLE_LEADS[currentIndex].country);
        }
    }, [currentIndex]);

    const handleSwipe = (id: string, direction: 'left' | 'right') => {
        console.log(`Lead ${id} swiped ${direction}`);
        if (onAction) {
            onAction(direction === 'right' ? 'approve' : 'reject');
        }
        // Delay slightly to allow animation to complete before changing index
        setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
        }, 200);
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen min-h-[800px] w-[calc(100%+4rem)] -m-8 bg-[#fcfdfe] overflow-hidden">
            {/* Left Side: Globe (50%) */}
            <div className="w-full lg:w-1/2 h-[400px] lg:h-full relative bg-[#f8fbff]/30">
                <Globe targetCountry={currentCountry} />
            </div>

            {/* Right Side: Swipe Panel (50%) */}
            <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-start p-0 relative overflow-hidden bg-[#fafafa]">
                {/* Background Accent */}
                <div className="absolute inset-0 bg-[#f8fbff] opacity-40 -z-10" />

                <div className="w-full h-full flex flex-col items-center justify-start">
                    <div className="relative w-full flex justify-center items-start">
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
