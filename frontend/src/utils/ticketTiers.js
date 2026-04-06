export const PREMIUM_TICKET_TIERS = [
  {
    type: 'vip',
    label: 'VIP Access',
    description: 'Private-entry VIP access with concierge arrival, priority venue handling, and a smoother premium show-night experience.',
    priceUsd: 4500,
    availableQuantity: 72,
    totalQuantity: 72
  },
  {
    type: 'meetgreet',
    label: 'Meet & Greet',
    description: 'A rare guest-facing experience with priority escort, premium coordination, and elevated personal attention from arrival onward.',
    priceUsd: 12500,
    availableQuantity: 18,
    totalQuantity: 18
  },
  {
    type: 'backstage',
    label: 'Backstage Pass',
    description: 'Limited backstage access before showtime with escorted movement through restricted premium areas and high-touch hosting.',
    priceUsd: 29000,
    availableQuantity: 7,
    totalQuantity: 7
  },
  {
    type: 'soundcheck',
    label: 'Soundcheck Experience',
    description: 'Early-entry soundcheck access with VIP check-in, preferred arrival flow, and a more intimate pre-show atmosphere.',
    priceUsd: 7500,
    availableQuantity: 28,
    totalQuantity: 28
  },
  {
    type: 'photoop',
    label: 'Photo Op Experience',
    description: 'Professionally coordinated photo opportunity with premium handling, priority routing, and a polished keepsake moment.',
    priceUsd: 17500,
    availableQuantity: 12,
    totalQuantity: 12
  },
  {
    type: 'aftershow',
    label: 'After Show Lounge',
    description: 'Invitation to an exclusive post-show lounge setting with refined hospitality, priority hosting, and elevated guest service.',
    priceUsd: 42000,
    availableQuantity: 8,
    totalQuantity: 8
  },
  {
    type: 'hospitality',
    label: 'Private Table / Hospitality',
    description: 'Luxury table hospitality with premium seating, hosted service, and white-glove attention designed for standout entertaining.',
    priceUsd: 125000,
    availableQuantity: 5,
    totalQuantity: 5
  },
  {
    type: 'birthday',
    label: 'Birthday / Celebration Package',
    description: 'Celebration-focused concierge planning with premium access, tailored coordination, and a memorable show-night presentation.',
    priceUsd: 210000,
    availableQuantity: 4,
    totalQuantity: 4
  },
  {
    type: 'corporate',
    label: 'Corporate Booking',
    description: 'Executive entertainment package built for client hosting, premium access, and seamless VIP coordination from arrival to departure.',
    priceUsd: 425000,
    availableQuantity: 3,
    totalQuantity: 3
  },
  {
    type: 'privatemeetup',
    label: 'Private Meet-Up Request',
    description: 'Ultra-limited bespoke access request designed for top-tier guests seeking the highest level of private concierge consideration.',
    priceUsd: 850000,
    availableQuantity: 1,
    totalQuantity: 1
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
