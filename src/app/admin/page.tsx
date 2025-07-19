'use client';

import { useState, useEffect } from 'react';

interface HotelPrice {
  otel_id: number;
  oda_tipi: string;
  tarih_baslangic: string;
  tarih_bitis: string;
  konsept: string;
  fiyat: number;
  para_birimi: string;
}

interface Hotel {
  otel_id: number;
  otel_adi: string;
  otel_lokasyon: string;
}

export default function AdminPage() {
  const [prices, setPrices] = useState<HotelPrice[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedHotel, setSelectedHotel] = useState<number>(0);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pricesRes, hotelsRes] = await Promise.all([
        fetch('/api/admin/prices'),
        fetch('/api/hotels')
      ]);

      if (pricesRes.ok) {
        const pricesData = await pricesRes.json();
        setPrices(pricesData);
      }

      if (hotelsRes.ok) {
        const hotelsData = await hotelsRes.json();
        // hotels array'ini doğru şekilde al
        if (hotelsData.hotels) {
          setHotels(hotelsData.hotels.map((h: any) => ({
            otel_id: h.otel_id,
            otel_adi: h.otel_adi,
            otel_lokasyon: h.otel_lokasyon
          })));
        }
      }
    } catch (error) {
      setMessage('Veriler yüklenirken hata oluştu');
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = (index: number, newPrice: number) => {
    const updatedPrices = [...prices];
    updatedPrices[index].fiyat = newPrice;
    setPrices(updatedPrices);
  };

  const savePrices = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices })
      });

      if (response.ok) {
        setMessage('✅ Fiyatlar başarıyla güncellendi!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Kayıt sırasında hata oluştu');
      }
    } catch (error) {
      setMessage('❌ Bağlantı hatası');
    } finally {
      setSaving(false);
    }
  };

  const applyPercentageChange = (percentage: number) => {
    const updatedPrices = prices.map(price => ({
      ...price,
      fiyat: Math.round(price.fiyat * (1 + percentage / 100))
    }));
    setPrices(updatedPrices);
    setMessage(`📈 Tüm fiyatlara %${percentage} ${percentage > 0 ? 'zam' : 'indirim'} uygulandı`);
  };

  const filteredPrices = selectedHotel === 0 
    ? prices 
    : prices.filter(p => p.otel_id === selectedHotel);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR').format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🏨 Fiyat Yönetim Paneli
              </h1>
              <p className="text-gray-600 mt-2">
                Otel fiyatlarını düzenleyin ve güncelleyin
              </p>
            </div>
            <a 
              href="/"
              className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
            >
              ← Ana Sayfa
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Message */}
          {message && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">{message}</p>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              
              {/* Hotel Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Otel Filtrele
                </label>
                <select
                  value={selectedHotel}
                  onChange={(e) => setSelectedHotel(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Tüm Oteller</option>
                  {hotels.map(hotel => (
                    <option key={hotel.otel_id} value={hotel.otel_id}>
                      {hotel.otel_adi}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hızlı İşlemler
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => applyPercentageChange(10)}
                    className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
                  >
                    +10%
                  </button>
                  <button
                    onClick={() => applyPercentageChange(-10)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                  >
                    -10%
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İstatistikler
                </label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-blue-600 font-medium">Toplam Fiyat</p>
                    <p className="text-lg font-bold text-blue-900">
                      {filteredPrices.length}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-green-600 font-medium">Ortalama Fiyat</p>
                    <p className="text-lg font-bold text-green-900">
                      {formatPrice(Math.round(filteredPrices.reduce((acc, p) => acc + p.fiyat, 0) / filteredPrices.length))} ₺
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={savePrices}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Kaydediliyor...
                  </div>
                ) : (
                  '💾 Değişiklikleri Kaydet'
                )}
              </button>
            </div>
          </div>

          {/* Prices Table - Group by Hotel */}
          <div className="space-y-6">
            {hotels.filter(hotel => selectedHotel === 0 || hotel.otel_id === selectedHotel).map(hotel => {
              const hotelPrices = prices.filter(p => p.otel_id === hotel.otel_id);
              
              if (hotelPrices.length === 0) return null;
              
              return (
                <div key={hotel.otel_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Hotel Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <h3 className="text-xl font-bold text-white">{hotel.otel_adi}</h3>
                    <p className="text-blue-100">{hotel.otel_lokasyon} • {hotelPrices.length} fiyat kaydı</p>
                  </div>
                  
                  {/* Hotel Prices Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oda Tipi</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Konsept</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih Aralığı</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fiyat</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {hotelPrices.map((price, index) => {
                          const originalIndex = prices.findIndex(p => 
                            p.otel_id === price.otel_id && 
                            p.oda_tipi === price.oda_tipi && 
                            p.konsept === price.konsept &&
                            p.tarih_baslangic === price.tarih_baslangic
                          );
                          
                          return (
                            <tr key={`${price.otel_id}-${price.oda_tipi}-${price.konsept}-${price.tarih_baslangic}`} className="hover:bg-gray-50">
                              <td className="px-4 py-4 text-sm font-medium text-gray-900">{price.oda_tipi}</td>
                              <td className="px-4 py-4 text-sm text-gray-600">{price.konsept}</td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {formatDate(price.tarih_baslangic)} / {formatDate(price.tarih_bitis)}
                              </td>
                              <td className="px-4 py-4">
                                {editingPrice === originalIndex ? (
                                  <input
                                    type="number"
                                    value={price.fiyat}
                                    onChange={(e) => updatePrice(originalIndex, Number(e.target.value))}
                                    onBlur={() => setEditingPrice(null)}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingPrice(null)}
                                    className="w-32 px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                ) : (
                                  <span 
                                    onClick={() => setEditingPrice(originalIndex)}
                                    className="cursor-pointer hover:bg-yellow-100 px-3 py-2 rounded font-bold text-lg text-gray-900 transition-colors"
                                  >
                                    {formatPrice(price.fiyat)} ₺
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={() => setEditingPrice(originalIndex)}
                                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                >
                                  ✏️ Düzenle
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}