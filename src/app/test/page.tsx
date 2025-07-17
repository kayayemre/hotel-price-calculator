'use client';

import { useState } from 'react';

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testCalculatePrice = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const testData = {
        checkIn: '2025-08-01',
        checkOut: '2025-08-05',
        adults: 2,
        children: [15, 10]
      };

      const response = await fetch('/api/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  const testHotelsAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/hotels');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Hotel Price Calculator API Test</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={testHotelsAPI}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4 disabled:opacity-50"
        >
          {loading ? 'Test Ediliyor...' : 'Hotels API Test Et'}
        </button>

        <button
          onClick={testCalculatePrice}
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Test Ediliyor...' : 'Calculate Price API Test Et'}
        </button>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Test Parametreleri (Calculate Price):</h3>
        <pre className="bg-gray-100 p-4 rounded text-sm">
{`{
  "checkIn": "2025-08-01",
  "checkOut": "2025-08-05", 
  "adults": 2,
  "children": [15, 10]
}`}
        </pre>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Hata:</strong> {error}
        </div>
      )}

      {result && (
        <div className="bg-white border border-gray-300 rounded">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h3 className="text-lg font-semibold">API Sonucu:</h3>
          </div>
          <div className="p-4">
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-8 text-sm text-gray-600">
        <h4 className="font-semibold mb-2">API Endpoints:</h4>
        <ul className="space-y-1">
          <li>• GET /api/hotels - Otel listesi</li>
          <li>• GET /api/calculate-price - API bilgileri</li>
          <li>• POST /api/calculate-price - Fiyat hesaplama</li>
        </ul>
      </div>
    </div>
  );
}