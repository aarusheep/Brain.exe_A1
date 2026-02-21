import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Globe from './Globe';
import SwipeDeck from './SwipeDeck';
import type { Lead } from '@/lib/leadData';

interface SplitGlobePageProps {
    onAction?: (action: 'approve' | 'reject') => void;
    onLoad?: (count: number) => void;
}

const API_BASE_URL = 'http://localhost:5000/api';

const SplitGlobePage: React.FC<SplitGlobePageProps> = ({ onAction, onLoad }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchLeads = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/importers`);
            const data = response.data;

            // Transform API data to Lead interface
            const newLeads: Lead[] = data.map((item: any) => ({
                id: item._id,
                companyName: item.name || item.company_name || 'Unknown Company',
                industry: item.industry || 'General Trade',
                location: item.country || 'Unknown',
                country: item.country || 'Unknown',
                contactName: 'Procurement Manager', // Placeholder
                contactRole: 'Lead Buyer',          // Placeholder
                matchPercentage: Math.round((item.score || item.intent_score || 0) * 100),
                estimatedValue: item.trade_volume || item.revenue_range || '$100k - $500k',
                companySize: item.team_size ? `${item.team_size} Employees` : 'Unknown',
                email: 'contact@company.com',       // Placeholder
                reasoning: item.summary || 'AI Match based on trade history and product fit.'
            }));

            setLeads(newLeads);
            if (onLoad) onLoad(newLeads.length);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching leads:', error);
            setLoading(false);
            if (onLoad) onLoad(0);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleSwipe = async (id: string, direction: 'left' | 'right') => {
        const action = direction === 'right' ? 'accepted' : 'rejected';
        console.log(`Lead ${id} swiped ${direction} (${action})`);

        // Optimistic UI update
        if (onAction) {
            onAction(direction === 'right' ? 'approve' : 'reject');
        }

        // Send feedback to backend (triggers AI learning)
        try {
            await axios.post(`${API_BASE_URL}/importers/${id}/review`, { status: action });
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }

        // Move to next card after animation
        setTimeout(() => {
            setCurrentIndex((prev) => {
                const next = prev + 1;
                // If we are near the end, maybe fetch more? 
                // For now, let's just let it run out or refresh manually.
                if (next >= leads.length - 2) {
                    // Could trigger re-fetch here for infinite scroll
                    // fetchLeads(); // carefully to append not replace
                }
                return next;
            });
        }, 200);
    };

    const currentLead = leads[currentIndex];
    const currentCountry = currentLead ? currentLead.country : undefined;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#fafafa]">
                <p className="text-slate-400 font-medium">Loading potential partners...</p>
            </div>
        );
    }

    if (leads.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#fafafa]">
                <p className="text-slate-400 font-medium">No leads found.</p>
            </div>
        );
    }

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
                        {currentIndex < leads.length ? (
                            <SwipeDeck
                                leads={leads}
                                currentIndex={currentIndex}
                                onSwipe={handleSwipe}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center mt-20">
                                <h3 className="text-xl font-bold text-slate-700 mb-2">You're all caught up!</h3>
                                <p className="text-slate-500 mb-6">We are analyzing more partners based on your recent feedback.</p>
                                <button
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                    onClick={() => {
                                        setLoading(true);
                                        setCurrentIndex(0);
                                        fetchLeads();
                                    }}
                                >
                                    Refresh Recommendations
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplitGlobePage;

