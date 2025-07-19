// Simple Test API - src/app/api/test-price/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Test API started');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { checkin, checkout, adults, children, childAges } = body;
    
    // Simple mock response
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
      totalPrice_1: 15000
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