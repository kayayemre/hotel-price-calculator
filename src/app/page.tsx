'use client';

import { useState } from 'react';
import SearchForm from '@/components/SearchForm';
import ResultsDisplay from '@/components/ResultsDisplay';
import Link from 'next/link';

export default function HomePage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchData: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number[];
  }) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkin: searchData.checkIn,
          checkout: searchData.checkOut,
          adults: searchData.adults,
          children: searchData.children.length,
          childAges: searchData.children
        })
      });

      console.log('Request sent:', {
        checkin: searchData.checkIn,
        checkout: searchData.checkOut,
        adults: searchData.adults,
        children: searchData.children.length,
        childAges: searchData.children
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🏨 Otel Fiyat Hesaplama Sistemi
              </h1>
              <p className="text-gray-600 mt-2">
                5 otelde en uygun fiyatları bulun ve karşılaştırın
              </p>
            </div>
            <div className="flex gap-4">
              <Link 
                href="/admin"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                🔐 Admin Panel
              </Link>
              <Link 
                href="/test"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                🧪 API Test
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            En Uygun Otel Fiyatlarını Bulun
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Antalya ve Fethiye'deki 5 farklı otelde aynı anda arama yapın, 
            fiyatları karşılaştırın ve en uygun seçeneği bulun
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold mb-2">Hızlı Arama</h3>
              <p className="text-blue-100">Tek aramada 5 otelin fiyatlarını görün</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="text-lg font-semibold mb-2">En Uygun Fiyat</h3>
              <p className="text-blue-100">Otomatik fiyat karşılaştırması</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl mb-3">📞</div>
              <h3 className="text-lg font-semibold mb-2">Direkt İletişim</h3>
              <p className="text-blue-100">Otel ile doğrudan iletişim kurun</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Hotels Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
              🏨 Arama Yapabileceğiniz Oteller
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-bold text-blue-900">De Mare Family Hotel</h3>
                <p className="text-blue-700 text-sm">Antalya - Alanya</p>
                <p className="text-blue-600 text-xs mt-1">Denize Sıfır • Alkolsüz Her Şey Dahil</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-bold text-green-900">Club SVS Hotel</h3>
                <p className="text-green-700 text-sm">Antalya - Alanya</p>
                <p className="text-green-600 text-xs mt-1">Denize Sıfır • Alkollü Her Şey Dahil</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-bold text-purple-900">Grand Barhan Hotel</h3>
                <p className="text-purple-700 text-sm">Antalya - Alanya</p>
                <p className="text-purple-600 text-xs mt-1">Denize Sıfır • Çoklu Oda Seçenekleri</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="font-bold text-orange-900">Mesut Hotel</h3>
                <p className="text-orange-700 text-sm">Antalya - Alanya</p>
                <p className="text-orange-600 text-xs mt-1">Denize Sıfır • Alkollü Her Şey Dahil</p>
              </div>
              <div className="bg-teal-50 rounded-lg p-4 md:col-span-2 lg:col-span-1">
                <h3 className="font-bold text-teal-900">Dream of Ölüdeniz</h3>
                <p className="text-teal-700 text-sm">Fethiye - Ölüdeniz</p>
                <p className="text-teal-600 text-xs mt-1">Denize 700m • Alkollü Her Şey Dahil</p>
              </div>
            </div>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              🔍 Otel Arama
            </h2>
            <SearchForm onSearch={handleSearch} loading={loading} />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Fiyatlar hesaplanıyor...</p>
              <p className="text-sm text-gray-500 mt-2">5 otelden fiyat alınıyor</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <div className="text-red-600 mr-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-red-800 font-medium">Hata Oluştu</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                  <p className="text-red-600 text-sm mt-2">
                    Lütfen farklı tarihler deneyiniz veya sayfayı yenileyiniz.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results && !loading && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-green-50 border-b border-green-200 p-4">
                <h2 className="text-xl font-semibold text-green-800">
                  🎉 Arama Sonuçları
                </h2>
                <p className="text-green-700 mt-1">
                  {results.searchParams?.checkIn} - {results.searchParams?.checkOut} 
                  ({results.searchParams?.totalAdults} Yetişkin
                  {results.searchParams?.totalChildren > 0 && `, ${results.searchParams?.totalChildren} Çocuk`})
                  • {results.searchParams?.totalNights} gece
                </p>
              </div>
              <ResultsDisplay results={results} />
            </div>
          )}

          {/* Info Section */}
          <div className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              ℹ️ Nasıl Çalışır?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">1. Tarih ve Misafir Sayısı</h3>
                <p>Konaklama tarihlerinizi ve misafir sayınızı girin. Çocuklar için yaş belirtmeyi unutmayın.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-2">2. Otomatik Fiyat Hesaplama</h3>
                <p>Sistem tüm otellerdeki uygun fiyatları hesaplar ve en uygun seçenekleri sunar.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-2">3. Fiyat Karşılaştırması</h3>
                <p>Tüm otellerin fiyatlarını yan yana görüp en uygun olanı seçebilirsiniz.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-2">4. Direkt Rezervasyon</h3>
                <p>Beğendiğiniz oteli seçip telefon, WhatsApp veya web sitesi üzerinden rezervasyon yapın.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              <span className="font-semibold">Hotel Price Calculator</span> © 2025
            </p>
            <p className="text-sm">
              Antalya ve Fethiye otelleri için fiyat karşılaştırma sistemi
            </p>
            <div className="mt-4 flex justify-center space-x-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-800 text-sm">
                Admin Panel
              </Link>
              <Link href="/test" className="text-blue-600 hover:text-blue-800 text-sm">
                API Test
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}