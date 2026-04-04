export const PREMIUM_TICKET_TIERS = [
  {
    type: 'vip',
    label: 'VIP Access',
    description: 'Premium entry with concierge arrival, preferred access, and elevated guest handling.',
    priceUsd: 5000,
    availableQuantity: 100,
    totalQuantity: 100
  },
  {
    type: 'meetgreet',
    label: 'Meet & Greet',
    description: 'A personal Bruno Mars greeting experience with priority escort and premium coordination.',
    priceUsd: 15000,
    availableQuantity: 25,
    totalQuantity: 25
  },
  {
    type: 'backstage',
    label: 'Backstage Pass',
    description: 'Restricted backstage access before showtime with hosted movement through premium zones.',
    priceUsd: 35000,
    availableQuantity: 10,
    totalQuantity: 10
  },
  {
    type: 'soundcheck',
    label: 'Soundcheck Experience',
    description: 'Early entry for a curated soundcheck session with VIP check-in and preferred arrival flow.',
    priceUsd: 8500,
    availableQuantity: 40,
    totalQuantity: 40
  },
  {
    type: 'photoop',
    label: 'Photo Op Experience',
    description: 'Professionally managed photo opportunity with premium handling and priority access lane.',
    priceUsd: 20000,
    availableQuantity: 20,
    totalQuantity: 20
  },
  {
    type: 'aftershow',
    label: 'After Show Lounge',
    description: 'Invitation to an elevated post-show lounge experience with luxury hospitality service.',
    priceUsd: 50000,
    availableQuantity: 12,
    totalQuantity: 12
  },
  {
    type: 'hospitality',
    label: 'Private Table / Hospitality',
    description: 'A luxury hosted table package with premium service, private seating, and white-glove care.',
    priceUsd: 150000,
    availableQuantity: 8,
    totalQuantity: 8
  },
  {
    type: 'birthday',
    label: 'Birthday / Celebration Package',
    description: 'Special-occasion concierge planning with premium access designed for memorable celebrations.',
    priceUsd: 250000,
    availableQuantity: 6,
    totalQuantity: 6
  },
  {
    type: 'corporate',
    label: 'Corporate Booking',
    description: 'Executive-level entertainment package for high-touch business hosting and VIP guest service.',
    priceUsd: 500000,
    availableQuantity: 4,
    totalQuantity: 4
  },
  {
    type: 'privatemeetup',
    label: 'Private Meet-Up Request',
    description: 'Ultra-premium bespoke access consideration for private high-touch guest coordination.',
    priceUsd: 1000000,
    availableQuantity: 2,
    totalQuantity: 2
  }
];

export const PREMIUM_TICKET_DETAILS = PREMIUM_TICKET_TIERS.reduce((accumulator, tier) => {
  accumulator[tier.type] = tier;
  return accumulator;
}, {});

export const PREMIUM_TICKET_LABELS = PREMIUM_TICKET_TIERS.reduce((accumulator, tier) => {
  accumulator[tier.type] = tier.label;
  return accumulator;
}, {});

export const PREMIUM_TICKET_ORDER = PREMIUM_TICKET_TIERS.map((tier) => tier.type);

export const createEmptyPremiumTicketState = () =>
  PREMIUM_TICKET_TIERS.reduce((accumulator, tier) => {
    accumulator[tier.type] = {
      price_usd: tier.priceUsd,
      available_quantity: tier.availableQuantity,
      total_quantity: tier.totalQuantity
    };
    return accumulator;
  }, {});

export const getTicketTierLabel = (ticketType) => PREMIUM_TICKET_LABELS[ticketType] || ticketType;

export const getTicketTierDescription = (ticketType) => PREMIUM_TICKET_DETAILS[ticketType]?.description || '';

export const getTicketTierBasePrice = (ticketType) => PREMIUM_TICKET_DETAILS[ticketType]?.priceUsd || 0;
