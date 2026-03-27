export const scoreDefinitions = {
  growth: {
    key: 'growth',
    name: 'Growth Score',
    shortExplanation: 'Tracks how quickly a company is accelerating in market traction and execution.',
    intendedMeasure: 'Current momentum using expansion signals such as hiring, product velocity, and commercial adoption.',
    whyItMatters: 'Growth helps users spot companies that are compounding fast, often before they become obvious category leaders.',
    formula: 'Growth Score = 40% Market Traction + 35% Product Velocity + 25% Talent & Hiring Momentum',
    weightedBreakdown: [
      { label: 'Market Traction', weight: '40%', detail: 'Customer wins, partnerships, and visible demand signals.' },
      { label: 'Product Velocity', weight: '35%', detail: 'Launch cadence, roadmap execution, and feature maturity.' },
      { label: 'Talent & Hiring Momentum', weight: '25%', detail: 'Hiring intensity and quality of strategic talent moves.' },
    ],
  },
  influence: {
    key: 'influence',
    name: 'Influence Score',
    shortExplanation: 'Estimates how much a company shapes conversation and direction in its AI segment.',
    intendedMeasure: 'Narrative and ecosystem impact across media, developer communities, and enterprise visibility.',
    whyItMatters: 'Influence often leads distribution. Companies with strong influence can attract partners, talent, and customers faster.',
    formula: 'Influence Score = 45% Ecosystem Reach + 35% Thought Leadership + 20% Brand Pull',
    weightedBreakdown: [
      { label: 'Ecosystem Reach', weight: '45%', detail: 'Presence across channels, partners, and community surfaces.' },
      { label: 'Thought Leadership', weight: '35%', detail: 'Quality of insights, research, and category-defining messaging.' },
      { label: 'Brand Pull', weight: '20%', detail: 'Strength of brand recall and inbound interest signals.' },
    ],
  },
  power: {
    key: 'power',
    name: 'Power Score',
    shortExplanation: 'Composite score for overall competitive strength right now.',
    intendedMeasure: 'Balanced view of momentum, influence, and execution durability in one headline indicator.',
    whyItMatters: 'Power gives users a quick way to compare who is best positioned to win across domains, not just trending momentarily.',
    formula: 'Power Score = 35% Growth + 35% Influence + 30% Execution Resilience',
    weightedBreakdown: [
      { label: 'Growth', weight: '35%', detail: 'How quickly momentum is compounding.' },
      { label: 'Influence', weight: '35%', detail: 'How strongly the company shapes category direction.' },
      { label: 'Execution Resilience', weight: '30%', detail: 'Ability to sustain performance under competitive pressure.' },
    ],
  },
  investor: {
    key: 'investor',
    name: 'Investor Score',
    shortExplanation: 'Opportunity-focused signal for investors seeking asymmetric upside.',
    intendedMeasure: 'Risk-adjusted attractiveness based on momentum, category tailwinds, and underappreciated potential.',
    whyItMatters: 'Investor Score helps identify emerging companies with strong upside before consensus pricing catches up.',
    formula: 'Investor Score = 30% Power + 25% Growth + 20% Domain Momentum + 15% Underexposure + 10% Recency',
    weightedBreakdown: [
      { label: 'Power', weight: '30%', detail: 'Current competitive position and execution quality.' },
      { label: 'Growth', weight: '25%', detail: 'Speed and consistency of near-term expansion.' },
      { label: 'Domain Momentum', weight: '20%', detail: 'How hot and expanding the underlying category is.' },
      { label: 'Underexposure', weight: '15%', detail: 'Potential upside from being less crowded or under-followed.' },
      { label: 'Recency', weight: '10%', detail: 'Freshness of signals so the ranking reflects current conditions.' },
    ],
  },
};

export const defaultScoreOrder = ['growth', 'influence', 'power', 'investor'];
