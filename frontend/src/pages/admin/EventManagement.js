import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import {
  PREMIUM_TICKET_TIERS,
  createEmptyPremiumTicketState
} from '../../utils/ticketTiers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    city: '',
    date: '',
    time: '',
    image_url: '',
    description: '',
    status: 'active'
  });
  const [ticketData, setTicketData] = useState(createEmptyPremiumTicketState());

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    try {
      let eventResponse;
      if (editingEvent) {
        eventResponse = await axios.put(
          `${API}/admin/events/${editingEvent.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        eventResponse = await axios.post(
          `${API}/admin/events`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Create/update tickets for the event
      const eventId = eventResponse.data.id;
      for (const [type, data] of Object.entries(ticketData)) {
        if (data.total_quantity > 0) {
          await axios.post(
            `${API}/admin/tickets`,
            {
              event_id: eventId,
              type: type,
              ...data
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }

      fetchEvents();
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event');
    }
  };

  const handleEdit = async (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      venue: event.venue,
      city: event.city,
      date: event.date,
      time: event.time,
      image_url: event.image_url,
      description: event.description,
      status: event.status
    });

    // Fetch tickets for this event
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/tickets/${event.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const tickets = response.data;
      const newTicketData = createEmptyPremiumTicketState();

      tickets.forEach(ticket => {
        newTicketData[ticket.type] = {
          price_usd: ticket.price_usd,
          available_quantity: ticket.available_quantity,
          total_quantity: ticket.total_quantity
        };
      });

      setTicketData(newTicketData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }

    setShowForm(true);
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/admin/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      venue: '',
      city: '',
      date: '',
      time: '',
      image_url: '',
      description: '',
      status: 'active'
    });
    setTicketData(createEmptyPremiumTicketState());
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleTicketChange = (type, field, value) => {
    setTicketData({
      ...ticketData,
      [type]: {
        ...ticketData[type],
        [field]: parseFloat(value) || 0
      }
    });
  };

  return (
    <div className="space-y-6" data-testid="event-management">
      <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_12px_30px_rgba(48,32,11,0.05)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#9d172b]">Events</p>
            <h1 className="mt-2 text-2xl font-black text-[#151515] sm:text-3xl">Keep the schedule clean.</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Add new stops, edit existing dates, and manage ticket quantities without the form taking over the whole page.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <div className="rounded-2xl border border-stone-200 bg-[#fcfaf6] px-4 py-3 text-sm text-stone-600">
              <span className="text-xs uppercase tracking-[0.18em] text-stone-400">Events on file</span>
              <p className="mt-1 text-2xl font-black text-[#151515]">{events.length}</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#151515] px-5 py-3 text-sm font-semibold text-white"
              data-testid="add-event-button"
            >
              <Plus className="h-4 w-4" />
              {showForm ? 'Close Form' : editingEvent ? 'Editing Event' : 'New Event'}
            </button>
          </div>
        </div>
      </section>

      {showForm && (
        <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_12px_30px_rgba(48,32,11,0.05)] sm:p-6" data-testid="event-form">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Event Form</p>
              <h2 className="mt-2 text-2xl font-black text-[#151515]">{editingEvent ? 'Edit Event' : 'New Event'}</h2>
            </div>
            <button type="button" onClick={resetForm} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-[#151515]">Event Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-[#151515]">Venue *</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({...formData, venue: e.target.value})}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-[#151515]">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-[#151515]">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-[#151515]">Time *</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-semibold text-[#151515]">Image URL *</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                placeholder="https://images.unsplash.com/..."
                required
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-semibold text-[#151515]">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                rows="4"
                required
              ></textarea>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-sm font-semibold text-[#151515]">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="mb-6 border-t border-stone-200 pt-6">
              <h3 className="text-xl font-black text-[#151515] mb-4">Premium Experience Tiers</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {PREMIUM_TICKET_TIERS.map((tier) => (
                  <div key={tier.type} className="rounded-[24px] border border-stone-200 bg-[#fcfaf6] p-4">
                    <h4 className="font-bold mb-3 text-[#151515]">{tier.label}</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm mb-1 text-stone-500">Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={ticketData[tier.type].price_usd}
                          onChange={(e) => handleTicketChange(tier.type, 'price_usd', e.target.value)}
                          className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-stone-500">Total Quantity</label>
                        <input
                          type="number"
                          value={ticketData[tier.type].total_quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            handleTicketChange(tier.type, 'total_quantity', val);
                            handleTicketChange(tier.type, 'available_quantity', val);
                          }}
                          className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-[#151515] px-5 py-3 text-sm font-semibold text-white"
              data-testid="save-event-button"
            >
              <Save className="w-4 h-4" />
              {editingEvent ? 'Update Event' : 'Create Event'}
            </button>
          </form>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <div key={event.id} className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_10px_24px_rgba(48,32,11,0.04)]" data-testid={`event-item-${event.id}`}>
            <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover" />
            <div className="p-5">
              <div className="flex justify-between items-start gap-3 mb-2">
                <h3 className="text-xl font-black text-[#151515]">{event.title}</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  event.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-600'
                }`}>
                  {event.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-stone-500 mb-1">{event.venue}</p>
              <p className="text-sm text-stone-500 mb-1">{event.city}</p>
              <p className="text-sm text-stone-500 mb-4">{event.date} | {event.time}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(event)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && !showForm && (
        <div className="rounded-[28px] border border-dashed border-stone-300 bg-white px-5 py-12 text-center text-stone-500">
          <p>No events yet. Use the new event button to add the first date.</p>
        </div>
      )}
    </div>
  );
};

export default EventManagement;

