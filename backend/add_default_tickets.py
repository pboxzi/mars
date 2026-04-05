import asyncio
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL')
DB_NAME = os.getenv('DB_NAME', 'bruno_mars_vip')

DEFAULT_TICKETS = {
    'vip': {
        'price_usd': 4500,
        'total_quantity': 72,
        'available_quantity': 72,
    },
    'meetgreet': {
        'price_usd': 12500,
        'total_quantity': 18,
        'available_quantity': 18,
    },
    'backstage': {
        'price_usd': 29000,
        'total_quantity': 7,
        'available_quantity': 7,
    },
    'soundcheck': {
        'price_usd': 7500,
        'total_quantity': 28,
        'available_quantity': 28,
    },
    'photoop': {
        'price_usd': 17500,
        'total_quantity': 12,
        'available_quantity': 12,
    },
    'aftershow': {
        'price_usd': 42000,
        'total_quantity': 8,
        'available_quantity': 8,
    },
    'hospitality': {
        'price_usd': 125000,
        'total_quantity': 5,
        'available_quantity': 5,
    },
    'birthday': {
        'price_usd': 210000,
        'total_quantity': 4,
        'available_quantity': 4,
    },
    'corporate': {
        'price_usd': 425000,
        'total_quantity': 3,
        'available_quantity': 3,
    },
    'privatemeetup': {
        'price_usd': 850000,
        'total_quantity': 1,
        'available_quantity': 1,
    },
}


async def add_default_tickets():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    events = await db.events.find({}, {'_id': 0}).to_list(1000)
    print(f'Found {len(events)} events')

    tickets_synced = 0
    for event in events:
        event_id = event['id']

        for ticket_type, pricing in DEFAULT_TICKETS.items():
            existing = await db.ticket_types.find_one({'event_id': event_id, 'type': ticket_type}, {'_id': 0})
            sold_quantity = 0
            if existing:
                sold_quantity = max(
                    0,
                    int(existing.get('total_quantity', 0)) - int(existing.get('available_quantity', 0)),
                )

            target_total = int(pricing['total_quantity'])
            target_available = max(target_total - sold_quantity, 0)
            ticket_payload = {
                'event_id': event_id,
                'type': ticket_type,
                'price_usd': pricing['price_usd'],
                'total_quantity': target_total,
                'available_quantity': target_available,
            }

            if existing:
                await db.ticket_types.update_one({'id': existing['id']}, {'$set': ticket_payload})
            else:
                await db.ticket_types.insert_one(
                    {
                        'id': f'ticket_{event_id}_{ticket_type}',
                        **ticket_payload,
                    }
                )

            tickets_synced += 1

    total_tickets = await db.ticket_types.count_documents({})
    print(f'Synced {tickets_synced} ticket types across all events')
    print(f'Total tickets in database: {total_tickets}')
    print('\nUpdated pricing defaults:')
    print('  VIP Access: $4,500 (72 per event)')
    print('  Meet & Greet: $12,500 (18 per event)')
    print('  Backstage Pass: $29,000 (7 per event)')
    print('  Soundcheck Experience: $7,500 (28 per event)')
    print('  Photo Op Experience: $17,500 (12 per event)')
    print('  After Show Lounge: $42,000 (8 per event)')
    print('  Private Table / Hospitality: $125,000 (5 per event)')
    print('  Birthday / Celebration Package: $210,000 (4 per event)')
    print('  Corporate Booking: $425,000 (3 per event)')
    print('  Private Meet-Up Request: $850,000 (1 per event)')

    client.close()


if __name__ == '__main__':
    asyncio.run(add_default_tickets())
