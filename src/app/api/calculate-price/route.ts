// Calculate Price API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { SearchRequest, SearchResponse, HotelResult } from '@/types/hotel';
import { getHotels, getRoomMultipliers, getHotelPrices, validateSearchParams, getDaysBetween } from '@/lib/utils';
import { findOptimalRoomDistribution } from '@/lib/algorithms/roomDistribution';
import { calculateHotelPrices, getBestPriceForHotel } from '@/lib/algorithms/priceCalculation';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { checkin, checkout, adults, children, childAges } = body;

    // Map new format to existing variables
    const checkIn = checkin;
    const checkOut = checkout;
    const childrenAges = childAges || [];

    // Validate input parameters
    const validation = validateSearchParams(checkIn, checkOut, adults, childrenAges);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Geçersiz parametreler', details: validation.errors },
        { status: 400 }
      );
    }

    // Calculate nights
    const nights = getDaysBetween(checkIn, checkOut);

    // Load data
    const hotels = getHotels();
    const roomMultipliers = getRoomMultipliers();
    const hotelPrices = getHotelPrices();

    // Process each hotel
    const flatResponse: Record<string, unknown> = {
      searchParams: {
        checkIn,
        checkOut,
        totalNights: nights,
        totalAdults: adults, // Original request adults
        totalChildren: children || childrenAges.length, // Use children param or childAges length
        childrenAges: childrenAges.join(', ') // Original children ages
      }
    };

    let hotelCounter = 1;

    for (const hotel of hotels) {
      try {
        // Get room multipliers for this hotel
        const hotelRoomMultipliers = roomMultipliers.filter(rm => rm.otel_id === hotel.otel_id);
        
        if (hotelRoomMultipliers.length === 0) {
          continue; // Skip hotel if no room configurations available
        }

        // Find optimal room distribution
        const roomDistribution = findOptimalRoomDistribution(adults, childrenAges, hotelRoomMultipliers);
        
        if (!roomDistribution.isValid || roomDistribution.arrangements.length === 0) {
          continue; // Skip hotel if no valid room arrangements found
        }

        // Get hotel prices for this hotel
        const hotelPricesData = hotelPrices.filter(hp => hp.otel_id === hotel.otel_id);
        
        if (hotelPricesData.length === 0) {
          continue; // Skip hotel if no prices available
        }

        // Calculate prices for all arrangements and concepts
        const priceResults = calculateHotelPrices(
          hotel.otel_id,
          checkIn,
          checkOut,
          roomDistribution.arrangements,
          hotelPricesData
        );

        // Group results by room type + concept combination
        const resultsByCombo = priceResults.reduce((acc, result) => {
          const key = `${result.roomType || 'Unknown'}_${result.concept}`;
          if (!acc[key] || result.totalPrice < acc[key].totalPrice) {
            acc[key] = result;
          }
          return acc;
        }, {} as Record<string, typeof priceResults[0]>);

        // Convert to flat structure
        const comboResults = Object.values(resultsByCombo).filter(Boolean);
        
        if (comboResults.length === 0) {
          continue; // Skip hotel if no results
        }

        // If only one combination, use simple numbering
        if (comboResults.length === 1) {
          const result = comboResults[0];
          
          flatResponse[`hotelName_${hotelCounter}`] = hotel.otel_adi;
          flatResponse[`city_${hotelCounter}`] = hotel.otel_lokasyon;
          flatResponse[`website_${hotelCounter}`] = hotel.otel_sitesi;
          flatResponse[`tel_${hotelCounter}`] = hotel.otel_no;
          flatResponse[`whatsapp_${hotelCounter}`] = hotel.otel_whatsapp;
          flatResponse[`info_${hotelCounter}`] = hotel.otel_info;
          flatResponse[`photos_${hotelCounter}`] = (hotel as any).photos || [];
          flatResponse[`roomType_${hotelCounter}`] = result.roomType;
          flatResponse[`totalRooms_${hotelCounter}`] = result.roomArrangement.length;
          flatResponse[`concept_${hotelCounter}`] = result.concept;
          flatResponse[`totalPrice_${hotelCounter}`] = result.totalPrice;
          
          hotelCounter++;
        } else {
          // Multiple combinations, use optimized structure
          const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
          
          // Add hotel name, city and contact info once
          flatResponse[`hotelName_${hotelCounter}`] = hotel.otel_adi;
          flatResponse[`city_${hotelCounter}`] = hotel.otel_lokasyon;
          flatResponse[`website_${hotelCounter}`] = hotel.otel_sitesi;
          flatResponse[`tel_${hotelCounter}`] = hotel.otel_no;
          flatResponse[`whatsapp_${hotelCounter}`] = hotel.otel_whatsapp;
          flatResponse[`info_${hotelCounter}`] = hotel.otel_info;
          flatResponse[`photos_${hotelCounter}`] = (hotel as any).photos || [];
          
          // Add each combination with letter suffix
          comboResults.forEach((result, index: number) => {
            const suffix = letters[index] || index.toString();
            
            flatResponse[`roomType_${hotelCounter}_${suffix}`] = result.roomType;
            flatResponse[`totalRooms_${hotelCounter}_${suffix}`] = result.roomArrangement.length;
            flatResponse[`concept_${hotelCounter}_${suffix}`] = result.concept;
            flatResponse[`totalPrice_${hotelCounter}_${suffix}`] = result.totalPrice;
          });
          
          hotelCounter++;
        }

      } catch (hotelError) {
        console.error(`Error processing hotel ${hotel.otel_adi}:`, hotelError);
        // Continue with other hotels
      }
    }

    return NextResponse.json(flatResponse);

  } catch (error) {
    console.error('Calculate price API error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası', details: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
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
    },
    { status: 200 }
  );
}