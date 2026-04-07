export const PREMIUM_TICKET_TIERS = [
  {
    type: 'vip',
    label: 'VIP Access',
    description: 'Dedicated VIP check-in, priority entry lane, premium reserved location, and on-site host assistance to your section.',
    priceUsd: 895,
    availableQuantity: 72,
    totalQuantity: 72
  },
  {
    type: 'meetgreet',
    label: 'Meet & Greet',
    description: 'Meet-and-greet moment, professional photo opportunity, premium reserved location, dedicated check-in, and escorted entry.',
    priceUsd: 1495,
    availableQuantity: 18,
    totalQuantity: 18
  },
  {
    type: 'backstage',
    label: 'Backstage Pass',
    description: 'Pre-show backstage access window, guided escort through approved backstage areas, premium reserved location, and priority check-in.',
    priceUsd: 2495,
    availableQuantity: 7,
    totalQuantity: 7
  },
  {
    type: 'soundcheck',
    label: 'Soundcheck Experience',
    description: 'Early-entry soundcheck viewing, dedicated VIP check-in, premium reserved location, and priority arrival access.',
    priceUsd: 1195,
    availableQuantity: 28,
    totalQuantity: 28
  },
  {
    type: 'photoop',
    label: 'Photo Op Experience',
    description: 'Professional photo opportunity, premium reserved location, dedicated check-in, and guided entry support.',
    priceUsd: 1795,
    availableQuantity: 12,
    totalQuantity: 12
  },
  {
    type: 'aftershow',
    label: 'After Show Lounge',
    description: 'Post-show lounge access, premium reserved location, host support, and priority guest handling after the performance.',
    priceUsd: 2995,
    availableQuantity: 8,
    totalQuantity: 8
  },
  {
    type: 'hospitality',
    label: 'Private Table / Hospitality',
    description: 'Private hosted table, premium reserved placement, dedicated guest check-in, and table-side service support.',
    priceUsd: 6500,
    availableQuantity: 5,
    totalQuantity: 5
  },
  {
    type: 'birthday',
    label: 'Birthday / Celebration Package',
    description: 'Celebration setup coordination, premium reserved placement, dedicated guest arrival handling, and hosted support for your group.',
    priceUsd: 9500,
    availableQuantity: 4,
    totalQuantity: 4
  },
  {
    type: 'corporate',
    label: 'Corporate Booking',
    description: 'Corporate guest handling, premium reserved placement, dedicated arrival coordination, and hosted support for attending clients or teams.',
    priceUsd: 12500,
    availableQuantity: 3,
    totalQuantity: 3
  },
  {
    type: 'privatemeetup',
    label: 'Private Meet-Up Request',
    description: 'Private request review for bespoke guest handling, premium reserved placement, and custom coordination subject to approval.',
    priceUsd: 20000,
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
