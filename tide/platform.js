/* ============================================================
   TERAMERGE — TIDE
   Platform architecture: the single source of truth.
   Every count on the page (domains / agents / processes) is
   derived from this object at runtime — never hard-coded.
   Data supplied by Teramerge (22 agents · 205 processes).
   ============================================================ */
window.PLATFORM = {
  master: {
    name: 'Master AI Operator',
    role: 'One intelligence coordinating the entire asset lifecycle',
  },

  domains: [
    {
      id:'acquisition', no:'01', name:'Acquisition Intelligence', short:'Acquisition',
      accent:'111,183,221',
      line:'Find opportunity. Test it. Structure the deal.',
      agents:[
        { name:'Market Intelligence', fn:'Sees the market first.',
          subs:['Submarket Analysis','Supply & Demand','Rent Comps','Demographics','Employment Trends','Migration Patterns','Pipeline Tracking','Market Ranking'] },
        { name:'Sourcing', fn:'Finds the seller who needs out.',
          subs:['Off-Market Discovery','Owner Identification','Broker Network','Debt-Maturity Signals','Distress Signals','Lead Scoring','Outreach','Pipeline Management','Seller Profiling'] },
        { name:'Underwriting', fn:'Proves the economics work.',
          subs:['Revenue','Expenses','NOI Analysis','Rent Roll','Cap Rate','Cash Flow','Debt Modeling','Equity Modeling','Return Modeling','Sensitivity Analysis','Scenario Analysis','Assumption Testing'] },
        { name:'Due Diligence', fn:'Verifies before we commit.',
          subs:['Financial Audit','Rent Roll Verification','Lease Review','Physical Inspection','Environmental','Title Review','Zoning & Permits','Vendor Contracts','Tax Review','Insurance Review','DD Checklist'] },
        { name:'Deal Strategy', fn:'Structures the offer to win.',
          subs:['Offer Structuring','Pricing Strategy','Terms Negotiation','Seller Motivation','LOI Drafting','Contingency Planning','Competitive Positioning','Timeline Planning','Close Probability'] },
        { name:'Capital & Financing', fn:'Lines up the money — equity and debt.',
          subs:['Debt Sourcing','Loan Assumption','Refinance Modeling','Loan-Sponsor Coordination','Equity Raise','Capital Stack','Lender Relations','Rate Analysis','Terms Optimization'] },
        { name:'Closing & Legal', fn:'Gets the deal across the line.',
          subs:['Entity Formation','Purchase Agreement','Escrow Coordination','Title Review','Loan Document Review','Funds Flow','Insurance Binding','Closing Checklist'] },
      ],
    },
    {
      id:'asset', no:'02', name:'Asset Intelligence', short:'Asset',
      accent:'95,201,173',
      line:'Take it over, run it, optimize it — continuously.',
      agents:[
        { name:'Transition', fn:'Owns the first 90 days.',
          subs:['Takeover Plan','Systems Migration','PM Handover','Staff Transition','Resident Communication','Vendor Transition','Day-1 Audit','90-Day Stabilization'] },
        { name:'Operations', fn:'Runs the asset, minus the overhead.',
          subs:['Maintenance Triage','Work Orders','Vendor Management','Turn Management','Inspections','Service Requests','SLA Tracking','CapEx Planning','Utility Management','Ops Reporting'] },
        { name:'Revenue Management', fn:'Grows income to local market.',
          subs:['Comp Analysis','Rent Positioning','Renewal Strategy','Concession Management','Fee Optimization','Loss-to-Lease','Occupancy Targeting','Revenue Forecasting','Unit-Mix Planning','Ancillary Income'] },
        { name:'Leasing', fn:'Fills and renews, faster.',
          subs:['Lead Response','Tour Scheduling','Application Screening','Approval Workflow','Lease Generation','Move-In Coordination','Renewal Processing','Waitlist Management','Conversion Tracking','Availability Sync'] },
        { name:'Marketing & Demand', fn:'Keeps the pipeline full.',
          subs:['Listing Syndication','Campaign Management','Channel Analytics','Lead Attribution','Content & Media','Reputation Management','Website & ILS','Demand Forecasting','Budget Allocation','Brand Consistency'] },
        { name:'Asset Performance', fn:'Every asset against its plan.',
          subs:['KPI Dashboards','Budget vs Actual','Variance Analysis','NOI Tracking','Occupancy Trends','Delinquency Monitoring','Business-Plan Tracking','Benchmarking','Alert Triggers','Performance Reporting'] },
        { name:'Finance', fn:'Books, cash, and reporting, tight.',
          subs:['Accounts Payable','Accounts Receivable','Bank Reconciliation','Cash Management','Financial Statements','Budgeting','Forecasting','Audit Support','Tax Coordination','Draw Management'] },
        { name:'Investor Relations', fn:'Treats capital like an institution does.',
          subs:['Distributions','LP Reporting','Investor Portal','Capital Calls','K-1 Coordination','Performance Updates','Capital-Event Comms','Investor Onboarding'] },
        { name:'Resident Intelligence', fn:'Protects retention and experience.',
          subs:['Satisfaction Tracking','Sentiment Analysis','Retention Modeling','Renewal Prediction','Service Recovery','Community Engagement','Complaint Resolution','Resident Journey','Churn Signals','Experience Scoring'] },
        { name:'Value Creation', fn:'Physical value-add plus NOI growth.',
          subs:['CapEx Planning','Renovation Management','Amenity Strategy','Exterior Upgrades','Unit Upgrades','ROI Analysis','Contractor Management','Project Timeline','Budget Control','Value Tracking'] },
        { name:'Compliance & Risk', fn:'Stays clean while the industry gets sued.',
          subs:['Fair Housing','Landlord-Tenant Compliance','Insurance & Claims','Regulatory Monitoring','Lease Compliance','Data & Privacy','Incident Response','Audit Trail'] },
      ],
    },
    {
      id:'realization', no:'03', name:'Realization Intelligence', short:'Realization',
      accent:'201,167,90',
      line:'Measure value, time the window, move to close.',
      agents:[
        { name:'Valuation', fn:'Knows the worth, live.',
          subs:['Live Valuation','Cap-Rate Tracking','Comparable Sales','BOV Analysis','NOI-Based Value','Scenario Valuation','Equity Position','Value Trajectory'] },
        { name:'Exit Strategy', fn:'Picks the moment and the buyer.',
          subs:['Hold-Sell Analysis','Exit Timing','Refinance vs Sale','Market-Window Signals','Disposition Planning','Proceeds Modeling','Tax Strategy','Exit Scenarios'] },
        { name:'Buyer Intelligence', fn:"Knows who's buying, and why.",
          subs:['Buyer Identification','Buyer Profiling','Institutional Mapping','Demand Signals','Bid Prediction','Outreach Targeting','Buyer Qualification','Relationship Tracking','Interest Scoring'] },
        { name:'Transaction', fn:'Drives a clean, fast close.',
          subs:['Deal Marketing','Data Room','Offer Management','Negotiation','PSA Coordination','Buyer DD Support','Escrow Management','Closing Coordination','Funds Distribution','Post-Close Handover'] },
      ],
    },
  ],
};

/* number every agent 01..N in reading order */
(() => {
  let i = 0;
  window.PLATFORM.domains.forEach(d => d.agents.forEach(a => { a.no = String(++i).padStart(2,'0'); }));
})();

/* derived, live counts — used everywhere the page shows a number */
window.PLATFORM.counts = (() => {
  const d = window.PLATFORM.domains;
  const agents = d.reduce((n, x) => n + x.agents.length, 0);
  const subs = d.reduce((n, x) => n + x.agents.reduce((m, a) => m + a.subs.length, 0), 0);
  return { domains: d.length, agents, subs };
})();
