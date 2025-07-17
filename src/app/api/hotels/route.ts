// Calculate Price API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { SearchRequest, SearchResponse, HotelResult } from '@/types/hotel';
import { getHotels, getRoomMultipliers, getHotelPrices, validateSearchParams, getDaysBetween } from '@/lib/utils';
import { findOptimalRoomDistribution } from '@/lib/algorithms/roomDistribution';
import { calculateHotelPrices, getBestPriceForHotel } from '@/lib/algorithms/priceCalculation';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: SearchRequest = await request.json();
    const { checkIn, checkOut, adults, children } = body;

    // Validate input parameters
    const validation = validateSearchParams(checkIn, checkOut, adults, children);
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
    const hotelResults: HotelResult[] = [];

    for (const hotel of hotels) {
      try {
        // Get room multipliers for this hotel
        const hotelRoomMultipliers = roomMultipliers.filter(rm => rm.otel_id === hotel.otel_id);
        
        if (hotelRoomMultipliers.length === 0) {
          continue; // Skip hotel if no room configurations available
        }

        // Find optimal room distribution
        const roomDistribution = findOptimalRoomDistribution(adults, children, hotelRoomMultipliers);
        
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
        }, {} as Record<string, any>);

        // Convert to array and add to hotel results
        Object.values(resultsByCombo).forEach((bestPrice: any) => {
          if (!bestPrice) return;

          // Count total adults and children after age processing
          let totalAdults = adults;
          let totalChildren = children.length;
          let childrenAgesText = '';

          // Process children ages to separate adults from children based on hotel's age limits
          const hotelAgeRanges = hotelRoomMultipliers.map(rm => [
            rm.birinci_cocuk_yas_araligi,
            rm.ikinci_cocuk_yas_araligi,
            rm.ucuncu_cocuk_yas_araligi
          ]).flat().filter(age => age > 0);

          const maxChildAge = Math.max(...hotelAgeRanges);
          const validChildren: number[] = [];
          
          children.forEach(age => {
            if (age <= maxChildAge) {
              validChildren.push(age);
            } else {
              totalAdults++; // Child becomes adult based on hotel's age limit
              totalChildren--;
            }
          });

          childrenAgesText = validChildren.join(', ');

          // Create hotel result for this combination
          const hotelResult: HotelResult = {
            hotelName: hotel.otel_adi,
            city: hotel.otel_lokasyon,
            roomType: bestPrice.roomType,
            totalRooms: bestPrice.roomArrangement.length,
            concept: bestPrice.concept,
            totalPrice: bestPrice.totalPrice,
            pricePerNight: bestPrice.pricePerNight,
            nights: bestPrice.nights,
            roomArrangement: bestPrice.roomArrangement
          };

          hotelResults.push(hotelResult);
        });

      } catch (hotelError) {
        console.error(`Error processing hotel ${hotel.otel_adi}:`, hotelError);
        // Continue with other hotels
      }
    }

    // Prepare response
    const response: SearchResponse = {
      searchParams: {
        checkIn,
        checkOut,
        totalAdults: adults,
        totalChildren: children.length,
        childrenAges: children.join(', ')
      },
      hotels: hotelResults
    };

    return NextResponse.json(response);

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
        checkIn: '2025-08-01',
        checkOut: '2025-08-05',
        adults: 2,
        children: [8, 12]
      }
    },
    { status: 200 }
  );
}