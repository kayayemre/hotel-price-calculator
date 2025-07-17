'use client';

import { useState } from 'react';

interface SearchFormProps {
  onSearch: (data: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number[];
  }) => void;
  loading: boolean;
}

export default function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);

  const handleChildrenCountChange = (count: number) => {
    setChildrenCount(count);
    const newAges = Array(count).fill(0).map((_, index) => childrenAges[index] || 6);
    setChildrenAges(newAges);
  };

  const handleChildAgeChange = (index: number, age: number) => {
    const newAges = [...childrenAges];
    newAges[index] = age;
    setChildrenAges(newAges);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkIn || !checkOut) {
      alert('Lütfen giriş ve çıkış tarihlerini seçin');
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      alert('Çıkış tarihi giriş tarihinden sonra olmalıdır');
      return;
    }

    if (adults < 1) {
      alert('En az 1 yetişkin olmalıdır');
      return;
    }

    onSearch({
      checkIn,
      checkOut,
      adults,
      children: childrenAges
    });
  };

  // Get today's date for min date restriction
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-2">
            Giriş Tarihi
          </label>
          <input
            type="date"
            id="checkIn"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={today}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 mb-2">
            Çıkış Tarihi
          </label>
          <input
            type="date"
            id="checkOut"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={checkIn || today}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Guest Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="adults" className="block text-sm font-medium text-gray-700 mb-2">
            Yetişkin Sayısı
          </label>
          <select
            id="adults"
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <option key={num} value={num}>{num} Yetişkin</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="children" className="block text-sm font-medium text-gray-700 mb-2">
            Çocuk Sayısı
          </label>
          <select
            id="children"
            value={childrenCount}
            onChange={(e) => handleChildrenCountChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[0, 1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>{num} Çocuk</option>
            ))}
          </select>
        </div>
      </div>

      {/* Children Ages */}
      {childrenCount > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Çocuk Yaşları
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array(childrenCount).fill(0).map((_, index) => (
              <div key={index}>
                <label htmlFor={`child-${index}`} className="block text-xs text-gray-600 mb-1">
                  {index + 1}. Çocuk
                </label>
                <select
                  id={`child-${index}`}
                  value={childrenAges[index] || 6}
                  onChange={(e) => handleChildAgeChange(index, Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {Array.from({ length: 18 }, (_, i) => i).map(age => (
                    <option key={age} value={age}>{age} yaş</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Aranıyor...
            </div>
          ) : (
            'Fiyatları Ara'
          )}
        </button>
      </div>

      {/* Info Text */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <p className="font-medium mb-1">💡 Bilgi:</p>
        <p>• Çocuk yaş sınırları otellere göre değişiklik gösterebilir</p>
        <p>• Her odada en az 1 yetişkin bulunması zorunludur</p>
        <p>• Sistem otomatik olarak en uygun oda dağıtımını hesaplar</p>
      </div>
    </form>
  );
}