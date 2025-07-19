'use client';

import { useState } from 'react';
import SearchForm from '@/components/SearchForm';
import ResultsDisplay from '@/components/ResultsDisplay';

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
          <h1 className="text-3xl font-bold text-gray-900">
            Otel Fiyat Hesaplama Sistemi
          </h1>
          <p className="text-gray-600 mt-2">
            5 otelde en uygun fiyatları bulun ve karşılaştırın
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Otel Arama
            </h2>
            <SearchForm onSearch={handleSearch} loading={loading} />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Fiyatlar hesaplanıyor...</p>
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
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results && !loading && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-green-50 border-b border-green-200 p-4">
                <h2 className="text-xl font-semibold text-green-800">
                  Arama Sonuçları
                </h2>
                <p className="text-green-700 mt-1">
                  {results.searchParams.checkIn} - {results.searchParams.checkOut} 
                  ({results.searchParams.totalAdults} Yetişkin, {results.searchParams.totalChildren} Çocuk)
                </p>
              </div>
              <ResultsDisplay results={results} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>Hotel Price Calculator © 2025</p>
        </div>
      </footer>
    </div>
  );
}