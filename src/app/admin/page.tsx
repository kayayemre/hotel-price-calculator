// Admin Data API - Hotels Management

import { NextRequest, NextResponse } from 'next/server';
import { getHotels } from '@/lib/utils';

// GET - Otel verilerini getir
export async function GET() {
  try {
    const hotels = getHotels();
    return NextResponse.json({
      success: true,
      data: hotels,
      count: hotels.length
    });
  } catch (error) {
    console.error('Hotels GET error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Otel verileri getirilemedi',
        data: []
      },
      { status: 500 }
    );
  }
}

// POST - Otel verilerini güncelle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Geçersiz otel verisi' 
        },
        { status: 400 }
      );
    }

    // Validate hotel data
    for (const hotel of data) {
      if (!hotel.otel_id || !hotel.otel_adi || !hotel.otel_lokasyon) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Eksik otel bilgisi - ID, Ad ve Lokasyon zorunludur' 
          },
          { status: 400 }
        );
      }

      // Validate URL format for website and whatsapp
      if (hotel.otel_sitesi && !isValidUrl(hotel.otel_sitesi)) {
        return NextResponse.json(
          { 
            success: false,
            error: `Geçersiz website URL: ${hotel.otel_sitesi}` 
          },
          { status: 400 }
        );
      }

      if (hotel.otel_whatsapp && !isValidUrl(hotel.otel_whatsapp)) {
        return NextResponse.json(
          { 
            success: false,
            error: `Geçersiz WhatsApp URL: ${hotel.otel_whatsapp}` 
          },
          { status: 400 }
        );
      }
    }

    // GitHub API ile dosyayı güncelle
    const updateResult = await updateHotelsOnGitHub(data);
    
    if (!updateResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'GitHub güncellemesi başarısız: ' + updateResult.error 
        },
        { status: 500 }
      );
    }

    console.log('Oteller GitHub\'a kaydedildi:', data.length, 'kayıt');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Oteller başarıyla güncellendi ve GitHub\'a kaydedildi',
      count: data.length,
      commitSha: updateResult.commitSha
    });

  } catch (error) {
    console.error('Hotels POST error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Oteller güncellenirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata') 
      },
      { status: 500 }
    );
  }
}

// URL validation helper
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// GitHub API ile hotels.json dosyasını güncelle
async function updateHotelsOnGitHub(hotels: any[]) {
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

    const filePath = 'src/lib/data/hotels.json';
    
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

    // 2. Yeni içeriği hazırla (photos alanını koru)
    const hotelsWithPhotos = hotels.map(hotel => ({
      ...hotel,
      photos: hotel.photos || [
        `https://images.unsplash.com/photo-156607379${hotel.otel_id}4-1a8506099945?w=500&h=300&fit=crop`,
        `https://images.unsplash.com/photo-158271947${hotel.otel_id}0-c89cae4dc85b?w=500&h=300&fit=crop`,
        `https://images.unsplash.com/photo-157189634${hotel.otel_id}2-33c89424de2d?w=500&h=300&fit=crop`,
        `https://images.unsplash.com/photo-152025049${hotel.otel_id}1-112f2f40a3f4?w=500&h=300&fit=crop`,
        `https://images.unsplash.com/photo-156450104${hotel.otel_id}2-61c2a3083791?w=500&h=300&fit=crop`
      ]
    }));

    const newContent = JSON.stringify(hotelsWithPhotos, null, 2);
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
          message: `Update hotels data - ${new Date().toISOString()}`,
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
        error: `GitHub güncelleme hatası: ${updateResponse.status} - ${errorData}`
      };
    }

    const updateData = await updateResponse.json();
    
    return {
      success: true,
      commitSha: updateData.commit?.sha,
      message: 'Oteller başarıyla GitHub\'a kaydedildi'
    };

  } catch (error) {
    console.error('GitHub update error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'GitHub güncelleme sırasında bilinmeyen hata'
    };
  }
}


// Admin Data API - Hotels Management

import { NextRequest, NextResponse } from 'next/server';
import { getHotels } from '@/lib/utils';

// GET - Otel verilerini getir
export async function GET() {
  try {
    const hotels = getHotels();
    return NextResponse.json({
      success: true,
      data: hotels,
      count: hotels.length
    });
  } catch (error) {
    console.error('Hotels GET error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Otel verileri getirilemedi',
        data: []
      },
      { status: 500 }
    );
  }
}

// POST - Otel verilerini güncelle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Geçersiz otel verisi' 
        },
        { status: 400 }
      );
    }

    // Validate hotel data
    for (const hotel of data) {
      if (!hotel.otel_id || !hotel.otel_adi || !hotel.otel_lokasyon) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Eksik otel bilgisi - ID, Ad ve Lokasyon zorunludur' 
          },
          { status: 400 }
        );
      }

      // Validate URL format for website and whatsapp
      if (hotel.otel_sitesi && !isValidUrl(hotel.otel_sitesi)) {
        return NextResponse.json(
          { 
            success: false,
            error: `Geçersiz website URL: ${hotel.otel_sitesi}` 
          },
          { status: 400 }
        );
      }

      if (hotel.otel_whatsapp && !isValidUrl(hotel.otel_whatsapp)) {
        return NextResponse.json(
          { 
            success: false,
            error: `Geçersiz WhatsApp URL: ${hotel.otel_whatsapp}` 
          },
          { status: 400 }
        );
      }
    }

    // GitHub API ile dosyayı güncelle
    const updateResult = await updateHotelsOnGitHub(data);
    
    if (!updateResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'GitHub güncellemesi başarısız: ' + updateResult.error 
        },
        { status: 500 }
      );
    }

    console.log('Oteller GitHub\'a kaydedildi:', data.length, 'kayıt');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Oteller başarıyla güncellendi ve GitHub\'a kaydedildi',
      count: data.length,
      commitSha: updateResult.commitSha
    });

  } catch (error) {
    console.error('Hotels POST error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Oteller güncellenirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata') 
      },
      { status: 500 }
    );
  }
}

// URL validation helper
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// GitHub API ile hotels.json dosyasını güncelle
async function updateHotelsOnGitHub(hotels: any[]) {
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

    const filePath = 'src/lib/data/hotels.json';
    
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

    // 2. Yeni içeriği hazırla (photos alanını koru)
    const hotelsWithPhotos = hotels.map(hotel => ({
      ...hotel,
      photos: hotel.photos || [
        `https://images.unsplash.com/photo-156607379${hotel.otel_id}4-1a8506099945?w=500&h=300&fit=crop`,
        `https://images.unsplash.com/photo-158271947${hotel.otel_id}0-c89cae4dc85b?w=500&h=300&fit=crop`,
        `https://images.unsplash.com/photo-157189634${hotel.otel_id}2-33c89424de2d?w=500&h=300&fit=crop`,
        `https://images.unsplash.com/photo-152025049${hotel.otel_id}1-112f2f40a3f4?w=500&h=300&fit=crop`,
        `https://images.unsplash.com/photo-156450104${hotel.otel_id}2-61c2a3083791?w=500&h=300&fit=crop`
      ]
    }));

    const newContent = JSON.stringify(hotelsWithPhotos, null, 2);
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
          message: `Update hotels data - ${new Date().toISOString()}`,
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
        error: `GitHub güncelleme hatası: ${updateResponse.status} - ${errorData}`
      };
    }

    const updateData = await updateResponse.json();
    
    return {
      success: true,
      commitSha: updateData.commit?.sha,
      message: 'Oteller başarıyla GitHub\'a kaydedildi'
    };

  } catch (error) {
    console.error('GitHub update error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'GitHub güncelleme sırasında bilinmeyen hata'
    };
  }
}