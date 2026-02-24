Bumble for Indian Exporters - GlobexMatch!
Tech stack used: MongoDB + FastAPI + Python + JS 
Smart Algorithm that learns on its own by changing the weights of the required features and gives you your own customised deck of cards with importer's details.

Problem that we solved: 
The Gaps: 
Not effective Leads to conversion ratio

Deep algorithmic scoring

Real-time intent signals

Intelligent evaluation logic

Weighted matching criteria

How did we do it?

You chose the Green square and rejected the Blue square, now both are having three features ( size, shape, and color)  out of which two are the same, then what influenced you?
The color blue!
And hence the weight of blue will be reduced and that of green will be increased - this is what GlobexMatch’s Score Engine code will learn and in the next round, you will have a higher acceptance rate because we gave you what you wanted.

We used Three.js for our beautiful globe, our frontend ( proexport-dashboard ) is integrated with our Python api.py and scoreengine.py smoothly in order to give the required result.
This cleaned dataset is with respect to EXP_1715, who is an exporter in the electronics industry from Telangana.

Our main logic - Final score = opportunity score - risk score ( opportunity : D1,D2,D3,D4,D5  risk : S1,S2,S3 )

D1 — Product Compatibility
"Does this importer buy what the exporter sells?"

D2 — Geography Fit
"Is this a good country-state trade pair?"

D3 — Trade Capacity
"Can the exporter actually handle this importer's scale?"

D4 — Intent & Activity 
"Is this importer actively looking to buy RIGHT NOW?"

D5 — Reliability
"Can we trust both sides to follow through?

S1 — Structural / Regulatory Risk
"How legally and politically complex is this trade route?"

S2 — Live Event Risk
"Is something bad happening right now that could disrupt this deal?"

S3 — News-Based Industry Risk
"Is the importer's industry in that country being hit by bad news recently?"

Basically works like how Roboflow's AI tool works when we annotate the pictures for our dataset - for reference.

