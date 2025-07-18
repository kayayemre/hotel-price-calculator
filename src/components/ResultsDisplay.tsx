'use client';

import { useState } from 'react';

interface HotelOption {
  roomType: string;
  totalRooms: number;
  concept: string;
  totalPrice: number;
}

interface ParsedHotel {
  number: string;
  name: string;
  city: string;
  website: string;
  tel: string;
  whatsapp: string;
  info: string;
  options: HotelOption[];
  photos: string[];
}

interface ResultsDisplayProps {
  results: Record<string, unknown>;
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  // Parse flat response to organized hotel data
  const parseResults = (data: Record<string, unknown>): ParsedHotel[] => {
    const hotels: ParsedHotel[] = [];
    const keys = Object.keys(data).filter(key => key.startsWith('hotelName_'));
    
    for (const key of keys) {
      const hotelNumber = key.split('_')[1];
      
      // Sample photos for each hotel (you can replace with real URLs)
      const samplePhotos = [
        `https://images.unsplash.com/photo-156607379${hotelNumber}4-1a8506099945?w=500&h=300&fit=crop`,
        `https://images.unsplash.com/photo-158271947${hotelNumber}0-c89cae4dc85b?w=500&h=300&fit=crop`,
        `https://images.unsplash.com/photo-157189634${hotelNumber}2-33c89424de2d?w=500&h=300&fit=crop`,
        `https://images.unsplash.com/photo-152025049${hotelNumber}1-112f2f40a3f4?w=500&h=300&fit=crop`,
        `https://images.unsplash.com/photo-156450104${hotelNumber}2-61c2a3083791?w=500&h=300&fit=crop`
      ];
      
      // Check if this hotel has multiple options (a, b, c...)
      const hasMultipleOptions = Object.keys(data).some(k => 
        k.includes(`_${hotelNumber}_`) && (k.includes('_a') || k.includes('_b'))
      );
      
      if (hasMultipleOptions) {
        // Hotel with multiple room/concept combinations
        const hotel: ParsedHotel = {
          number: hotelNumber,
          name: String(data[`hotelName_${hotelNumber}`] || ''),
          city: String(data[`city_${hotelNumber}`] || ''),
          website: String(data[`website_${hotelNumber}`] || ''),
          tel: String(data[`tel_${hotelNumber}`] || ''),
          whatsapp: String(data[`whatsapp_${hotelNumber}`] || ''),
          info: String(data[`info_${hotelNumber}`] || ''),
          photos: samplePhotos,
          options: []
        };
        
        // Find all options (a, b, c...)
        const optionKeys = Object.keys(data)
          .filter(k => k.includes(`roomType_${hotelNumber}_`))
          .map(k => k.split('_').pop())
          .filter(Boolean);
        
        for (const suffix of optionKeys) {
          hotel.options.push({
            roomType: String(data[`roomType_${hotelNumber}_${suffix}`] || ''),
            totalRooms: Number(data[`totalRooms_${hotelNumber}_${suffix}`] || 0),
            concept: String(data[`concept_${hotelNumber}_${suffix}`] || ''),
            totalPrice: Number(data[`totalPrice_${hotelNumber}_${suffix}`] || 0)
          });
        }
        
        // Sort options by price
        hotel.options.sort((a, b) => a.totalPrice - b.totalPrice);
        hotels.push(hotel);
        
      } else {
        // Hotel with single option
        const hotel: ParsedHotel = {
          number: hotelNumber,
          name: String(data[`hotelName_${hotelNumber}`] || ''),
          city: String(data[`city_${hotelNumber}`] || ''),
          website: String(data[`website_${hotelNumber}`] || ''),
          tel: String(data[`tel_${hotelNumber}`] || ''),
          whatsapp: String(data[`whatsapp_${hotelNumber}`] || ''),
          info: String(data[`info_${hotelNumber}`] || ''),
          photos: samplePhotos,
          options: [{
            roomType: String(data[`roomType_${hotelNumber}`] || ''),
            totalRooms: Number(data[`totalRooms_${hotelNumber}`] || 0),
            concept: String(data[`concept_${hotelNumber}`] || ''),
            totalPrice: Number(data[`totalPrice_${hotelNumber}`] || 0)
          }]
        };
        
        hotels.push(hotel);
      }
    }
    
    // Sort hotels by cheapest option
    return hotels.sort((a, b) => {
      const minPriceA = Math.min(...a.options.map(opt => opt.totalPrice));
      const minPriceB = Math.min(...b.options.map(opt => opt.totalPrice));
      return minPriceA - minPriceB;
    });
  };

  const hotels = parseResults(results);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getRoomText = (roomCount: number): string => {
    return roomCount === 1 ? '1 Oda' : `${roomCount} Oda`;
  };

  const getPriceColor = (price: number, allPrices: number[]): string => {
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    
    if (price === minPrice) return 'text-green-600 font-bold';
    if (price === maxPrice) return 'text-red-600';
    return 'text-gray-900';
  };

  // Get all prices for comparison
  const allPrices = hotels.flatMap(hotel => 
    hotel.options.map(opt => opt.totalPrice)
  );

  // Get search params safely
  const searchParams = results.searchParams as Record<string, unknown> || {};

  if (hotels.length === 0) {
    return (
      <div className="p-4 sm:p-8 text-center text-gray-500">
        <div className="text-4xl mb-4">🏨</div>
        <p className="text-lg mb-2">Hiç sonuç bulunamadı</p>
        <p className="text-sm">Farklı tarih veya misafir sayısı ile tekrar deneyin</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      {/* Summary */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📊</div>
            <div>
              <p className="font-semibold text-blue-900 text-sm sm:text-base">
                {hotels.length} Otel Bulundu
              </p>
              <p className="text-xs sm:text-sm text-blue-700">
                {String(searchParams.totalNights || '')} gece konaklama
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-blue-700">En Uygun Fiyat</p>
            <p className="text-lg sm:text-xl font-bold text-blue-900">
              {formatPrice(Math.min(...allPrices))}
            </p>
          </div>
        </div>
      </div>

      {/* Hotel Results */}
      <div className="space-y-4 sm:space-y-6">
        {hotels.map((hotel, index) => (
          <HotelCard 
            key={hotel.number} 
            hotel={hotel} 
            index={index} 
            allPrices={allPrices}
            searchParams={searchParams}
            formatPrice={formatPrice}
            getRoomText={getRoomText}
            getPriceColor={getPriceColor}
          />
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-50 rounded-xl text-xs sm:text-sm text-gray-600">
        <p className="flex items-center mb-2 font-medium">
          <span className="mr-2">ℹ️</span>
          Önemli Bilgiler:
        </p>
        <ul className="space-y-1 ml-6 text-xs">
          <li>• Fiyatlar {String(searchParams.totalNights || '')} gece konaklama için toplam tutardır</li>
          <li>• Çocuk yaş sınırları otellere göre değişiklik gösterebilir</li>
          <li>• Rezervasyon için otelin iletişim bilgilerini kullanın</li>
          <li>• Fiyatlar anlık olarak hesaplanmış olup değişiklik gösterebilir</li>
        </ul>
      </div>
    </div>
  );
}

// Hotel Card Component
function HotelCard({ hotel, index, allPrices, searchParams, formatPrice, getRoomText, getPriceColor }: {
  hotel: ParsedHotel;
  index: number;
  allPrices: number[];
  searchParams: Record<string, unknown>;
  formatPrice: (price: number) => string;
  getRoomText: (count: number) => string;
  getPriceColor: (price: number, allPrices: number[]) => string;
}) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % hotel.photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + hotel.photos.length) % hotel.photos.length);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* Photo Carousel */}
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <img 
          src={hotel.photos[currentPhotoIndex]} 
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-500"
        />
        
        {/* Photo Navigation */}
        <div className="absolute inset-0 flex items-center justify-between p-2">
          <button 
            onClick={prevPhoto}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={nextPhoto}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Photo Dots */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {hotel.photos.map((_, photoIndex) => (
            <button
              key={photoIndex}
              onClick={() => setCurrentPhotoIndex(photoIndex)}
              className={`w-2 h-2 rounded-full transition-colors ${
                photoIndex === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Best Price Badge */}
        {Math.min(...hotel.options.map(opt => opt.totalPrice)) === Math.min(...allPrices) && (
          <div className="absolute top-3 left-3">
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              🏆 En Uygun
            </span>
          </div>
        )}

        {/* Ranking Badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">
            #{index + 1}
          </span>
        </div>
      </div>

      {/* Hotel Info */}
      <div className="p-4">
        {/* Hotel Header */}
        <div className="mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
            {hotel.name}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-1">📍</span>
              {hotel.city}
            </div>
            <div className="flex items-center text-sm text-orange-600 font-medium">
              <span className="mr-1">ℹ️</span>
              {hotel.info}
            </div>
          </div>
        </div>

        {/* Contact Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {hotel.website && (
            <a 
              href={hotel.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 p-3 rounded-xl transition-colors text-blue-600"
            >
              <span className="text-lg mb-1">🌐</span>
              <span className="text-xs font-medium">Website</span>
            </a>
          )}
          {hotel.tel && (
            <a 
              href={`tel:${hotel.tel}`}
              className="flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 p-3 rounded-xl transition-colors text-green-600"
            >
              <span className="text-lg mb-1">📞</span>
              <span className="text-xs font-medium">Telefon</span>
            </a>
          )}
          {hotel.whatsapp && (
            <a 
              href={hotel.whatsapp} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 p-3 rounded-xl transition-colors text-green-600"
            >
              <span className="text-lg mb-1">💬</span>
              <span className="text-xs font-medium">WhatsApp</span>
            </a>
          )}
        </div>

        {/* Room Options */}
        <div className="space-y-3">
          {hotel.options.map((option, optionIndex) => (
            <div key={optionIndex} className="bg-gray-50 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        🏠 {option.roomType}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
                        {getRoomText(option.totalRooms)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 flex items-center">
                        <span className="mr-1">🍽️</span>
                        {option.concept}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xl sm:text-2xl font-bold ${getPriceColor(option.totalPrice, allPrices)}`}>
                    {formatPrice(option.totalPrice)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {String(searchParams.totalNights || '')} gece toplam
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hotel.options.length > 1 && (
          <div className="mt-3 text-center">
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {hotel.options.length} farklı seçenek mevcut
            </span>
          </div>
        )}
      </div>
    </div>
  );
}