// Calculate Price API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getHotels, getRoomMultipliers, getHotelPrices } from '@/lib/utils';

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
    
    // Calculate nights
    const nights = calculateNights(checkin, checkout);
    console.log('Calculated nights:', nights);
    
    // Load data with timeout protection
    console.log('Loading data...');
    const hotels = getHotels();
    const roomMultipliers = getRoomMultipliers();
    const hotelPrices = getHotelPrices();
    
    console.log('Data loaded:', {
      hotels: hotels.length,
      multipliers: roomMultipliers.length,
      prices: hotelPrices.length
    });

    if (hotels.length === 0 || hotelPrices.length === 0) {
      throw new Error('No data available');
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

    // Process each hotel with simplified logic
    for (const hotel of hotels) {
      try {
        console.log('Processing hotel:', hotel.otel_adi);
        
        // Get prices for this hotel
        const hotelPricesData = hotelPrices.filter(p => p.otel_id === hotel.otel_id);
        
        if (hotelPricesData.length === 0) {
          console.log('No prices for hotel:', hotel.otel_adi);
          continue;
        }

        // Find a suitable price for the date range
        let suitablePrice = hotelPricesData.find(price => {
          try {
            const priceStart = new Date(price.tarih_baslangic);
            const priceEnd = new Date(price.tarih_bitis);
            const checkInDate = new Date(checkin);
            const checkOutDate = new Date(checkout);
            
            return checkInDate >= priceStart && checkOutDate <= priceEnd;
          } catch (dateError) {
            console.log('Date parsing error for price:', dateError);
            return false;
          }
        });

        // If no exact match, use first available price
        if (!suitablePrice) {
          suitablePrice = hotelPricesData[0];
          console.log('Using first available price for:', hotel.otel_adi);
        }

        // Simple price calculation
        const basePrice = suitablePrice.fiyat;
        const multiplier = 2.0; // Simple multiplier for 2 adults
        const totalPrice = Math.round(basePrice * multiplier * nights);

        console.log('Price calculated for', hotel.otel_adi, ':', totalPrice);

        // Check if hotel has multiple room types
        const uniqueRoomTypes = [...new Set(hotelPricesData.map(p => p.oda_tipi))];
        
        if (uniqueRoomTypes.length === 1) {
          // Single room type
          flatResponse[`hotelName_${hotelCounter}`] = hotel.otel_adi;
          flatResponse[`city_${hotelCounter}`] = hotel.otel_lokasyon;
          flatResponse[`website_${hotelCounter}`] = hotel.otel_sitesi;
          flatResponse[`tel_${hotelCounter}`] = hotel.otel_no;
          flatResponse[`whatsapp_${hotelCounter}`] = hotel.otel_whatsapp;
          flatResponse[`info_${hotelCounter}`] = hotel.otel_info;
          flatResponse[`roomType_${hotelCounter}`] = suitablePrice.oda_tipi;
          flatResponse[`totalRooms_${hotelCounter}`] = 1;
          flatResponse[`concept_${hotelCounter}`] = suitablePrice.konsept;
          flatResponse[`totalPrice_${hotelCounter}`] = totalPrice;
          
        } else {
          // Multiple room types - add hotel info once
          flatResponse[`hotelName_${hotelCounter}`] = hotel.otel_adi;
          flatResponse[`city_${hotelCounter}`] = hotel.otel_lokasyon;
          flatResponse[`website_${hotelCounter}`] = hotel.otel_sitesi;
          flatResponse[`tel_${hotelCounter}`] = hotel.otel_no;
          flatResponse[`whatsapp_${hotelCounter}`] = hotel.otel_whatsapp;
          flatResponse[`info_${hotelCounter}`] = hotel.otel_info;
          
          // Add each room type option
          const letters = ['a', 'b', 'c', 'd'];
          uniqueRoomTypes.forEach((roomType, index) => {
            const roomPrice = hotelPricesData.find(p => p.oda_tipi === roomType);
            if (roomPrice) {
              const suffix = letters[index] || index.toString();
              const roomTotalPrice = Math.round(roomPrice.fiyat * multiplier * nights);
              
              flatResponse[`roomType_${hotelCounter}_${suffix}`] = roomPrice.oda_tipi;
              flatResponse[`totalRooms_${hotelCounter}_${suffix}`] = 1;
              flatResponse[`concept_${hotelCounter}_${suffix}`] = roomPrice.konsept;
              flatResponse[`totalPrice_${hotelCounter}_${suffix}`] = roomTotalPrice;
            }
          });
        }
        
        hotelCounter++;

      } catch (hotelError) {
        console.error(`Error processing hotel ${hotel.otel_adi}:`, hotelError);
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