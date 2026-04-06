export const PAYMENT_INSTRUCTION_TEMPLATES = {
  zelle:
    'Send your approved balance by Zelle using the recipient details below.\n\nZelle recipient: [Add Zelle email or phone here]\nPayment note: Use your booking confirmation number\n\nAfter payment is sent, return to your booking page and submit your payment update so our team can verify it quickly.',
  cashapp:
    'Send your approved balance by Cash App using the account details below.\n\nCash App tag: [Add Cash App tag here]\nPayment note: Include your booking confirmation number if your app allows it\n\nOnce payment is complete, submit your payment update from your booking page for fast confirmation.',
  applepay:
    'Send your approved balance by Apple Pay using the contact details below.\n\nApple Pay number or email: [Add Apple Pay detail here]\nPayment note: Reference your booking confirmation number\n\nAfter sending payment, use the payment update form on your booking page so our team can review it promptly.',
  bank:
    'Bank transfer is currently the primary fiat settlement method for approved bookings during high-volume processing.\n\nSend the full approved balance using the beneficiary details below.\n\nBeneficiary name: [Add account name here]\nBank name: [Add bank name here]\nAccount number / IBAN: [Add account number here]\nRouting / SWIFT / sort code: [Add bank routing detail here]\nPayment reference: Use your booking confirmation number exactly\n\nAfter the transfer is sent, return to your booking page and submit the transfer reference so our team can verify and release the next update without delay.',
  btc:
    'Bitcoin is currently available for approved bookings during high-volume processing.\n\nSend only the exact BTC amount shown in your approval to the wallet address below.\n\nNetwork: Bitcoin (BTC) only unless our team states otherwise\nReference: Keep your transaction hash ready for verification\nTiming: Network fees and final settlement remain the sender responsibility\n\nAfter the transfer is broadcast, return to your booking page and submit the transaction hash so our team can review it and continue your booking.'
};

export const PAYMENT_METHOD_OPTIONS = {
  zelle: { key: 'zelle', label: 'Zelle' },
  cashapp: { key: 'cashapp', label: 'Cash App' },
  applepay: { key: 'applepay', label: 'Apple Pay' },
  bank: { key: 'bank', label: 'Bank Transfer' },
  btc: { key: 'btc', label: 'Bitcoin (BTC)' }
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
  btc: { instructions: PAYMENT_INSTRUCTION_TEMPLATES.btc, btc_wallet_address: '' }
});

export const getPaymentInstructionsOrTemplate = (method, instructions) =>
  instructions && instructions.trim().length > 0
    ? instructions
    : PAYMENT_INSTRUCTION_TEMPLATES[method] || '';
