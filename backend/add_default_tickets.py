import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL')
DB_NAME = os.getenv('DB_NAME', 'bruno_mars_vip')

# Default ticket pricing
DEFAULT_TICKETS = {
    "vip": {
        "price_usd": 5000,
        "total_quantity": 100,
        "available_quantity": 100
    },
    "meetgreet": {
        "price_usd": 15000,
        "total_quantity": 25,
        "available_quantity": 25
    },
    "backstage": {
        "price_usd": 35000,
        "total_quantity": 10,
        "available_quantity": 10
    },
    "soundcheck": {
        "price_usd": 8500,
        "total_quantity": 40,
        "available_quantity": 40
    },
    "photoop": {
        "price_usd": 20000,
        "total_quantity": 20,
        "available_quantity": 20
    },
    "aftershow": {
        "price_usd": 50000,
        "total_quantity": 12,
        "available_quantity": 12
    },
    "hospitality": {
        "price_usd": 150000,
        "total_quantity": 8,
        "available_quantity": 8
    },
    "birthday": {
        "price_usd": 250000,
        "total_quantity": 6,
        "available_quantity": 6
    },
    "corporate": {
        "price_usd": 500000,
        "total_quantity": 4,
        "available_quantity": 4
    },
    "privatemeetup": {
        "price_usd": 1000000,
        "total_quantity": 2,
        "available_quantity": 2
    }
}

async def add_default_tickets():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Clear existing tickets
    await db.ticket_types.delete_many({})
    print("✅ Cleared existing tickets")
    
    # Get all events
    events = await db.events.find({}, {"_id": 0}).to_list(1000)
    print(f"📊 Found {len(events)} events")
    
    # Add tickets for each event
    tickets_added = 0
    for event in events:
        event_id = event['id']
        
        for ticket_type, pricing in DEFAULT_TICKETS.items():
            ticket = {
                "id": f"ticket_{event_id}_{ticket_type}",
                "event_id": event_id,
                "type": ticket_type,
                **pricing
            }
            await db.ticket_types.insert_one(ticket)
            tickets_added += 1
    
    print(f"✅ Added {tickets_added} ticket types across all events")
    
    # Verify
    total_tickets = await db.ticket_types.count_documents({})
    print(f"✅ Total tickets in database: {total_tickets}")
    
    print("\n💰 Default Pricing:")
    print(f"   VIP Access: $5,000 (100 tickets per event)")
    print(f"   Meet & Greet: $15,000 (25 tickets per event)")
    print(f"   Backstage Pass: $35,000 (10 tickets per event)")
    print(f"   Soundcheck Experience: $8,500 (40 tickets per event)")
    print(f"   Photo Op Experience: $20,000 (20 tickets per event)")
    print(f"   After Show Lounge: $50,000 (12 tickets per event)")
    print(f"   Private Table / Hospitality: $150,000 (8 tickets per event)")
    print(f"   Birthday / Celebration Package: $250,000 (6 tickets per event)")
    print(f"   Corporate Booking: $500,000 (4 tickets per event)")
    print(f"   Private Meet-Up Request: $1,000,000 (2 tickets per event)")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_default_tickets())
