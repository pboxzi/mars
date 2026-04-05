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
    <div data-testid="event-management">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Event Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2"
          data-testid="add-event-button"
        >
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      {/* Event Form */}
      {showForm && (
        <div className="bg-white rounded-lg p-6 mb-8 border border-stone-200" data-testid="event-form">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{editingEvent ? 'Edit Event' : 'New Event'}</h2>
            <button onClick={resetForm}><X className="w-6 h-6" /></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2">Event Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block mb-2">Venue *</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({...formData, venue: e.target.value})}
                  className="w-full bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block mb-2">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block mb-2">Time *</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2">Image URL *</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                className="w-full bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                placeholder="https://images.unsplash.com/..."
                required
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                rows="3"
                required
              ></textarea>
            </div>

            <div className="mb-6">
              <label className="block mb-2">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Ticket Pricing */}
            <div className="border-t border-stone-300 pt-6 mb-6">
              <h3 className="text-xl font-bold mb-4">Premium Experience Tiers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PREMIUM_TICKET_TIERS.map((tier) => (
                  <div key={tier.type} className="bg-stone-100 rounded-lg p-4">
                    <h4 className="font-bold mb-3">{tier.label}</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm mb-1">Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={ticketData[tier.type].price_usd}
                          onChange={(e) => handleTicketChange(tier.type, 'price_usd', e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Total Quantity</label>
                        <input
                          type="number"
                          value={ticketData[tier.type].total_quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            handleTicketChange(tier.type, 'total_quantity', val);
                            handleTicketChange(tier.type, 'available_quantity', val);
                          }}
                          className="w-full bg-white border border-stone-300 rounded px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2"
              data-testid="save-event-button"
            >
              <Save className="w-5 h-5" />
              {editingEvent ? 'Update Event' : 'Create Event'}
            </button>
          </form>
        </div>
      )}

      {/* Events List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg overflow-hidden border border-stone-200" data-testid={`event-item-${event.id}`}>
            <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover" />
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{event.title}</h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  event.status === 'active' ? 'bg-green-900/30 text-green-500' : 'bg-gray-900/30 text-stone-500'
                }`}>
                  {event.status.toUpperCase()}
                </span>
              </div>
              <p className="text-stone-500 text-sm mb-1">{event.venue}</p>
              <p className="text-stone-500 text-sm mb-1">{event.city}</p>
              <p className="text-stone-500 text-sm mb-4">{event.date} | {event.time}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(event)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded flex items-center justify-center gap-2"
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
        <div className="text-center py-12 text-stone-500">
          <p>No events yet. Click "Add Event" to create one.</p>
        </div>
      )}
    </div>
  );
};

export default EventManagement;

