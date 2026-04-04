import React from 'react';

const buildWhatsAppLink = (value) => {
  if (!value) {
    return '';
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  const digits = value.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : '';
};

const buildInstagramLink = (value) => {
  if (!value) {
    return '';
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return `https://www.instagram.com/${value.replace(/^@/, '')}/`;
};

const SupportContactCard = ({
  supportSettings,
  title = 'Need help with your booking?',
  description = 'Reach out through any of the channels below and include your confirmation number so we can find your request quickly.',
  confirmationNumber = '',
  className = ''
}) => {
  const items = [
    supportSettings.support_email
      ? {
          label: 'Email',
          value: supportSettings.support_email,
          href: `mailto:${supportSettings.support_email}`
        }
      : null,
    supportSettings.support_phone
      ? {
          label: 'Phone',
          value: supportSettings.support_phone,
          href: `tel:${supportSettings.support_phone}`
        }
      : null,
    supportSettings.support_whatsapp
      ? {
          label: 'WhatsApp',
          value: supportSettings.support_whatsapp,
          href: buildWhatsAppLink(supportSettings.support_whatsapp)
        }
      : null,
    supportSettings.support_instagram
      ? {
          label: 'Instagram',
          value: supportSettings.support_instagram,
          href: buildInstagramLink(supportSettings.support_instagram)
        }
      : null
  ].filter(Boolean);

  return (
    <div className={`rounded-lg border border-zinc-700 bg-zinc-950/60 p-6 ${className}`.trim()}>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">{description}</p>

      {confirmationNumber && (
        <div className="mb-4 rounded-lg bg-zinc-900 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-2">Confirmation Number</p>
          <p className="font-mono text-lg text-red-500">{confirmationNumber}</p>
        </div>
      )}

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <span className="text-sm uppercase tracking-[0.2em] text-gray-500">{item.label}</span>
              {item.href ? (
                <a
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                  className="text-white hover:text-red-400 transition-colors break-all"
                >
                  {item.value}
                </a>
              ) : (
                <span className="text-white break-all">{item.value}</span>
              )}
            </div>
          ))}
          {supportSettings.support_hours && (
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between pt-2 border-t border-zinc-800">
              <span className="text-sm uppercase tracking-[0.2em] text-gray-500">Response Hours</span>
              <span className="text-white">{supportSettings.support_hours}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          Our team will reply using the email address and phone number attached to your booking. Configure direct support
          channels in the admin panel when you are ready.
        </p>
      )}
    </div>
  );
};

export default SupportContactCard;
