// Calculate Price API Endpoint - Simplified Working Version

import { NextRequest, NextResponse } from 'next/server';

// Static hotel data (avoiding file reading issues)
const HOTELS_DATA = [
  { otel_id: 1, otel_adi: "De Mare Family Hotel", otel_lokasyon: "Antalya - Alanya", otel_sitesi: "https://www.demarefamilyhotel.net", otel_no: "0242 524 55 96", otel_whatsapp: "https://wa.me/902425245674", otel_info: "Denize Sıfır" },
  { otel_id: 2, otel_adi: "Club SVS Hotel", otel_lokasyon: "Antalya - Alanya", otel_sitesi: "https://www.clubsvshotel.com", otel_no: "0242 524 56 80", otel_whatsapp: "https://wa.me/902425245680", otel_info: "Denize Sıfır" },
  { otel_id: 3, otel_adi: "Grand Barhan Hotel", otel_lokasyon: "Antalya - Alanya", otel_sitesi: "https://www.grandbarhanhotel.net", otel_no: "0242 524 59 34", otel_whatsapp: "https://wa.me/902425245934", otel_info: "Denize Sıfır" },
  { otel_id: 4, otel_adi: "Mesut Hotel", otel_lokasyon: "Antalya - Alanya", otel_sitesi: "https://www.mesuthotalanya.com", otel_no: "0242 524 55 94", otel_whatsapp: "https://wa.me/902525245594", otel_info: "Denize Sıfır" },
  { otel_id: 5, otel_adi: "Dream of Ölüdeniz Hotel", otel_lokasyon: "Fethiye - Ölüdeniz", otel_sitesi: "https://www.dreamofoludenizhotel.com", otel_no: "0252 424 02 80", otel_whatsapp: "https://wa.me/902524240334", otel_info: "Denize 700 metre" }
];

const PRICES_DATA = [
  { otel_id: 1, oda_tipi: "Standard Oda", konsept: "Alkolsüz Herşey Dahil", fiyat: 3000 },
  { otel_id: 2, oda_tipi: "Standard Oda", konsept: "Alkollü Herşey Dahil", fiyat: 3100 },
  { otel_id: 3, oda_tipi: "Kara Manzaralı Standard Oda", konsept: "Alkolsüz Herşey Dahil", fiyat: 2750 },
  { otel_id: 3, oda_tipi: "Deniz Manzaralı Standard Oda", konsept: "Alkolsüz Herşey Dahil", fiyat: 3000 },
  { otel_id: 4, oda_tipi: "Standard Oda", konsept: "Alkollü Herşey Dahil", fiyat: 3350 },
  { otel_id: 5, oda_tipi: "Standard Oda", konsept: "Alkollü Herşey Dahil", fiyat: 4160 }
];

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Calculate Price API Started ===');
    
    const body = await request.json();
    const { checkin, checkout, adults, children, childAges } = body;
    
    console.log('Request data:', { checkin, checkout, adults, children, childAges });
    
    const nights = calculateNights(checkin, checkout);
    console.log('Calculated nights:', nights);
    
    const flatResponse: Record<string, unknown> = {
      searchParams: {
        checkIn: checkin,
        checkOut: checkout,
        totalNights: nights,
        totalAdults: adults,
        totalChildren: children || (childAges ? childAges.length : 0),
        childrenAges: (childAges || []).join(', ')
      }
    };

    let hotelCounter = 1;

    // Process each hotel
    for (const hotel of HOTELS_DATA) {
      console.log('Processing hotel:', hotel.otel_adi);
      
      // Get prices for this hotel
      const hotelPrices = PRICES_DATA.filter(p => p.otel_id === hotel.otel_id);
      
      if (hotelPrices.length === 0) {
        console.log('No prices for hotel:', hotel.otel_adi);
        continue;
      }

      if (hotelPrices.length === 1) {
        // Single room type
        const price = hotelPrices[0];
        const multiplier = 2.0;
        const totalPrice = Math.round(price.fiyat * multiplier * nights);
        
        flatResponse[`hotelName_${hotelCounter}`] = hotel.otel_adi;
        flatResponse[`city_${hotelCounter}`] = hotel.otel_lokasyon;
        flatResponse[`website_${hotelCounter}`] = hotel.otel_sitesi;
        flatResponse[`tel_${hotelCounter}`] = hotel.otel_no;
        flatResponse[`whatsapp_${hotelCounter}`] = hotel.otel_whatsapp;
        flatResponse[`info_${hotelCounter}`] = hotel.otel_info;
        flatResponse[`roomType_${hotelCounter}`] = price.oda_tipi;
        flatResponse[`totalRooms_${hotelCounter}`] = 1;
        flatResponse[`concept_${hotelCounter}`] = price.konsept;
        flatResponse[`totalPrice_${hotelCounter}`] = totalPrice;
        
        console.log('Single room added:', hotel.otel_adi, totalPrice);
        
      } else {
        // Multiple room types
        const letters = ['a', 'b', 'c', 'd'];
        
        flatResponse[`hotelName_${hotelCounter}`] = hotel.otel_adi;
        flatResponse[`city_${hotelCounter}`] = hotel.otel_lokasyon;
        flatResponse[`website_${hotelCounter}`] = hotel.otel_sitesi;
        flatResponse[`tel_${hotelCounter}`] = hotel.otel_no;
        flatResponse[`whatsapp_${hotelCounter}`] = hotel.otel_whatsapp;
        flatResponse[`info_${hotelCounter}`] = hotel.otel_info;
        
        hotelPrices.forEach((price, index) => {
          const suffix = letters[index] || index.toString();
          const multiplier = 2.0;
          const totalPrice = Math.round(price.fiyat * multiplier * nights);
          
          flatResponse[`roomType_${hotelCounter}_${suffix}`] = price.oda_tipi;
          flatResponse[`totalRooms_${hotelCounter}_${suffix}`] = 1;
          flatResponse[`concept_${hotelCounter}_${suffix}`] = price.konsept;
          flatResponse[`totalPrice_${hotelCounter}_${suffix}`] = totalPrice;
        });
        
        console.log('Multiple rooms added:', hotel.otel_adi, hotelPrices.length, 'options');
      }
      
      hotelCounter++;
    }

    console.log('=== Response Ready ===');
    return NextResponse.json(flatResponse);

  } catch (error) {
    console.error('=== API ERROR ===', error);
    return NextResponse.json(
      { error: 'API Error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Hotel Price Calculator API',
    endpoint: '/api/calculate-price',
    method: 'POST',
    example: {
      checkin: '2025-08-15',
      checkout: '2025-08-20',
      adults: 2,
      children: 1,
      childAges: [6]
    }
  });
}