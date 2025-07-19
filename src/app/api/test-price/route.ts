// Simple Test API - src/app/api/test-price/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Test API started');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { checkin, checkout, adults, children, childAges } = body;
    
    // Simple mock response with all 5 hotels
    const mockResponse = {
      searchParams: {
        checkIn: checkin,
        checkOut: checkout,
        totalNights: 5,
        totalAdults: adults,
        totalChildren: children || childAges?.length || 0,
        childrenAges: (childAges || []).join(', ')
      },
      hotelName_1: "De Mare Family Hotel",
      city_1: "Antalya - Alanya",
      website_1: "https://www.demarefamilyhotel.net",
      tel_1: "0242 524 55 96",
      whatsapp_1: "https://wa.me/902425245674",
      info_1: "Denize Sıfır",
      roomType_1: "Standard Oda",
      totalRooms_1: 1,
      concept_1: "Alkolsüz Herşey Dahil",
      totalPrice_1: 15000,

      hotelName_2: "Club SVS Hotel",
      city_2: "Antalya - Alanya", 
      website_2: "https://www.clubsvshotel.com",
      tel_2: "0242 524 56 80",
      whatsapp_2: "https://wa.me/902425245680",
      info_2: "Denize Sıfır",
      roomType_2: "Standard Oda",
      totalRooms_2: 1,
      concept_2: "Alkollü Herşey Dahil",
      totalPrice_2: 16500,

      hotelName_3: "Grand Barhan Hotel",
      city_3: "Antalya - Alanya",
      website_3: "https://www.grandbarhanhotel.net", 
      tel_3: "0242 524 59 34",
      whatsapp_3: "https://wa.me/902425245934",
      info_3: "Denize Sıfır",
      roomType_3_a: "Kara Manzaralı Standard Oda",
      totalRooms_3_a: 1,
      concept_3_a: "Alkolsüz Herşey Dahil",
      totalPrice_3_a: 17000,
      roomType_3_b: "Deniz Manzaralı Standard Oda", 
      totalRooms_3_b: 1,
      concept_3_b: "Alkolsüz Herşey Dahil",
      totalPrice_3_b: 18500,

      hotelName_4: "Mesut Hotel",
      city_4: "Antalya - Alanya",
      website_4: "https://www.mesuthotalanya.com",
      tel_4: "0242 524 55 94", 
      whatsapp_4: "https://wa.me/902425245594",
      info_4: "Denize Sıfır",
      roomType_4: "Standard Oda",
      totalRooms_4: 1,
      concept_4: "Alkollü Herşey Dahil",
      totalPrice_4: 16800,

      hotelName_5: "Dream of Ölüdeniz Hotel",
      city_5: "Fethiye - Ölüdeniz",
      website_5: "https://www.dreamofoludenizhotel.com",
      tel_5: "0252 424 02 80",
      whatsapp_5: "https://wa.me/902524240334", 
      info_5: "Denize 700 metre",
      roomType_5: "Standard Oda",
      totalRooms_5: 1,
      concept_5: "Alkollü Herşey Dahil", 
      totalPrice_5: 20000
    };
    
    console.log('Returning mock response');
    return NextResponse.json(mockResponse);
    
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: 'Test API hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata') },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test API çalışıyor',
    timestamp: new Date().toISOString()
  });
}