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
  const [editingDate, setEditingDate] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState<number | null>(null);
  const [newPeriod, setNewPeriod] = useState({
    tarih_baslangic: '',
    tarih_bitis: '',
    fiyat: 0
  });

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Admin password (in production, this should be in environment variables)
  const ADMIN_PASSWORD = '982751';

  useEffect(() => {
    // Check if user is already authenticated (session storage)
    const savedAuth = sessionStorage.getItem('adminAuth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setLoading(true);
      loadData();
    } else {
      setLoginError('Hatalı şifre! Lütfen tekrar deneyin.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
    setPassword('');
  };

  const loadData = async () => {
    try {
      // Try API first
      const [pricesRes, hotelsRes] = await Promise.all([
        fetch('/api/admin/prices').catch(() => null),
        fetch('/api/hotels').catch(() => null)
      ]);

      let pricesLoaded = false;
      let hotelsLoaded = false;

      if (pricesRes?.ok) {
        const pricesData = await pricesRes.json();
        setPrices(pricesData);
        pricesLoaded = true;
      }

      if (hotelsRes?.ok) {
        const hotelsData = await hotelsRes.json();
        if (hotelsData.hotels) {
          setHotels(hotelsData.hotels.map((h: any) => ({
            otel_id: h.otel_id,
            otel_adi: h.otel_adi,
            otel_lokasyon: h.otel_lokasyon
          })));
          hotelsLoaded = true;
        }
      }

      // Fallback to mock data if APIs fail
      if (!pricesLoaded || !hotelsLoaded) {
        console.log('API failed, using mock data');
        
        // Mock hotels data
        const mockHotels = [
          { otel_id: 1, otel_adi: "De Mare Family Hotel", otel_lokasyon: "Antalya - Alanya" },
          { otel_id: 2, otel_adi: "Club SVS Hotel", otel_lokasyon: "Antalya - Alanya" },
          { otel_id: 3, otel_adi: "Grand Barhan Hotel", otel_lokasyon: "Antalya - Alanya" },
          { otel_id: 4, otel_adi: "Mesut Hotel", otel_lokasyon: "Antalya - Alanya" },
          { otel_id: 5, otel_adi: "Dream of Ölüdeniz Hotel", otel_lokasyon: "Fethiye - Ölüdeniz" }
        ];

        // Mock prices data
        const mockPrices = [
          { otel_id: 1, oda_tipi: "Standard Oda", tarih_baslangic: "2025-07-17", tarih_bitis: "2025-08-31", konsept: "Alkolsüz Herşey Dahil", fiyat: 3000, para_birimi: "TL" },
          { otel_id: 1, oda_tipi: "Standard Oda", tarih_baslangic: "2025-09-01", tarih_bitis: "2025-09-14", konsept: "Alkolsüz Herşey Dahil", fiyat: 2600, para_birimi: "TL" },
          { otel_id: 2, oda_tipi: "Standard Oda", tarih_baslangic: "2025-07-17", tarih_bitis: "2025-08-20", konsept: "Alkollü Herşey Dahil", fiyat: 3100, para_birimi: "TL" },
          { otel_id: 3, oda_tipi: "Kara Manzaralı Standard Oda", tarih_baslangic: "2025-07-16", tarih_bitis: "2025-07-19", konsept: "Alkolsüz Herşey Dahil", fiyat: 2750, para_birimi: "TL" },
          { otel_id: 3, oda_tipi: "Deniz Manzaralı Standard Oda", tarih_baslangic: "2025-07-16", tarih_bitis: "2025-07-19", konsept: "Alkolsüz Herşey Dahil", fiyat: 3000, para_birimi: "TL" }
        ];

        if (!hotelsLoaded) setHotels(mockHotels);
        if (!pricesLoaded) setPrices(mockPrices);
        
        setMessage('⚠️ Demo mod - API bağlantısı yok');
      }

    } catch (error) {
      setMessage('Veriler yüklenirken hata oluştu: ' + error);
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

  const updateDateRange = (index: number, field: 'tarih_baslangic' | 'tarih_bitis', newDate: string) => {
    const updatedPrices = [...prices];
    updatedPrices[index][field] = newDate;
    setPrices(updatedPrices);
  };

  const deletePeriod = (index: number) => {
    if (confirm('Bu fiyat periyodunu silmek istediğinizden emin misiniz?')) {
      const updatedPrices = prices.filter((_, i) => i !== index);
      setPrices(updatedPrices);
      setMessage('🗑️ Fiyat periyodu silindi');
    }
  };

  const addNewPeriod = (hotelId: number, roomType: string, concept: string) => {
    if (!newPeriod.tarih_baslangic || !newPeriod.tarih_bitis || !newPeriod.fiyat) {
      setMessage('❌ Lütfen tüm alanları doldurun');
      return;
    }

    const newPrice = {
      otel_id: hotelId,
      oda_tipi: roomType,
      tarih_baslangic: newPeriod.tarih_baslangic,
      tarih_bitis: newPeriod.tarih_bitis,
      konsept: concept,
      fiyat: newPeriod.fiyat,
      para_birimi: 'TL'
    };

    setPrices([...prices, newPrice]);
    setNewPeriod({ tarih_baslangic: '', tarih_bitis: '', fiyat: 0 });
    setShowAddForm(null);
    setMessage('✅ Yeni fiyat periyodu eklendi');
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

      const result = await response.json();

      if (response.ok) {
        setMessage('✅ Fiyatlar başarıyla güncellendi ve GitHub\'a kaydedildi!');
        if (result.commitSha) {
          setMessage(prev => prev + ` (Commit: ${result.commitSha.substring(0, 7)})`);
        }
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage('❌ Kayıt sırasında hata oluştu: ' + (result.error || 'Bilinmeyen hata'));
      }
    } catch (error) {
      setMessage('❌ Bağlantı hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
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

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🏨</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Paneli</h1>
              <p className="text-gray-600">Fiyat yönetim sistemine hoş geldiniz</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Şifresi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Şifrenizi girin"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">🚫 {loginError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                🔐 Giriş Yap
              </button>
            </form>

            {/* Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                🔒 Bu alan sadece yetkili personel içindir.<br/>
                Şifrenizi unuttuysanız sistem yöneticisiyle iletişime geçin.
              </p>
            </div>
          </div>
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlangıç</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bitiş</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fiyat</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
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
                              
                              {/* Start Date */}
                              <td className="px-4 py-4">
                                {editingDate === originalIndex ? (
                                  <input
                                    type="date"
                                    value={price.tarih_baslangic}
                                    onChange={(e) => updateDateRange(originalIndex, 'tarih_baslangic', e.target.value)}
                                    onBlur={() => setEditingDate(null)}
                                    className="w-32 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                ) : (
                                  <span 
                                    onClick={() => setEditingDate(originalIndex)}
                                    className="cursor-pointer hover:bg-yellow-100 px-2 py-1 rounded text-sm text-gray-900 transition-colors"
                                  >
                                    {formatDate(price.tarih_baslangic)}
                                  </span>
                                )}
                              </td>

                              {/* End Date */}
                              <td className="px-4 py-4">
                                {editingDate === originalIndex ? (
                                  <input
                                    type="date"
                                    value={price.tarih_bitis}
                                    onChange={(e) => updateDateRange(originalIndex, 'tarih_bitis', e.target.value)}
                                    onBlur={() => setEditingDate(null)}
                                    className="w-32 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  <span 
                                    onClick={() => setEditingDate(originalIndex)}
                                    className="cursor-pointer hover:bg-yellow-100 px-2 py-1 rounded text-sm text-gray-900 transition-colors"
                                  >
                                    {formatDate(price.tarih_bitis)}
                                  </span>
                                )}
                              </td>

                              {/* Price */}
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

                              {/* Actions */}
                              <td className="px-4 py-4">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => setEditingPrice(originalIndex)}
                                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                                  >
                                    ✏️ Fiyat
                                  </button>
                                  <button
                                    onClick={() => setEditingDate(originalIndex)}
                                    className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                                  >
                                    📅 Tarih
                                  </button>
                                  <button
                                    onClick={() => deletePeriod(originalIndex)}
                                    className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                                  >
                                    🗑️ Sil
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Add New Period Row */}
                        {showAddForm === hotel.otel_id && (
                          <tr className="bg-green-50">
                            <td className="px-4 py-4 text-sm font-medium text-green-800">
                              {hotelPrices[0]?.oda_tipi || 'Standard Oda'}
                            </td>
                            <td className="px-4 py-4 text-sm text-green-800">
                              {hotelPrices[0]?.konsept || 'Alkolsüz Herşey Dahil'}
                            </td>
                            <td className="px-4 py-4">
                              <input
                                type="date"
                                value={newPeriod.tarih_baslangic}
                                onChange={(e) => setNewPeriod({...newPeriod, tarih_baslangic: e.target.value})}
                                className="w-32 px-2 py-1 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Başlangıç"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <input
                                type="date"
                                value={newPeriod.tarih_bitis}
                                onChange={(e) => setNewPeriod({...newPeriod, tarih_bitis: e.target.value})}
                                className="w-32 px-2 py-1 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Bitiş"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <input
                                type="number"
                                value={newPeriod.fiyat}
                                onChange={(e) => setNewPeriod({...newPeriod, fiyat: Number(e.target.value)})}
                                className="w-32 px-3 py-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Fiyat"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => addNewPeriod(hotel.otel_id, hotelPrices[0]?.oda_tipi || 'Standard Oda', hotelPrices[0]?.konsept || 'Alkolsüz Herşey Dahil')}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                >
                                  ✅ Ekle
                                </button>
                                <button
                                  onClick={() => setShowAddForm(null)}
                                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-xs font-medium transition-colors"
                                >
                                  ❌ İptal
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Add New Period Button */}
                    <div className="p-4 border-t bg-gray-50">
                      <button
                        onClick={() => setShowAddForm(hotel.otel_id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        ➕ Yeni Fiyat Periyodu Ekle
                      </button>
                    </div>
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