// Calculate Price API Endpoint - PROPER VERSION

import { NextRequest, NextResponse } from 'next/server';
import { getHotels, getRoomMultipliers, getHotelPrices } from '@/lib/utils';

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function findSuitableRoomConfiguration(adults: number, children: number[], hotelMultipliers: any[]) {
  // Find a room configuration that can accommodate the guests
  for (const multiplier of hotelMultipliers) {
    // Check if this room can handle the adults
    if (multiplier.yetiskin_sayisi >= adults) {
      // For now, simple check for children (can be enhanced)
      if (multiplier.cocuk_sayisi >= children.length) {
        return {
          isValid: true,
          roomType: multiplier.oda_tipi,
          multiplier: multiplier.carpan,
          adults: adults,
          children: children.length
        };
      }
    }
  }
  
  // If no single room works, try multiple rooms (simplified)
  if (adults <= 4) {
    const standardRoom = hotelMultipliers.find(m => 
      m.oda_tipi.includes('Standard') && m.yetiskin_sayisi >= 2
    );
    
    if (standardRoom) {
      const roomsNeeded = Math.ceil(adults / 2);
      return {
        isValid: true,
        roomType: standardRoom.oda_tipi,
        multiplier: standardRoom.carpan * roomsNeeded,
        adults: adults,
        children: children.length,
        roomsNeeded: roomsNeeded
      };
    }
  }
  
  return { isValid: false };
}

function findBestPrice(hotelPrices: any[], checkIn: string, checkOut: string, roomType?: string) {
  // Filter prices by room type if specified
  let availablePrices = roomType 
    ? hotelPrices.filter(p => p.oda_tipi === roomType)
    : hotelPrices;
    
  if (availablePrices.length === 0) {
    availablePrices = hotelPrices; // Fallback to any price
  }
  
  // Try to find price that covers our date range
  const suitablePrice = availablePrices.find(price => {
    try {
      const priceStart = new Date(price.tarih_baslangic);
      const priceEnd = new Date(price.tarih_bitis);
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      return checkInDate >= priceStart && checkOutDate <= priceEnd;
    } catch {
      return false;
    }
  });
  
  // Return suitable price or cheapest available
  return suitablePrice || availablePrices.reduce((min, price) => 
    price.fiyat < min.fiyat ? price : min
  );
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Calculate Price API Started ===');
    
    const body = await request.json();
    const { checkin, checkout, adults, children, childAges } = body;
    
    console.log('Request:', { checkin, checkout, adults, children, childAges });
    
    // Calculate nights
    const nights = calculateNights(checkin, checkout);
    
    // Load data
    const hotels = getHotels();
    const roomMultipliers = getRoomMultipliers();
    const hotelPrices = getHotelPrices();
    
    console.log('Data loaded:', { hotels: hotels.length, multipliers: roomMultipliers.length, prices: hotelPrices.length });

    if (hotels.length === 0) {
      throw new Error('No hotels data');
    }

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
    for (const hotel of hotels) {
      try {
        console.log('Processing hotel:', hotel.otel_adi);
        
        // Get room multipliers for this hotel
        const hotelRoomMultipliers = roomMultipliers.filter(rm => rm.otel_id === hotel.otel_id);
        if (hotelRoomMultipliers.length === 0) {
          console.log('No multipliers for hotel:', hotel.otel_adi);
          continue;
        }
        
        // Get prices for this hotel
        const hotelPricesData = hotelPrices.filter(p => p.otel_id === hotel.otel_id);
        if (hotelPricesData.length === 0) {
          console.log('No prices for hotel:', hotel.otel_adi);
          continue;
        }

        // Find suitable room configuration
        const roomConfig = findSuitableRoomConfiguration(adults, childAges || [], hotelRoomMultipliers);
        if (!roomConfig.isValid) {
          console.log('No suitable room config for hotel:', hotel.otel_adi);
          continue;
        }

        console.log('Room config found:', roomConfig);

        // Get unique room types for this hotel
        const uniqueRoomTypes = [...new Set(hotelPricesData.map(p => p.oda_tipi))];
        
        if (uniqueRoomTypes.length === 1) {
          // Single room type
          const bestPrice = findBestPrice(hotelPricesData, checkin, checkout, roomConfig.roomType);
          const totalPrice = Math.round(bestPrice.fiyat * roomConfig.multiplier * nights);
          
          flatResponse[`hotelName_${hotelCounter}`] = hotel.otel_adi;
          flatResponse[`city_${hotelCounter}`] = hotel.otel_lokasyon;
          flatResponse[`website_${hotelCounter}`] = hotel.otel_sitesi;
          flatResponse[`tel_${hotelCounter}`] = hotel.otel_no;
          flatResponse[`whatsapp_${hotelCounter}`] = hotel.otel_whatsapp;
          flatResponse[`info_${hotelCounter}`] = hotel.otel_info;
          flatResponse[`roomType_${hotelCounter}`] = bestPrice.oda_tipi;
          flatResponse[`totalRooms_${hotelCounter}`] = roomConfig.roomsNeeded || 1;
          flatResponse[`concept_${hotelCounter}`] = bestPrice.konsept;
          flatResponse[`totalPrice_${hotelCounter}`] = totalPrice;
          
          console.log('Single room result:', hotel.otel_adi, totalPrice);
          
        } else {
          // Multiple room types
          flatResponse[`hotelName_${hotelCounter}`] = hotel.otel_adi;
          flatResponse[`city_${hotelCounter}`] = hotel.otel_lokasyon;
          flatResponse[`website_${hotelCounter}`] = hotel.otel_sitesi;
          flatResponse[`tel_${hotelCounter}`] = hotel.otel_no;
          flatResponse[`whatsapp_${hotelCounter}`] = hotel.otel_whatsapp;
          flatResponse[`info_${hotelCounter}`] = hotel.otel_info;
          
          const letters = ['a', 'b', 'c', 'd'];
          let optionIndex = 0;
          
          for (const roomType of uniqueRoomTypes) {
            // Find multiplier for this room type
            const roomMultiplier = hotelRoomMultipliers.find(rm => rm.oda_tipi === roomType);
            if (!roomMultiplier) continue;
            
            // Check if this room type can accommodate our guests
            if (roomMultiplier.yetiskin_sayisi >= adults && roomMultiplier.cocuk_sayisi >= (childAges?.length || 0)) {
              const bestPrice = findBestPrice(hotelPricesData, checkin, checkout, roomType);
              const totalPrice = Math.round(bestPrice.fiyat * roomMultiplier.carpan * nights);
              
              const suffix = letters[optionIndex] || optionIndex.toString();
              
              flatResponse[`roomType_${hotelCounter}_${suffix}`] = bestPrice.oda_tipi;
              flatResponse[`totalRooms_${hotelCounter}_${suffix}`] = 1;
              flatResponse[`concept_${hotelCounter}_${suffix}`] = bestPrice.konsept;
              flatResponse[`totalPrice_${hotelCounter}_${suffix}`] = totalPrice;
              
              optionIndex++;
            }
          }
          
          console.log('Multiple room results:', hotel.otel_adi, optionIndex, 'options');
        }
        
        hotelCounter++;

      } catch (hotelError) {
        console.error(`Hotel processing error for ${hotel.otel_adi}:`, hotelError);
        continue;
      }
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