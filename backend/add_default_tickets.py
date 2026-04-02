import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL')
DB_NAME = os.getenv('DB_NAME', 'bruno_mars_vip')

# Default ticket pricing
DEFAULT_TICKETS = {
    "general": {
        "price_usd": 1000,
        "total_quantity": 100,
        "available_quantity": 100
    },
    "vip": {
        "price_usd": 5000,
        "total_quantity": 50,
        "available_quantity": 50
    },
    "meetgreet": {
        "price_usd": 10000,
        "total_quantity": 20,
        "available_quantity": 20
    },
    "backstage": {
        "price_usd": 15000,
        "total_quantity": 10,
        "available_quantity": 10
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
    print(f"   General Admission: $1,000 (100 tickets per event)")
    print(f"   VIP Access: $5,000 (50 tickets per event)")
    print(f"   Meet & Greet: $10,000 (20 tickets per event)")
    print(f"   Backstage Pass: $15,000 (10 tickets per event)")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_default_tickets())
