// Hotels API Endpoint

import { NextResponse } from 'next/server';
import { getHotels, getRoomMultipliers, getHotelPrices } from '@/lib/utils';

export async function GET() {
  try {
    // Load all data
    const hotels = getHotels();
    const roomMultipliers = getRoomMultipliers();
    const hotelPrices = getHotelPrices();

    // Prepare response with hotel details and available room types
    const hotelDetails = hotels.map(hotel => {
      // Get room types for this hotel
      const hotelRoomMultipliers = roomMultipliers.filter(rm => rm.otel_id === hotel.otel_id);
      const roomTypes = [...new Set(hotelRoomMultipliers.map(rm => rm.oda_tipi))];

      // Get available concepts for this hotel
      const hotelPricesData = hotelPrices.filter(hp => hp.otel_id === hotel.otel_id);
      const concepts = [...new Set(hotelPricesData.map(hp => hp.konsept))];

      // Get price range
      const prices = hotelPricesData.map(hp => hp.fiyat);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      return {
        otel_id: hotel.otel_id,
        otel_adi: hotel.otel_adi,
        otel_lokasyon: hotel.otel_lokasyon,
        otel_sitesi: hotel.otel_sitesi,
        otel_no: hotel.otel_no,
        otel_whatsapp: hotel.otel_whatsapp,
        otel_info: hotel.otel_info,
        roomTypes,
        concepts,
        priceRange: {
          min: minPrice,
          max: maxPrice,
          currency: 'TL'
        },
        totalRoomConfigurations: hotelRoomMultipliers.length
      };
    });

    return NextResponse.json({
      success: true,
      totalHotels: hotels.length,
      hotels: hotelDetails
    });

  } catch (error) {
    console.error('Hotels API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Sunucu hatası', 
        details: error instanceof Error ? error.message : 'Bilinmeyen hata' 
      },
      { status: 500 }
    );
  }
}

// POST endpoint for specific hotel details
export async function POST(request: Request) {
  try {
    const { hotelId } = await request.json();

    if (!hotelId) {
      return NextResponse.json(
        { error: 'Hotel ID gerekli' },
        { status: 400 }
      );
    }

    // Load data
    const hotels = getHotels();
    const roomMultipliers = getRoomMultipliers();
    const hotelPrices = getHotelPrices();

    // Find specific hotel
    const hotel = hotels.find(h => h.otel_id === hotelId);
    
    if (!hotel) {
      return NextResponse.json(
        { error: 'Otel bulunamadı' },
        { status: 404 }
      );
    }

    // Get detailed room configurations
    const hotelRoomMultipliers = roomMultipliers.filter(rm => rm.otel_id === hotelId);
    
    // Get detailed price information
    const hotelPricesData = hotelPrices.filter(hp => hp.otel_id === hotelId);

    // Group room configurations by room type
    const roomTypeDetails = hotelRoomMultipliers.reduce((acc, rm) => {
      if (!acc[rm.oda_tipi]) {
        acc[rm.oda_tipi] = [];
      }
      acc[rm.oda_tipi].push({
        yetiskin_sayisi: rm.yetiskin_sayisi,
        cocuk_sayisi: rm.cocuk_sayisi,
        birinci_cocuk_yas_araligi: rm.birinci_cocuk_yas_araligi,
        ikinci_cocuk_yas_araligi: rm.ikinci_cocuk_yas_araligi,
        ucuncu_cocuk_yas_araligi: rm.ucuncu_cocuk_yas_araligi,
        carpan: rm.carpan
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Group prices by concept and room type
    const priceDetails = hotelPricesData.reduce((acc, price) => {
      const key = `${price.konsept}_${price.oda_tipi}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        tarih_baslangic: price.tarih_baslangic,
        tarih_bitis: price.tarih_bitis,
        fiyat: price.fiyat,
        para_birimi: price.para_birimi
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      success: true,
      hotel: {
        ...hotel,
        roomTypeDetails,
        priceDetails
      }
    });

  } catch (error) {
    console.error('Hotel details API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Sunucu hatası', 
        details: error instanceof Error ? error.message : 'Bilinmeyen hata' 
      },
      { status: 500 }
    );
  }
}