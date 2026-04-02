import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL')
DB_NAME = os.getenv('DB_NAME', 'bruno_mars_vip')

# All tour dates from official Bruno Mars website
TOUR_DATES = [
    {"date": "Apr 10, 2026", "venue": "Allegiant Stadium", "city": "Las Vegas, NV"},
    {"date": "Apr 11, 2026", "venue": "Allegiant Stadium", "city": "Las Vegas, NV"},
    {"date": "Apr 14, 2026", "venue": "State Farm Stadium", "city": "Glendale, AZ"},
    {"date": "Apr 15, 2026", "venue": "State Farm Stadium", "city": "Glendale, AZ"},
    {"date": "Apr 18, 2026", "venue": "Globe Life Field", "city": "Arlington, TX"},
    {"date": "Apr 19, 2026", "venue": "Globe Life Field", "city": "Arlington, TX"},
    {"date": "Apr 22, 2026", "venue": "NRG Stadium", "city": "Houston, TX"},
    {"date": "Apr 25, 2026", "venue": "Bobby Dodd Stadium at Hyundai Field", "city": "Atlanta, GA"},
    {"date": "Apr 26, 2026", "venue": "Bobby Dodd Stadium at Hyundai Field", "city": "Atlanta, GA"},
    {"date": "Apr 29, 2026", "venue": "Bank of America Stadium", "city": "Charlotte, NC"},
    {"date": "May 02, 2026", "venue": "Northwest Stadium", "city": "Landover, MD"},
    {"date": "May 03, 2026", "venue": "Northwest Stadium", "city": "Landover, MD"},
    {"date": "May 06, 2026", "venue": "Nissan Stadium", "city": "Nashville, TN"},
    {"date": "May 09, 2026", "venue": "Ford Field", "city": "Detroit, MI"},
    {"date": "May 10, 2026", "venue": "Ford Field", "city": "Detroit, MI"},
    {"date": "May 13, 2026", "venue": "U.S. Bank Stadium", "city": "Minneapolis, MN"},
    {"date": "May 16, 2026", "venue": "Soldier Field Stadium", "city": "Chicago, IL"},
    {"date": "May 17, 2026", "venue": "Soldier Field Stadium", "city": "Chicago, IL"},
    {"date": "May 20, 2026", "venue": "Ohio Stadium", "city": "Columbus, OH"},
    {"date": "May 23, 2026", "venue": "Rogers Stadium", "city": "Toronto, ON"},
    {"date": "May 24, 2026", "venue": "Rogers Stadium", "city": "Toronto, ON"},
    {"date": "May 27, 2026", "venue": "Rogers Stadium", "city": "Toronto, ON"},
    {"date": "May 28, 2026", "venue": "Rogers Stadium", "city": "Toronto, ON"},
    {"date": "May 30, 2026", "venue": "Rogers Stadium", "city": "Toronto, ON"},
    {"date": "Jun 18, 2026", "venue": "Stade de France", "city": "Paris, FR"},
    {"date": "Jun 20, 2026", "venue": "Stade de France", "city": "Paris, FR"},
    {"date": "Jun 21, 2026", "venue": "Stade de France", "city": "Paris, FR"},
    {"date": "Jun 26, 2026", "venue": "Olympiastadion", "city": "Berlin, DE"},
    {"date": "Jun 28, 2026", "venue": "Olympiastadion", "city": "Berlin, DE"},
    {"date": "Jun 29, 2026", "venue": "Olympiastadion", "city": "Berlin, DE"},
    {"date": "Jul 02, 2026", "venue": "Johan Cruijff ArenA", "city": "Amsterdam, NL"},
    {"date": "Jul 04, 2026", "venue": "Johan Cruijff ArenA", "city": "Amsterdam, NL"},
    {"date": "Jul 05, 2026", "venue": "Johan Cruijff ArenA", "city": "Amsterdam, NL"},
    {"date": "Jul 07, 2026", "venue": "Johan Cruijff ArenA", "city": "Amsterdam, NL"},
    {"date": "Jul 10, 2026", "venue": "Riyadh Air Metropolitano", "city": "Madrid, ES"},
    {"date": "Jul 11, 2026", "venue": "Riyadh Air Metropolitano", "city": "Madrid, ES"},
    {"date": "Jul 14, 2026", "venue": "Stadio San Siro", "city": "Milan, IT"},
    {"date": "Jul 15, 2026", "venue": "Stadio San Siro", "city": "Milan, IT"},
    {"date": "Jul 18, 2026", "venue": "Wembley Stadium Connected by EE", "city": "London, UK"},
    {"date": "Jul 19, 2026", "venue": "Wembley Stadium Connected by EE", "city": "London, UK"},
    {"date": "Jul 22, 2026", "venue": "Wembley Stadium Connected by EE", "city": "London, UK"},
    {"date": "Jul 24, 2026", "venue": "Wembley Stadium Connected by EE", "city": "London, UK"},
    {"date": "Jul 25, 2026", "venue": "Wembley Stadium Connected by EE", "city": "London, UK"},
    {"date": "Jul 28, 2026", "venue": "Wembley Stadium Connected by EE", "city": "London, UK"},
    {"date": "Aug 21, 2026", "venue": "Metlife Stadium", "city": "East Rutherford, NJ"},
    {"date": "Aug 22, 2026", "venue": "Metlife Stadium", "city": "East Rutherford, NJ"},
    {"date": "Aug 25, 2026", "venue": "Metlife Stadium", "city": "East Rutherford, NJ"},
    {"date": "Aug 26, 2026", "venue": "MetLife Stadium", "city": "East Rutherford, NJ"},
    {"date": "Aug 29, 2026", "venue": "Acrisure Stadium", "city": "Pittsburgh, PA"},
    {"date": "Sep 01, 2026", "venue": "Lincoln Financial Field", "city": "Philadelphia, PA"},
    {"date": "Sep 02, 2026", "venue": "Lincoln Financial Field", "city": "Philadelphia, PA"},
    {"date": "Sep 05, 2026", "venue": "Gillette Stadium", "city": "Foxborough, MA"},
    {"date": "Sep 06, 2026", "venue": "Gillette Stadium", "city": "Foxborough, MA"},
    {"date": "Sep 09, 2026", "venue": "Lucas Oil Stadium", "city": "Indianapolis, IN"},
    {"date": "Sep 12, 2026", "venue": "Raymond James Stadium", "city": "Tampa, FL"},
    {"date": "Sep 13, 2026", "venue": "Raymond James Stadium", "city": "Tampa, FL"},
    {"date": "Sep 16, 2026", "venue": "Caesars Superdome", "city": "New Orleans, LA"},
    {"date": "Sep 19, 2026", "venue": "Hard Rock Stadium", "city": "Miami, FL"},
    {"date": "Sep 20, 2026", "venue": "Hard Rock Stadium", "city": "Miami, FL"},
    {"date": "Sep 23, 2026", "venue": "Alamodome", "city": "San Antonio, TX"},
    {"date": "Sep 26, 2026", "venue": "Falcon Stadium at the United States Air Force Academy", "city": "Air Force Academy, CO"},
    {"date": "Sep 27, 2026", "venue": "Falcon Stadium at the United States Air Force Academy", "city": "Air Force Academy, CO"},
    {"date": "Sep 30, 2026", "venue": "SoFi Stadium", "city": "Los Angeles, CA"},
    {"date": "Oct 02, 2026", "venue": "SoFi Stadium", "city": "Los Angeles, CA"},
    {"date": "Oct 03, 2026", "venue": "SoFi Stadium", "city": "Los Angeles, CA"},
    {"date": "Oct 06, 2026", "venue": "SoFi Stadium", "city": "Los Angeles, CA"},
    {"date": "Oct 07, 2026", "venue": "SoFi Stadium", "city": "Los Angeles, CA"},
    {"date": "Oct 10, 2026", "venue": "Levi's Stadium", "city": "Santa Clara, CA"},
    {"date": "Oct 11, 2026", "venue": "Levi's Stadium", "city": "Santa Clara, CA"},
    {"date": "Oct 14, 2026", "venue": "BC Place", "city": "Vancouver, BC"},
    {"date": "Oct 16, 2026", "venue": "BC Place", "city": "Vancouver, BC"},
    {"date": "Oct 17, 2026", "venue": "BC Place", "city": "Vancouver, BC"},
    {"date": "Oct 20, 2026", "venue": "BC Place", "city": "Vancouver, BC"},
    {"date": "Oct 21, 2026", "venue": "BC Place Stadium", "city": "Vancouver, BC"},
    {"date": "Dec 03, 2026", "venue": "Estadio GNP Seguros", "city": "Mexico City, MX"},
    {"date": "Dec 04, 2026", "venue": "Estadio GNP Seguros", "city": "Mexico City, MX"},
    {"date": "Dec 07, 2026", "venue": "Estadio GNP Seguros", "city": "Mexico City, MX"},
    {"date": "Dec 08, 2026", "venue": "Estadio GNP Seguros", "city": "Mexico City, MX"},
]

async def seed_tour_dates():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Clear existing events
    await db.events.delete_many({})
    print("✅ Cleared existing events")
    
    # Insert all tour dates
    events_to_insert = []
    for idx, tour_date in enumerate(TOUR_DATES, start=1):
        event = {
            "id": f"event_{idx}",
            "title": "The Romantic Tour",
            "venue": tour_date["venue"],
            "city": tour_date["city"],
            "date": tour_date["date"],
            "time": "7:00 PM",
            "image": "https://www.brunomars.com/sites/g/files/g2000021861/files/2026-03/BrunoTheRomanticTour_Creative10_1080x1440hetvdvre.jpg",
            "image_url": "https://www.brunomars.com/sites/g/files/g2000021861/files/2026-03/BrunoTheRomanticTour_Creative10_1080x1440hetvdvre.jpg",
            "description": f"Bruno Mars - The Romantic Tour at {tour_date['venue']} in {tour_date['city']}",
            "status": "active"
        }
        events_to_insert.append(event)
    
    result = await db.events.insert_many(events_to_insert)
    print(f"✅ Inserted {len(result.inserted_ids)} tour dates")
    
    # Verify
    count = await db.events.count_documents({})
    print(f"✅ Total events in database: {count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_tour_dates())
