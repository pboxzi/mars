import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { CheckCircle, Minus, Plus, X } from 'lucide-react';
import TurnstileField from './TurnstileField';
import useTurnstileConfig from '../hooks/useTurnstileConfig';
import useSupportSettings from '../hooks/useSupportSettings';
import { trackBookingSubmitted } from '../utils/adTracking';
import {
  PREMIUM_TICKET_DETAILS,
  PREMIUM_TICKET_ORDER,
  getTicketTierBasePrice,
  getTicketTierDescription,
  getTicketTierLabel
} from '../utils/ticketTiers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const eventDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric'
});

const PACKAGE_TICKET_TYPES = new Set(['hospitality', 'birthday', 'corporate', 'privatemeetup']);

const formatEventDate = (dateValue) => {
  if (!dateValue) {
    return '';
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return eventDateFormatter.format(parsedDate);
};

const formatTicketPrice = (price) => {
  if (!price || price <= 0) {
    return 'Contact Team';
  }

  return currencyFormatter.format(price);
};

const getDisplayTicketPrice = (ticket) => {
  if (!ticket) {
    return 0;
  }

  if (ticket.price_usd > 0) {
    return ticket.price_usd;
  }

  return getTicketTierBasePrice(ticket.type);
};

const BookingModal = ({ event, onClose, initialTicketType = null }) => {
  const [bookingStep, setBookingStep] = useState(1);
  const [showMoreAccessOptions, setShowMoreAccessOptions] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [formData, setFormData] = useState({
    ticket_type: 'vip',
    customer_name: '',
    email: '',
    phone: '',
    quantity: 1,
    message: '',
    website: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const { supportSettings } = useSupportSettings();
  const { isTurnstileEnabled, isLoadingTurnstileConfig } = useTurnstileConfig();

  const fetchTickets = useCallback(async () => {
    if (!event) {
      return;
    }

    try {
      const response = await axios.get(`${API}/events/${event.id}`);
      const apiTickets = response.data.tickets || [];
      const normalizedTickets = PREMIUM_TICKET_ORDER.map((ticketType) => {
        const apiTicket = apiTickets.find((ticket) => ticket.type === ticketType);
        const tierDetails = PREMIUM_TICKET_DETAILS[ticketType];

        return {
          id: apiTicket?.id || `${event.id}_${ticketType}`,
          event_id: apiTicket?.event_id || event.id,
          type: ticketType,
          price_usd: apiTicket?.price_usd > 0 ? apiTicket.price_usd : tierDetails.priceUsd,
          available_quantity: apiTicket?.available_quantity ?? tierDetails.availableQuantity,
          total_quantity: apiTicket?.total_quantity ?? tierDetails.totalQuantity
        };
      });

      setTickets(normalizedTickets);

      const firstAvailableTicket = normalizedTickets.find((ticket) => ticket.available_quantity > 0);
      const preferredTicket =
        normalizedTickets.find((ticket) => ticket.type === initialTicketType && ticket.available_quantity > 0) ||
        firstAvailableTicket ||
        normalizedTickets[0];

      if (preferredTicket) {
        setFormData((prev) => ({
          ...prev,
          ticket_type: preferredTicket.type
        }));
      }
    } catch (fetchError) {
      console.error('Error fetching tickets:', fetchError);
    }
  }, [event, initialTicketType]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    setBookingStep(1);
    setShowMoreAccessOptions(false);
    setError('');
    setCaptchaError('');
  }, [event?.id]);

  const orderedTickets = useMemo(
    () =>
      [...tickets].sort((left, right) => {
        return PREMIUM_TICKET_ORDER.indexOf(left.type) - PREMIUM_TICKET_ORDER.indexOf(right.type);
      }),
    [tickets]
  );

  const selectedTicket = useMemo(
    () => orderedTickets.find((ticket) => ticket.type === formData.ticket_type),
    [formData.ticket_type, orderedTickets]
  );

  const featuredAccessTickets = useMemo(
    () => orderedTickets.filter((ticket) => ['vip', 'meetgreet', 'backstage'].includes(ticket.type)),
    [orderedTickets]
  );

  const extendedAccessTickets = useMemo(
    () => orderedTickets.filter((ticket) => !['vip', 'meetgreet', 'backstage'].includes(ticket.type)),
    [orderedTickets]
  );

  const selectedTicketPrice = getDisplayTicketPrice(selectedTicket);
  const selectedTicketLabel = getTicketTierLabel(formData.ticket_type) || 'Select Ticket';
  const selectedTicketDescription = getTicketTierDescription(formData.ticket_type);
  const maxQuantity = selectedTicket ? Math.max(0, Math.min(selectedTicket.available_quantity, 10)) : 10;
  const subtotal = selectedTicketPrice * Number(formData.quantity || 0);
  const formattedEventDate = formatEventDate(event?.date);
  const formattedEventTime = event?.time || '';
  const selectionUnitLabel = PACKAGE_TICKET_TYPES.has(formData.ticket_type) ? 'Per Package' : 'Per Guest';
  const quantityUnitLabel = PACKAGE_TICKET_TYPES.has(formData.ticket_type) ? 'Packages' : 'Guests';
  const contactLine = [
    supportSettings.support_whatsapp ? `WhatsApp: ${supportSettings.support_whatsapp}` : null,
    supportSettings.support_phone ? `Phone: ${supportSettings.support_phone}` : null,
    supportSettings.support_instagram ? `Instagram: ${supportSettings.support_instagram}` : null
  ]
    .filter(Boolean)
    .join(' | ');

  const updateQuantity = (nextValue) => {
    const safeMaximum = maxQuantity > 0 ? maxQuantity : 1;
    const safeValue = Math.max(1, Math.min(safeMaximum, nextValue));
    setFormData((prev) => ({
      ...prev,
      quantity: safeValue
    }));
  };

  const handleChange = (changeEvent) => {
    const { name, value } = changeEvent.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }));
  };

  const selectAccessTier = (ticket) => {
    if (!ticket || ticket.available_quantity <= 0) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      ticket_type: ticket.type,
      quantity: Math.min(prev.quantity, Math.min(ticket.available_quantity, 10)) || 1
    }));
    setError('');
  };

  const continueToGuestDetails = () => {
    if (!selectedTicket || selectedTicket.available_quantity <= 0) {
      setError('Choose an available premium access option to continue.');
      return;
    }

    setError('');
    setBookingStep(2);
  };

  const continueToReview = () => {
    if (!formData.customer_name.trim()) {
      setError('Enter the guest name to continue.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Enter the email address to continue.');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Enter the phone number to continue.');
      return;
    }

    setError('');
    setBookingStep(3);
  };

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    setCaptchaError('');

    if (isLoadingTurnstileConfig) {
      setCaptchaError('Security check is loading. Please wait a moment and try again.');
      return;
    }

    if (isTurnstileEnabled && !captchaToken) {
      setCaptchaError('Please complete the security check.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/bookings`, {
        ...formData,
        event_id: event.id,
        captcha_token: captchaToken,
      });
      setConfirmationNumber(response.data.confirmation_number);
      trackBookingSubmitted({
        value: subtotal || undefined,
        currency: 'USD',
        ticketType: formData.ticket_type,
        quantity: Number(formData.quantity || 0),
        eventId: event.id,
      });
      setSuccess(true);
      setCaptchaToken('');
      setCaptchaResetSignal((current) => current + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Failed to submit booking request');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicators = () => (
    <div className="flex flex-wrap items-center gap-2">
      {[
        { id: 1, label: 'Choose Access' },
        { id: 2, label: 'Guest Details' },
        { id: 3, label: 'Review & Submit' }
      ].map((step) => {
        const isActive = bookingStep === step.id;
        const isComplete = bookingStep > step.id;

        return (
          <div
            key={step.id}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] ${
              isActive
                ? 'border-[#9d172b] bg-[#fff2e7] text-[#9d172b]'
                : isComplete
                  ? 'border-[#d7cab8] bg-white text-[#171717]'
                  : 'border-[#e6d7c5] bg-[#fffdf9] text-[#8b7c6d]'
            }`}
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                isActive ? 'bg-[#9d172b] text-white' : isComplete ? 'bg-[#171717] text-white' : 'bg-[#efe4d6] text-[#8b7c6d]'
              }`}
            >
              {step.id}
            </span>
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );

  const renderStepOne = () => (
    <>
      <div className="mt-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8b7c6d]">Step 1</div>
        <h3 className="mt-2 text-[28px] font-black uppercase tracking-[-0.05em] text-[#171717] lg:text-[30px]">
          Choose Your Access
        </h3>
        <p className="mt-2 max-w-[680px] text-[15px] leading-6 text-[#5f564d]">
          Pick the experience that fits your night, then continue with your guest details.
        </p>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-3">
        {featuredAccessTickets.map((ticket) => {
          const isSelected = formData.ticket_type === ticket.type;
          const isSoldOut = ticket.available_quantity <= 0;

          return (
            <button
              key={ticket.type}
              type="button"
              disabled={isSoldOut}
              onClick={() => selectAccessTier(ticket)}
              className={`rounded-[22px] border px-4 py-4 text-left transition ${
                isSelected
                  ? 'border-[#9d172b] bg-[#fff5ea] shadow-[0_10px_30px_rgba(157,23,43,0.08)]'
                  : 'border-[#e3d6c5] bg-white hover:border-[#b89f82] hover:shadow-[0_8px_18px_rgba(0,0,0,0.05)]'
              } ${isSoldOut ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              <div className="text-[18px] font-black uppercase text-[#171717]">{getTicketTierLabel(ticket.type)}</div>
              <div className="mt-2 text-[14px] leading-6 text-[#5f564d]">{getTicketTierDescription(ticket.type)}</div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[24px] font-black text-[#171717]">
                    {formatTicketPrice(getDisplayTicketPrice(ticket))}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b7c6d]">Starting</div>
                </div>
                <div className="text-right text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b7c6d]">
                  {isSoldOut ? 'Unavailable' : `${ticket.available_quantity} left`}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {extendedAccessTickets.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowMoreAccessOptions((current) => !current)}
            className="inline-flex items-center rounded-full border border-[#dacdbd] bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#171717] transition hover:bg-[#f5ecdf]"
          >
            {showMoreAccessOptions ? 'Hide More Access Options' : 'View More Access Options'}
          </button>
        </div>
      )}

      {showMoreAccessOptions && extendedAccessTickets.length > 0 && (
        <div className="mt-4 grid gap-2.5">
          {extendedAccessTickets.map((ticket) => {
            const isSelected = formData.ticket_type === ticket.type;
            const isSoldOut = ticket.available_quantity <= 0;

            return (
              <button
                key={ticket.type}
                type="button"
                disabled={isSoldOut}
                onClick={() => selectAccessTier(ticket)}
                className={`rounded-[18px] border px-4 py-3 text-left transition ${
                  isSelected ? 'border-[#9d172b] bg-[#fff5ea]' : 'border-[#e3d6c5] bg-white hover:border-[#b89f82]'
                } ${isSoldOut ? 'cursor-not-allowed opacity-40' : ''}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[16px] font-black uppercase text-[#171717]">
                      {getTicketTierLabel(ticket.type)}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-[#5f564d]">{getTicketTierDescription(ticket.type)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[18px] font-black text-[#171717]">
                      {formatTicketPrice(getDisplayTicketPrice(ticket))}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b7c6d]">Starting</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-[22px] border border-[#dfd2c0] bg-white px-4 py-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b7c6d]">Selected Experience</div>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[540px]">
            <div className="text-[26px] font-black uppercase tracking-[-0.04em] text-[#171717]">
              {selectedTicketLabel}
            </div>
            <p className="mt-2 text-[15px] leading-6 text-[#5f564d]">{selectedTicketDescription}</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-[28px] font-black text-[#171717]">{formatTicketPrice(selectedTicketPrice)}</div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8b7c6d]">Starting</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-[#6a6055]">Limited availability for this event. Choose your access and continue.</div>
        <button
          type="button"
          onClick={continueToGuestDetails}
          disabled={!selectedTicket || selectedTicket.available_quantity <= 0}
          className="rounded-full bg-[#141414] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </>
  );

  const renderStepTwo = () => (
    <>
      <div className="mt-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8b7c6d]">Step 2</div>
        <h3 className="mt-2 text-[28px] font-black uppercase tracking-[-0.05em] text-[#171717] lg:text-[30px]">
          Guest Details
        </h3>
        <p className="mt-2 max-w-[680px] text-[15px] leading-6 text-[#5f564d]">
          Tell us who this access is for, then review your request before submitting.
        </p>
      </div>

      <div className="mt-5 rounded-[22px] border border-[#dfd2c0] bg-white px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#efe4d6] pb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b7c6d]">Selected Access</div>
            <div className="mt-2 text-[24px] font-black uppercase tracking-[-0.04em] text-[#171717]">
              {selectedTicketLabel}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-[24px] font-black text-[#171717]">{formatTicketPrice(selectedTicketPrice)}</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b7c6d]">Starting</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8b7c6d]">Quantity</div>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center rounded-full border border-[#dacdbd] bg-[#faf4eb] p-1">
              <button
                type="button"
                className="rounded-full p-2 transition hover:bg-black/[0.04]"
                onClick={() => updateQuantity(Number(formData.quantity) - 1)}
                disabled={Number(formData.quantity) <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>

              <input
                type="number"
                name="quantity"
                min="1"
                max={maxQuantity || 10}
                value={formData.quantity}
                onChange={handleChange}
                className="w-14 border-0 bg-transparent text-center text-lg font-black outline-none"
              />

              <button
                type="button"
                className="rounded-full p-2 transition hover:bg-black/[0.04]"
                onClick={() => updateQuantity(Number(formData.quantity) + 1)}
                disabled={Number(formData.quantity) >= (maxQuantity || 10)}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="text-sm font-medium text-[#6a6055]">
              Up to {maxQuantity || 0} {quantityUnitLabel.toLowerCase()} for this access
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold uppercase tracking-[0.06em] text-[#171717]">Name</label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              className="w-full rounded-[16px] border border-[#ddcfbe] bg-[#fffdf9] px-4 py-2.5 outline-none transition focus:border-[#9d172b]"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold uppercase tracking-[0.06em] text-[#171717]">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-[16px] border border-[#ddcfbe] bg-[#fffdf9] px-4 py-2.5 outline-none transition focus:border-[#9d172b]"
              required
            />
          </div>
        </div>

        <div className="mt-3.5">
          <label className="mb-2 block text-sm font-bold uppercase tracking-[0.06em] text-[#171717]">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full rounded-[16px] border border-[#ddcfbe] bg-[#fffdf9] px-4 py-2.5 outline-none transition focus:border-[#9d172b]"
            required
          />
        </div>

        <div className="mt-3.5">
          <label className="mb-2 block text-sm font-bold uppercase tracking-[0.06em] text-[#171717]">Message</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows="3"
            className="w-full rounded-[16px] border border-[#ddcfbe] bg-[#fffdf9] px-4 py-3 outline-none transition focus:border-[#9d172b]"
            placeholder="Guest names, celebration details, seating preference, or special request."
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setBookingStep(1)}
          className="rounded-full border border-[#cdbba2] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#171717] transition hover:bg-[#f2ebdf]"
        >
          Back
        </button>

        <button
          type="button"
          onClick={continueToReview}
          className="rounded-full bg-[#141414] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:opacity-92"
        >
          Continue
        </button>
      </div>
    </>
  );

  const renderStepThree = () => (
    <>
      <div className="mt-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8b7c6d]">Step 3</div>
        <h3 className="mt-2 text-[28px] font-black uppercase tracking-[-0.05em] text-[#171717] lg:text-[30px]">
          Review & Submit
        </h3>
        <p className="mt-2 max-w-[680px] text-[15px] leading-6 text-[#5f564d]">
          Confirm your selection and guest details, then send your premium access request.
        </p>
      </div>

      <div className="mt-5 rounded-[22px] border border-[#dfd2c0] bg-white px-4 py-4">
        <div className="grid gap-4 border-b border-[#efe4d6] pb-4 sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8b7c6d]">Access</div>
            <div className="mt-2 text-[24px] font-black uppercase tracking-[-0.04em] text-[#171717]">
              {selectedTicketLabel}
            </div>
            <div className="mt-2 text-sm leading-6 text-[#5f564d]">{selectedTicketDescription}</div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start justify-between gap-4">
              <span className="text-[#6a6055]">Price</span>
              <span className="font-bold text-[#171717]">{formatTicketPrice(selectedTicketPrice)}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-[#6a6055]">Quantity</span>
              <span className="font-bold text-[#171717]">
                {formData.quantity} {formData.quantity === 1 ? quantityUnitLabel.slice(0, -1) : quantityUnitLabel}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-[#6a6055]">Total</span>
              <span className="text-[24px] font-black text-[#171717]">{formatTicketPrice(subtotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-[#5f564d] sm:grid-cols-2">
          <div>
            <span className="font-bold text-[#171717]">Guest:</span> {formData.customer_name}
          </div>
          <div>
            <span className="font-bold text-[#171717]">Email:</span> {formData.email}
          </div>
          <div>
            <span className="font-bold text-[#171717]">Phone:</span> {formData.phone}
          </div>
          {formData.message?.trim() && (
            <div className="sm:col-span-2">
              <span className="font-bold text-[#171717]">Notes:</span> {formData.message}
            </div>
          )}
        </div>

        <div className="mt-5 rounded-[18px] bg-[#f5ecdf] px-4 py-3 text-sm leading-6 text-[#5f564d]">
          Your request is reviewed first. Payment instructions are only sent after your premium access request is approved.
        </div>

        <input
          type="text"
          name="website"
          value={formData.website || ''}
          onChange={handleChange}
          tabIndex="-1"
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <div className="mt-5">
          <TurnstileField
            token={captchaToken}
            onTokenChange={(nextToken) => {
              setCaptchaToken(nextToken);
              if (nextToken) {
                setCaptchaError('');
                setError('');
              }
            }}
            resetSignal={captchaResetSignal}
            error={captchaError}
          />
        </div>

        {error && (
          <div className="mt-3.5 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {contactLine && <div className="mt-4 text-sm leading-6 text-[#6a6055]">Questions? {contactLine}</div>}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setBookingStep(2)}
          className="rounded-full border border-[#cdbba2] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#171717] transition hover:bg-[#f2ebdf]"
        >
          Back
        </button>

        <button
          type="submit"
          disabled={loading || isLoadingTurnstileConfig || !selectedTicket || selectedTicket.available_quantity <= 0}
          className="rounded-full bg-[#141414] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Submitting...' : isLoadingTurnstileConfig ? 'Loading Security Check...' : 'Submit Premium Request'}
        </button>
      </div>
    </>
  );

  if (success) {
    return (
      <div className="fixed inset-0 z-[120] bg-black/80 px-4 py-6 backdrop-blur-[2px]" onClick={onClose}>
        <div
          className="mx-auto max-w-[640px] rounded-[28px] border border-[#d9ccb9] bg-[#fbf7ef] p-8 text-[#171717] shadow-[0_30px_90px_rgba(0,0,0,0.32)]"
          onClick={(clickEvent) => clickEvent.stopPropagation()}
          data-testid="booking-success-modal"
        >
          <div className="text-center">
            <CheckCircle className="mx-auto mb-4 h-14 w-14 text-[#9d172b]" />
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8c7f72]">Premium Request</div>
            <h2 className="mt-3 text-[34px] font-black uppercase tracking-[-0.05em]">Request Submitted</h2>
            <p className="mt-3 text-sm leading-7 text-[#5f564d]">
              Your premium access request has been received for this Bruno Mars show.
            </p>

            <div className="mt-6 rounded-[22px] border border-[#dfd2c0] bg-white px-5 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8c7f72]">
                Confirmation Number
              </div>
              <div className="mt-2 text-[30px] font-black tracking-[0.08em]" data-testid="confirmation-number">
                {confirmationNumber}
              </div>
            </div>

            {contactLine && (
              <div className="mt-5 text-sm font-medium text-[#5f564d]">
                Questions? {contactLine}
              </div>
            )}

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link
                to={`/booking-status?confirmation=${confirmationNumber}`}
                className="rounded-full bg-[#131313] px-5 py-4 text-center text-sm font-bold uppercase tracking-[0.14em] text-white no-underline transition hover:opacity-90"
              >
                Track Booking
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[#cdbba2] px-5 py-4 text-sm font-bold uppercase tracking-[0.14em] text-[#171717] transition hover:bg-[#f2ebdf]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/80 px-3 py-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[30px] border border-[#d9ccb9] bg-[#f7efe2] text-[#171717] shadow-[0_32px_96px_rgba(0,0,0,0.36)]"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        data-testid="booking-modal"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-20 rounded-full border border-[#e4d7c5] bg-white/92 p-2.5 text-black shadow-sm transition hover:bg-white"
          aria-label="Close booking modal"
        >
          <X className="h-4 w-4" />
        </button>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
            <div className="flex min-h-[380px] flex-col overflow-hidden bg-[#17110e] lg:min-h-[820px]">
              <div className="relative h-[290px] border-b border-white/10 bg-[radial-gradient(circle_at_top,#532018_0%,#241613_55%,#17110e_100%)] sm:h-[340px] lg:h-[370px]">
                <img
                  src={event?.image_url}
                  alt="Bruno Mars"
                  className="absolute inset-0 h-full w-full object-contain object-center p-4 sm:p-6 lg:p-7"
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#17110e] via-[#17110e]/45 to-transparent" />
              </div>

              <div className="flex flex-1 flex-col justify-between p-6 text-white sm:p-8 lg:p-10">
                <div>
                  <div className="inline-flex rounded-full border border-white/18 bg-white/8 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0c98d] backdrop-blur-sm">
                    Official Bruno Mars Premium Access
                  </div>

                  <div className="mt-8">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0c98d]">
                      Selected Event
                    </div>
                    <h2 className="mt-3 text-[40px] font-black uppercase leading-none tracking-[-0.06em] text-white sm:text-[52px]">
                      Bruno Mars
                    </h2>
                    <p className="mt-4 max-w-[440px] text-sm leading-7 text-white/78">
                      {formattedEventDate} {formattedEventTime ? `| ${formattedEventTime}` : ''}
                      <br />
                      {event?.venue}, {event?.city}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0c98d]">
                    Featured Tier
                  </div>
                  <div className="mt-3 rounded-[24px] border border-white/16 bg-white/10 p-5 backdrop-blur-md">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="max-w-[430px]">
                        <div className="text-[28px] font-black uppercase leading-[0.96] text-white">
                          {selectedTicketLabel}
                        </div>
                        <p className="mt-3 text-sm leading-7 text-white/78">
                          {selectedTicketDescription}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-[28px] font-black text-white">
                          {formatTicketPrice(selectedTicketPrice)}
                        </div>
                        <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/58">
                          {selectionUnitLabel}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] border border-white/14 bg-white/8 px-4 py-4">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/58">
                        Availability
                      </div>
                      <div className="mt-2 text-[24px] font-black text-white">
                        {selectedTicket?.available_quantity ?? 0}
                      </div>
                      <div className="text-xs uppercase tracking-[0.12em] text-white/58">
                        Requests Remaining
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-white/14 bg-white/8 px-4 py-4">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/58">
                        Request Total
                      </div>
                      <div className="mt-2 text-[24px] font-black text-white">
                        {formatTicketPrice(subtotal)}
                      </div>
                      <div className="text-xs uppercase tracking-[0.12em] text-white/58">
                        {formData.quantity} {formData.quantity === 1 ? quantityUnitLabel.slice(0, -1) : quantityUnitLabel}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#fcfaf6] px-5 pb-6 pt-16 lg:max-h-[820px] lg:overflow-y-auto lg:px-7 lg:pb-8 lg:pt-12">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8b7c6d]">
                  Premium Tiers
                </div>
                <h3 className="mt-2 text-[28px] font-black uppercase tracking-[-0.05em] text-[#171717] lg:text-[30px]">
                  Choose Your Access
                </h3>
                <p className="mt-2 max-w-[680px] text-[15px] leading-6 text-[#5f564d]">
                  Select the premium experience that fits your guest plan. Each tier includes private handling,
                  elevated access, and concierge-level coordination for this show.
                </p>
              </div>

              <div className="mt-5 grid gap-2.5 xl:grid-cols-2">
                {orderedTickets.map((ticket) => {
                  const isSelected = formData.ticket_type === ticket.type;
                  const isSoldOut = ticket.available_quantity <= 0;
                  const displayPrice = getDisplayTicketPrice(ticket);

                  return (
                    <button
                      key={ticket.type}
                      type="button"
                      disabled={isSoldOut}
                      onClick={() =>
                        !isSoldOut &&
                        setFormData((prev) => ({
                          ...prev,
                          ticket_type: ticket.type,
                          quantity: Math.min(prev.quantity, Math.min(ticket.available_quantity, 10)) || 1
                        }))
                      }
                      className={`rounded-[20px] border px-4 py-4 text-left transition ${
                        isSelected
                          ? 'border-[#9d172b] bg-[#fff8ee] shadow-[0_10px_30px_rgba(157,23,43,0.08)]'
                          : 'border-[#e3d6c5] bg-white hover:border-[#b89f82] hover:shadow-[0_8px_18px_rgba(0,0,0,0.05)]'
                      } ${isSoldOut ? 'cursor-not-allowed opacity-40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="max-w-[80%]">
                          <div className="text-[17px] font-black uppercase leading-tight text-[#171717] lg:text-[18px]">
                            {getTicketTierLabel(ticket.type)}
                          </div>
                          <p className="mt-1.5 text-[15px] leading-6 text-[#5f564d]">
                            {getTicketTierDescription(ticket.type)}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-[20px] font-black leading-none text-[#171717] lg:text-[21px]">
                            {formatTicketPrice(displayPrice)}
                          </div>
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b7c6d]">
                            Starting
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-4 border-t border-[#efe4d6] pt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b7c6d]">
                        <span>{isSoldOut ? 'Currently unavailable' : `${ticket.available_quantity} remaining`}</span>
                        <span>{ticket.available_quantity <= 10 ? 'Highly limited' : 'Premium allocation'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[0.84fr_1fr]">
                <div className="rounded-[22px] border border-[#dfd2c0] bg-[#fffdf9] px-4 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b7c6d]">
                    Your Selection
                  </div>

                  <div className="mt-3 space-y-2.5 border-b border-[#efe4d6] pb-4 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[#6a6055]">Tier</span>
                      <span className="max-w-[220px] text-right font-bold text-[#171717]">
                        {selectedTicketLabel}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[#6a6055]">Price</span>
                      <span className="font-bold text-[#171717]">{formatTicketPrice(selectedTicketPrice)}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8b7c6d]">
                      Quantity
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-4">
                      <div className="inline-flex items-center rounded-full border border-[#dacdbd] bg-[#faf4eb] p-1">
                        <button
                          type="button"
                          className="rounded-full p-2 transition hover:bg-black/[0.04]"
                          onClick={() => updateQuantity(Number(formData.quantity) - 1)}
                          disabled={Number(formData.quantity) <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <input
                          type="number"
                          name="quantity"
                          min="1"
                          max={maxQuantity || 10}
                          value={formData.quantity}
                          onChange={handleChange}
                          className="w-14 border-0 bg-transparent text-center text-lg font-black outline-none"
                        />

                        <button
                          type="button"
                          className="rounded-full p-2 transition hover:bg-black/[0.04]"
                          onClick={() => updateQuantity(Number(formData.quantity) + 1)}
                          disabled={Number(formData.quantity) >= (maxQuantity || 10)}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="text-sm font-medium text-[#6a6055]">
                        Maximum {maxQuantity || 0} {quantityUnitLabel.toLowerCase()} for this tier
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[18px] bg-[#f5ecdf] px-4 py-3.5">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm font-bold uppercase tracking-[0.12em] text-[#6a6055]">Total</span>
                      <span className="text-[24px] font-black text-[#171717]">{formatTicketPrice(subtotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#dfd2c0] bg-white px-4 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b7c6d]">
                    Guest Details
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold uppercase tracking-[0.06em] text-[#171717]">
                        Name
                      </label>
                      <input
                        type="text"
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleChange}
                        className="w-full rounded-[16px] border border-[#ddcfbe] bg-[#fffdf9] px-4 py-2.5 outline-none transition focus:border-[#9d172b]"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold uppercase tracking-[0.06em] text-[#171717]">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full rounded-[16px] border border-[#ddcfbe] bg-[#fffdf9] px-4 py-2.5 outline-none transition focus:border-[#9d172b]"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-3.5">
                    <label className="mb-2 block text-sm font-bold uppercase tracking-[0.06em] text-[#171717]">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full rounded-[16px] border border-[#ddcfbe] bg-[#fffdf9] px-4 py-2.5 outline-none transition focus:border-[#9d172b]"
                      required
                    />
                  </div>

                  <div className="mt-3.5">
                    <label className="mb-2 block text-sm font-bold uppercase tracking-[0.06em] text-[#171717]">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="3"
                      className="w-full rounded-[16px] border border-[#ddcfbe] bg-[#fffdf9] px-4 py-3 outline-none transition focus:border-[#9d172b]"
                      placeholder="Guest names, celebration details, seating preference, or special request."
                    />
                  </div>

                  <input
                    type="text"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleChange}
                    tabIndex="-1"
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />

                  <TurnstileField
                    token={captchaToken}
                    onTokenChange={(nextToken) => {
                      setCaptchaToken(nextToken);
                      if (nextToken) {
                        setCaptchaError('');
                        setError('');
                      }
                    }}
                    resetSignal={captchaResetSignal}
                    error={captchaError}
                  />

                  {error && (
                    <div className="mt-3.5 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {contactLine && (
                    <div className="mt-4 text-sm leading-6 text-[#6a6055]">
                      Questions? {contactLine}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || isLoadingTurnstileConfig || !selectedTicket || selectedTicket.available_quantity <= 0}
                    className="mt-5 w-full rounded-full bg-[#141414] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? 'Submitting...'
                      : isLoadingTurnstileConfig
                        ? 'Loading Security Check...'
                        : 'Submit Premium Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
