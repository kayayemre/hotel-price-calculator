// Admin API for Price Management

import { NextRequest, NextResponse } from 'next/server';
import { getHotelPrices } from '@/lib/utils';

// GET - Mevcut fiyatları getir
export async function GET() {
  try {
    const prices = getHotelPrices();
    return NextResponse.json(prices);
  } catch (error) {
    console.error('Admin prices GET error:', error);
    return NextResponse.json(
      { error: 'Fiyatlar getirilemedi' },
      { status: 500 }
    );
  }
}

// POST - Fiyatları güncelle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prices } = body;

    if (!prices || !Array.isArray(prices)) {
      return NextResponse.json(
        { error: 'Geçersiz fiyat verisi' },
        { status: 400 }
      );
    }

    // Validate price data
    for (const price of prices) {
      if (!price.otel_id || !price.oda_tipi || !price.konsept || !price.fiyat) {
        return NextResponse.json(
          { error: 'Eksik fiyat bilgisi' },
          { status: 400 }
        );
      }

      if (price.fiyat < 0) {
        return NextResponse.json(
          { error: 'Fiyat negatif olamaz' },
          { status: 400 }
        );
      }
    }

    // Bu gerçek projede dosyaya yazmak yerine
    // veritabanına kaydetmelisiniz
    
    // Şimdilik sadece başarılı response döndürüyoruz
    // Gerçek implementasyonda:
    // await fs.writeFile('src/lib/data/fiyatlar.json', JSON.stringify(prices, null, 2));
    
    console.log('Fiyatlar güncellendi:', prices.length, 'kayıt');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Fiyatlar başarıyla güncellendi',
      count: prices.length 
    });

  } catch (error) {
    console.error('Admin prices POST error:', error);
    return NextResponse.json(
      { error: 'Fiyatlar güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - Tek fiyat güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { otel_id, oda_tipi, konsept, tarih_baslangic, fiyat } = body;

    if (!otel_id || !oda_tipi || !konsept || !tarih_baslangic || fiyat === undefined) {
      return NextResponse.json(
        { error: 'Eksik bilgi' },
        { status: 400 }
      );
    }

    if (fiyat < 0) {
      return NextResponse.json(
        { error: 'Fiyat negatif olamaz' },
        { status: 400 }
      );
    }

    // Gerçek implementasyonda belirli bir fiyatı güncelle
    console.log('Tek fiyat güncellendi:', { otel_id, oda_tipi, konsept, fiyat });

    return NextResponse.json({ 
      success: true, 
      message: 'Fiyat başarıyla güncellendi' 
    });

  } catch (error) {
    console.error('Admin price PUT error:', error);
    return NextResponse.json(
      { error: 'Fiyat güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}