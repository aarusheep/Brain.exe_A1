export interface Lead {
    id: string;
    companyName: string;
    industry: string;
    location: string;
    country: string;
    contactName: string;
    contactRole: string;
    matchPercentage: number;
    estimatedValue: string;
    companySize: string;
    email: string;
    reasoning: string;
    // Score engine fields
    D1_Product_Compat?: number;
    D2_Geography_Fit?: number;
    D3_Trade_Capacity?: number;
    D4_Intent_Activity?: number;
    D5_Reliability?: number;
    Final_Match_Score?: number;
    Risk_Friction?: number;
    Risk_Label?: string;
    Match_Type?: string;
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
    _id?: string;
}

export const SAMPLE_LEADS: Lead[] = [
    {
        id: "1",
        companyName: "Global Machining Ltd",
        industry: "Industrial Machinery",
        location: "Stuttgart, Germany",
        country: "Germany",
        contactName: "Hans Müller",
        contactRole: "Procurement Director",
        matchPercentage: 98,
        estimatedValue: "$500k - $1M",
        companySize: "500-1000",
        email: "h.mueller@globalmachining.de",
        reasoning: "High demand for specialized bearings in upcoming EV production line. History of sourcing from Indian suppliers."
    },
    {
        id: "2",
        companyName: "Zenith Electronics",
        industry: "Consumer Electronics",
        location: "Tokyo, Japan",
        country: "Japan",
        contactName: "Kenji Sato",
        contactRole: "Supply Chain Manager",
        matchPercentage: 94,
        estimatedValue: "$2M - $5M",
        companySize: "5000+",
        email: "k.sato@zenith-elec.jp",
        reasoning: "Expanding micro-component sourcing in SE Asia. Strong match for your precision manufacturing capabilities."
    },
    {
        id: "3",
        companyName: "Ameri部件 Supply",
        industry: "Automotive Parts",
        location: "Detroit, USA",
        country: "USA",
        contactName: "Sarah Johnson",
        contactRole: "Head of Sourcing",
        matchPercentage: 91,
        estimatedValue: "$1M - $2M",
        companySize: "1000-5000",
        email: "s.johnson@ameripart.com",
        reasoning: "Recent RFP indicates shift towards diversified supplier base. High alignment with your quality standards."
    },
    {
        id: "4",
        companyName: "EuroChem AG",
        industry: "Chemicals",
        location: "Frankfurt, Germany",
        country: "Germany",
        contactName: "Klaus Schmidt",
        contactRole: "Chemical Engineer",
        matchPercentage: 88,
        estimatedValue: "$750k - $1.5M",
        companySize: "200-500",
        email: "schmidt@eurochem.de",
        reasoning: "Searching for sustainable chemical precursors. Matches your specialized organic synthesis portfolio."
    }
];
