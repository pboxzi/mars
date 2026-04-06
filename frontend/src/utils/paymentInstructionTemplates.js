export const PAYMENT_METHOD_OPTIONS = {
  zelle: { key: 'zelle', label: 'Zelle' },
  cashapp: { key: 'cashapp', label: 'Cash App' },
  applepay: { key: 'applepay', label: 'Apple Pay' },
  bank: { key: 'bank', label: 'Bank Transfer' },
  btc: { key: 'btc', label: 'Bitcoin (BTC)' }
};

const PAYMENT_INSTRUCTION_DEFAULT_FIELDS = {
  zelle: {
    recipient: '[Add Zelle email or phone here]',
    reference: 'Use your booking confirmation number',
    after_payment: 'Submit your payment update on your booking page.'
  },
  cashapp: {
    cash_tag: '[Add Cash App tag here]',
    reference: 'Use your booking confirmation number',
    after_payment: 'Submit your payment update on your booking page.'
  },
  applepay: {
    applepay_contact: '[Add Apple Pay number or email here]',
    reference: 'Use your booking confirmation number',
    after_payment: 'Submit your payment update on your booking page.'
  },
  bank: {
    bank_name: '[Add bank name here]',
    account_name: '[Add account name here]',
    account_number: '[Add account number or IBAN here]',
    routing_code: '[Add routing, SWIFT, or sort code here]',
    reference: 'Use your booking confirmation number',
    after_payment: 'Submit your transfer reference on your booking page.'
  },
  btc: {
    btc_wallet_address: '[Add BTC wallet address here]',
    network: 'Bitcoin (BTC)',
    reference: 'Keep your transaction hash ready',
    after_payment: 'Submit your transaction hash on your booking page.'
  }
};

export const PAYMENT_METHOD_EDITOR_FIELDS = {
  zelle: [
    { key: 'recipient', label: 'Zelle Recipient', placeholder: 'payments@example.com or +1...', fullWidth: true },
    { key: 'reference', label: 'Reference', placeholder: 'Use your booking confirmation number' },
    { key: 'after_payment', label: 'After Payment', placeholder: 'Submit your payment update on your booking page.', type: 'textarea', fullWidth: true },
  ],
  cashapp: [
    { key: 'cash_tag', label: 'Cash App Tag', placeholder: '$yourtag', fullWidth: true },
    { key: 'reference', label: 'Reference', placeholder: 'Use your booking confirmation number' },
    { key: 'after_payment', label: 'After Payment', placeholder: 'Submit your payment update on your booking page.', type: 'textarea', fullWidth: true },
  ],
  applepay: [
    { key: 'applepay_contact', label: 'Apple Pay Contact', placeholder: '+1... or payments@example.com', fullWidth: true },
    { key: 'reference', label: 'Reference', placeholder: 'Use your booking confirmation number' },
    { key: 'after_payment', label: 'After Payment', placeholder: 'Submit your payment update on your booking page.', type: 'textarea', fullWidth: true },
  ],
  bank: [
    { key: 'bank_name', label: 'Bank Name', placeholder: 'Zenith Bank' },
    { key: 'account_name', label: 'Account Name', placeholder: 'Romantic Tour Guest Services' },
    { key: 'account_number', label: 'Account Number / IBAN', placeholder: '1234567890' },
    { key: 'routing_code', label: 'Routing / SWIFT / Sort Code', placeholder: 'ABCDNG12' },
    { key: 'reference', label: 'Reference', placeholder: 'Use your booking confirmation number' },
    { key: 'after_payment', label: 'After Payment', placeholder: 'Submit your transfer reference on your booking page.', type: 'textarea', fullWidth: true },
  ],
  btc: [
    { key: 'btc_wallet_address', label: 'Wallet Address', placeholder: 'bc1q...', monospace: true, fullWidth: true },
    { key: 'network', label: 'Network', placeholder: 'Bitcoin (BTC)' },
    { key: 'reference', label: 'Reference', placeholder: 'Keep your transaction hash ready' },
    { key: 'after_payment', label: 'After Payment', placeholder: 'Submit your transaction hash on your booking page.', type: 'textarea', fullWidth: true },
  ],
};

const PAYMENT_LINE_LABELS = {
  zelle: {
    recipient: 'Recipient',
    reference: 'Reference',
    after_payment: 'After payment',
  },
  cashapp: {
    cash_tag: 'Cash App Tag',
    reference: 'Reference',
    after_payment: 'After payment',
  },
  applepay: {
    applepay_contact: 'Apple Pay Contact',
    reference: 'Reference',
    after_payment: 'After payment',
  },
  bank: {
    bank_name: 'Bank Name',
    account_name: 'Account Name',
    account_number: 'Account Number / IBAN',
    routing_code: 'Routing / SWIFT / Sort Code',
    reference: 'Reference',
    after_payment: 'After payment',
  },
  btc: {
    network: 'Network',
    reference: 'Reference',
    after_payment: 'After payment',
  }
};

export const HIGH_VOLUME_PAYMENT_NOTICE =
  'High traffic notice: Complete payment exactly as shown below, then submit your payment reference on your booking page.';
export const LEGACY_HIGH_VOLUME_PAYMENT_NOTICE =
  'High payment traffic notice: Bank transfer and Bitcoin are currently the fastest verified settlement rails for approved tour requests. Complete the approved payment exactly as shown below, then submit your payment reference so guest services can finalize your file.';
const PAYMENT_NOTICE_VARIANTS = [
  HIGH_VOLUME_PAYMENT_NOTICE,
  'High payment traffic notice: Bank transfer and Bitcoin are currently the fastest payment routes for approved tour requests. Complete the approved payment exactly as shown below, then submit your payment reference so guest services can finish verification.',
  LEGACY_HIGH_VOLUME_PAYMENT_NOTICE
];

const normalizeTextValue = (value) => String(value ?? '').trim();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripPaymentNoticeVariants = (instructions = '') => {
  let cleaned = normalizeTextValue(instructions);

  PAYMENT_NOTICE_VARIANTS.forEach((notice) => {
    cleaned = cleaned.replace(notice, '').trim();
  });

  while (cleaned.includes('\n\n\n')) {
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  }

  return cleaned.trim();
};

export const createDefaultPaymentInstructionFields = (method) => ({
  ...(PAYMENT_INSTRUCTION_DEFAULT_FIELDS[method] || {})
});

const getFieldValue = (method, key, fields = {}) =>
  normalizeTextValue(fields[key]) || PAYMENT_INSTRUCTION_DEFAULT_FIELDS[method]?.[key] || '';

const buildSimplePaymentInstructionText = (method, fields = {}) => {
  switch (method) {
    case 'zelle':
      return [
        PAYMENT_METHOD_OPTIONS.zelle.label,
        '',
        `Recipient: ${getFieldValue(method, 'recipient', fields)}`,
        `Reference: ${getFieldValue(method, 'reference', fields)}`,
        `After payment: ${getFieldValue(method, 'after_payment', fields)}`
      ].join('\n');
    case 'cashapp':
      return [
        PAYMENT_METHOD_OPTIONS.cashapp.label,
        '',
        `Cash App Tag: ${getFieldValue(method, 'cash_tag', fields)}`,
        `Reference: ${getFieldValue(method, 'reference', fields)}`,
        `After payment: ${getFieldValue(method, 'after_payment', fields)}`
      ].join('\n');
    case 'applepay':
      return [
        PAYMENT_METHOD_OPTIONS.applepay.label,
        '',
        `Apple Pay Contact: ${getFieldValue(method, 'applepay_contact', fields)}`,
        `Reference: ${getFieldValue(method, 'reference', fields)}`,
        `After payment: ${getFieldValue(method, 'after_payment', fields)}`
      ].join('\n');
    case 'bank':
      return [
        PAYMENT_METHOD_OPTIONS.bank.label,
        '',
        `Bank Name: ${getFieldValue(method, 'bank_name', fields)}`,
        `Account Name: ${getFieldValue(method, 'account_name', fields)}`,
        `Account Number / IBAN: ${getFieldValue(method, 'account_number', fields)}`,
        `Routing / SWIFT / Sort Code: ${getFieldValue(method, 'routing_code', fields)}`,
        `Reference: ${getFieldValue(method, 'reference', fields)}`,
        `After payment: ${getFieldValue(method, 'after_payment', fields)}`
      ].join('\n');
    case 'btc':
      return [
        PAYMENT_METHOD_OPTIONS.btc.label,
        '',
        `Network: ${getFieldValue(method, 'network', fields)}`,
        `Reference: ${getFieldValue(method, 'reference', fields)}`,
        `After payment: ${getFieldValue(method, 'after_payment', fields)}`
      ].join('\n');
    default:
      return '';
  }
};

export const buildPaymentSettingsPayload = (method, fields = {}) => {
  const nextInstructions = buildSimplePaymentInstructionText(method, fields);
  const btcWalletAddress =
    method === 'btc'
      ? getFieldValue(method, 'btc_wallet_address', fields)
      : '';

  return {
    instructions: nextInstructions,
    btc_wallet_address: btcWalletAddress
  };
};

const extractLineValue = (instructions, label) => {
  const match = stripPaymentNoticeVariants(instructions).match(new RegExp(`^${escapeRegExp(label)}:\\s*(.+)$`, 'mi'));
  return match?.[1]?.trim() || '';
};

export const parsePaymentInstructionFields = (method, instructions, btcWalletAddress = '') => {
  const baseFields = createDefaultPaymentInstructionFields(method);
  const lineLabels = PAYMENT_LINE_LABELS[method] || {};

  Object.entries(lineLabels).forEach(([key, label]) => {
    const extractedValue = extractLineValue(instructions, label);
    if (extractedValue) {
      baseFields[key] = extractedValue;
    }
  });

  if (method === 'btc') {
    baseFields.btc_wallet_address = normalizeTextValue(btcWalletAddress) || baseFields.btc_wallet_address;
  }

  return baseFields;
};

export const buildPaymentInstructionPreview = (method, fields = {}) => {
  const payload = buildPaymentSettingsPayload(method, fields);
  let preview = decoratePaymentInstructions(method, payload.instructions);

  if (method === 'btc') {
    preview = `${preview}\nWallet Address: ${payload.btc_wallet_address || PAYMENT_INSTRUCTION_DEFAULT_FIELDS.btc.btc_wallet_address}`;
  }

  return preview.trim();
};

export const PAYMENT_INSTRUCTION_TEMPLATES = Object.keys(PAYMENT_METHOD_OPTIONS).reduce((acc, method) => ({
  ...acc,
  [method]: buildSimplePaymentInstructionText(method, createDefaultPaymentInstructionFields(method))
}), {});

export const decoratePaymentInstructions = (method, instructions) => {
  const rawInstructions =
    normalizeTextValue(instructions).length > 0
      ? normalizeTextValue(instructions)
      : PAYMENT_INSTRUCTION_TEMPLATES[method] || '';

  if (!rawInstructions || !['bank', 'btc'].includes(method)) {
    return rawInstructions;
  }

  const baseInstructions = stripPaymentNoticeVariants(rawInstructions);
  return `${HIGH_VOLUME_PAYMENT_NOTICE}\n\n${baseInstructions}`;
};

export const LIVE_PAYMENT_METHOD_KEYS = ['bank', 'btc'];
export const LIVE_PAYMENT_METHODS = LIVE_PAYMENT_METHOD_KEYS.map((key) => PAYMENT_METHOD_OPTIONS[key]);

export const getDefaultLivePaymentMethod = () => LIVE_PAYMENT_METHOD_KEYS[0];

export const isLivePaymentMethod = (method) => LIVE_PAYMENT_METHOD_KEYS.includes(method);

export const getSafeLivePaymentMethod = (method) =>
  isLivePaymentMethod(method) ? method : getDefaultLivePaymentMethod();

export const getPaymentMethodLabel = (method) =>
  PAYMENT_METHOD_OPTIONS[method]?.label || String(method || '').toUpperCase();

export const createDefaultPaymentSettings = () => ({
  zelle: { instructions: PAYMENT_INSTRUCTION_TEMPLATES.zelle, btc_wallet_address: '' },
  cashapp: { instructions: PAYMENT_INSTRUCTION_TEMPLATES.cashapp, btc_wallet_address: '' },
  applepay: { instructions: PAYMENT_INSTRUCTION_TEMPLATES.applepay, btc_wallet_address: '' },
  bank: { instructions: PAYMENT_INSTRUCTION_TEMPLATES.bank, btc_wallet_address: '' },
  btc: { instructions: PAYMENT_INSTRUCTION_TEMPLATES.btc, btc_wallet_address: PAYMENT_INSTRUCTION_DEFAULT_FIELDS.btc.btc_wallet_address }
});

export const getPaymentInstructionsOrTemplate = (method, instructions) =>
  decoratePaymentInstructions(method, instructions);
