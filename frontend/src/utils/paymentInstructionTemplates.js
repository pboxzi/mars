export const PAYMENT_INSTRUCTION_TEMPLATES = {
  zelle:
    'Send your approved balance by Zelle using the recipient details below.\n\nZelle recipient: [Add Zelle email or phone here]\nPayment note: Use your booking confirmation number\n\nAfter payment is sent, return to your booking page and submit your payment update so our team can verify it quickly.',
  cashapp:
    'Send your approved balance by Cash App using the account details below.\n\nCash App tag: [Add Cash App tag here]\nPayment note: Include your booking confirmation number if your app allows it\n\nOnce payment is complete, submit your payment update from your booking page for fast confirmation.',
  applepay:
    'Send your approved balance by Apple Pay using the contact details below.\n\nApple Pay number or email: [Add Apple Pay detail here]\nPayment note: Reference your booking confirmation number\n\nAfter sending payment, use the payment update form on your booking page so our team can review it promptly.',
  bank:
    'Send your approved balance by bank transfer using the account details below.\n\nAccount name: [Add account name here]\nBank name: [Add bank name here]\nAccount number / IBAN: [Add account number here]\nRouting / Swift / Sort code: [Add bank routing detail here]\nReference: Use your booking confirmation number\n\nAfter your transfer is made, submit your payment update with the transfer reference so we can confirm your booking without delay.',
  btc:
    'Send only the exact BTC amount shown in your approval to the wallet address below.\n\nNetwork: Use Bitcoin (BTC) only unless our team states otherwise\nReference: Keep your transaction hash ready for verification\n\nAfter sending payment, submit your payment update with the transaction hash so our team can review and confirm it quickly.'
};

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
