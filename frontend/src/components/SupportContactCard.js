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
    <div
      className={`rounded-[28px] border border-[#dfd2c0] bg-[#fffdfa] p-6 text-[#171717] shadow-[0_18px_50px_rgba(0,0,0,0.08)] ${className}`.trim()}
    >
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="mb-4 text-sm text-[#6c6258]">{description}</p>

      {confirmationNumber && (
        <div className="mb-4 rounded-[22px] border border-[#eadfce] bg-[#f8f1e5] p-4">
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#8b7f72]">Confirmation Number</p>
          <p className="font-mono text-lg font-bold text-[#9d172b]">{confirmationNumber}</p>
        </div>
      )}

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <span className="text-sm uppercase tracking-[0.2em] text-[#8b7f72]">{item.label}</span>
              {item.href ? (
                <a
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                  className="break-all text-[#171717] transition-colors hover:text-[#9d172b]"
                >
                  {item.value}
                </a>
              ) : (
                <span className="break-all text-[#171717]">{item.value}</span>
              )}
            </div>
          ))}
          {supportSettings.support_hours && (
            <div className="flex flex-col gap-1 border-t border-[#eadfce] pt-2 md:flex-row md:items-center md:justify-between">
              <span className="text-sm uppercase tracking-[0.2em] text-[#8b7f72]">Response Hours</span>
              <span className="text-[#171717]">{supportSettings.support_hours}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-[#6c6258]">
          Our team will reply using the details attached to your booking. Configure direct support channels in the admin
          panel when you are ready.
        </p>
      )}
    </div>
  );
};

export default SupportContactCard;
