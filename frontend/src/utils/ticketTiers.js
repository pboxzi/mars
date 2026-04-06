export const PREMIUM_TICKET_TIERS = [
  {
    type: 'vip',
    label: 'VIP Access',
    description: 'Priority guest-services review for premium entry, arrival guidance, and a smoother VIP venue-access experience for the selected show.',
    priceUsd: 4500,
    availableQuantity: 72,
    totalQuantity: 72
  },
  {
    type: 'meetgreet',
    label: 'Meet & Greet',
    description: 'Meet-and-greet access request with premium check-in handling, guest review, and event-day coordination after approval.',
    priceUsd: 12500,
    availableQuantity: 18,
    totalQuantity: 18
  },
  {
    type: 'backstage',
    label: 'Backstage Pass',
    description: 'Backstage access request reviewed for pre-show entry timing, restricted-area handling, and premium guest movement support.',
    priceUsd: 29000,
    availableQuantity: 7,
    totalQuantity: 7
  },
  {
    type: 'soundcheck',
    label: 'Soundcheck Experience',
    description: 'Early-entry soundcheck request with pre-show check-in guidance, premium arrival handling, and access review before confirmation.',
    priceUsd: 7500,
    availableQuantity: 28,
    totalQuantity: 28
  },
  {
    type: 'photoop',
    label: 'Photo Op Experience',
    description: 'Photo-op access request with timed guest handling, entry coordination, and confirmation guidance once approved.',
    priceUsd: 17500,
    availableQuantity: 12,
    totalQuantity: 12
  },
  {
    type: 'aftershow',
    label: 'After Show Lounge',
    description: 'After-show lounge request with hosted post-show entry, premium guest handling, and event-night coordination.',
    priceUsd: 42000,
    availableQuantity: 8,
    totalQuantity: 8
  },
  {
    type: 'hospitality',
    label: 'Private Table / Hospitality',
    description: 'Private-table hospitality request with hosted guest handling, premium placement, and coordinated access for your party.',
    priceUsd: 125000,
    availableQuantity: 5,
    totalQuantity: 5
  },
  {
    type: 'birthday',
    label: 'Birthday / Celebration Package',
    description: 'Celebration request with guest-count planning, premium handling, and event-day coordination tailored to your occasion.',
    priceUsd: 210000,
    availableQuantity: 4,
    totalQuantity: 4
  },
  {
    type: 'corporate',
    label: 'Corporate Booking',
    description: 'Corporate-hosting request with multi-guest coordination, premium arrival handling, and concierge review for client entertainment.',
    priceUsd: 425000,
    availableQuantity: 3,
    totalQuantity: 3
  },
  {
    type: 'privatemeetup',
    label: 'Private Meet-Up Request',
    description: 'Ultra-limited private request reviewed individually for bespoke access planning and one-to-one guest-services coordination.',
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
