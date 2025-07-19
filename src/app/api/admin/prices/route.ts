// Admin API for Price Management with GitHub Integration

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

// POST - Fiyatları güncelle ve GitHub'a commit et
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

    // GitHub API ile dosyayı güncelle
    const updateResult = await updatePricesOnGitHub(prices);
    
    if (!updateResult.success) {
      return NextResponse.json(
        { error: 'GitHub güncellemesi başarısız: ' + updateResult.error },
        { status: 500 }
      );
    }

    console.log('Fiyatlar GitHub\'a kaydedildi:', prices.length, 'kayıt');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Fiyatlar başarıyla güncellendi ve GitHub\'a kaydedildi',
      count: prices.length,
      commitSha: updateResult.commitSha
    });

  } catch (error) {
    console.error('Admin prices POST error:', error);
    return NextResponse.json(
      { error: 'Fiyatlar güncellenirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata') },
      { status: 500 }
    );
  }
}

// GitHub API ile fiyatlar dosyasını güncelle
async function updatePricesOnGitHub(prices: any[]) {
  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
      return {
        success: false,
        error: 'GitHub environment variables eksik (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)'
      };
    }

    const filePath = 'src/lib/data/fiyatlar.json';
    
    // 1. Mevcut dosyanın SHA'sını al
    const getFileResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!getFileResponse.ok) {
      return {
        success: false,
        error: `Dosya getirilemedi: ${getFileResponse.status} ${getFileResponse.statusText}`
      };
    }

    const fileData = await getFileResponse.json();
    const currentSha = fileData.sha;

    // 2. Yeni içeriği hazırla
    const newContent = JSON.stringify(prices, null, 2);
    const encodedContent = Buffer.from(newContent).toString('base64');

    // 3. Dosyayı güncelle
    const updateResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update hotel prices - ${new Date().toISOString()}`,
          content: encodedContent,
          sha: currentSha,
          committer: {
            name: 'Hotel Admin System',
            email: 'admin@hotel-price-calculator.com'
          }
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.text();
      return {
        success: false,
        error: `GitHub güncelleme hatası: ${updateResponse.status} ${updateResponse.statusText} - ${errorData}`
      };
    }

    const updateData = await updateResponse.json();
    
    return {
      success: true,
      commitSha: updateData.commit.sha
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen GitHub API hatası'
    };
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

    // Tüm fiyatları al, tek fiyatı güncelle ve GitHub'a gönder
    const allPrices = getHotelPrices();
    const priceIndex = allPrices.findIndex(p => 
      p.otel_id === otel_id && 
      p.oda_tipi === oda_tipi && 
      p.konsept === konsept && 
      p.tarih_baslangic === tarih_baslangic
    );

    if (priceIndex === -1) {
      return NextResponse.json(
        { error: 'Fiyat kaydı bulunamadı' },
        { status: 404 }
      );
    }

    allPrices[priceIndex].fiyat = fiyat;
    
    const updateResult = await updatePricesOnGitHub(allPrices);
    
    if (!updateResult.success) {
      return NextResponse.json(
        { error: 'GitHub güncellemesi başarısız: ' + updateResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Fiyat başarıyla güncellendi ve GitHub\'a kaydedildi',
      commitSha: updateResult.commitSha
    });

  } catch (error) {
    console.error('Admin price PUT error:', error);
    return NextResponse.json(
      { error: 'Fiyat güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}