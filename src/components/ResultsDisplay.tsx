'use client';

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
      <div className="p-8 text-center text-gray-500">
        <div className="text-4xl mb-4">🏨</div>
        <p className="text-lg mb-2">Hiç sonuç bulunamadı</p>
        <p className="text-sm">Farklı tarih veya misafir sayısı ile tekrar deneyin</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Summary */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl">📊</div>
            <div>
              <p className="font-semibold text-blue-900">
                {hotels.length} Otel Bulundu
              </p>
              <p className="text-sm text-blue-700">
                {String(searchParams.totalNights || '')} gece konaklama
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-700">En Uygun Fiyat</p>
            <p className="text-lg font-bold text-blue-900">
              {formatPrice(Math.min(...allPrices))}
            </p>
          </div>
        </div>
      </div>

      {/* Hotel Results */}
      <div className="space-y-6">
        {hotels.map((hotel, index) => (
          <div key={hotel.number} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            {/* Hotel Header */}
            <div className="bg-gray-50 px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {index + 1}. {hotel.name}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="mr-1">📍</span>
                      {hotel.city}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="mr-1">ℹ️</span>
                      {hotel.info}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {hotel.options.length > 1 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                      {hotel.options.length} Seçenek
                    </span>
                  )}
                  <div className="flex items-center space-x-2">
                    {hotel.website && (
                      <a 
                        href={hotel.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        title="Website'yi Ziyaret Et"
                      >
                        🌐
                      </a>
                    )}
                    {hotel.tel && (
                      <a 
                        href={`tel:${hotel.tel}`}
                        className="text-green-600 hover:text-green-800 text-sm flex items-center"
                        title={`Telefon: ${hotel.tel}`}
                      >
                        📞
                      </a>
                    )}
                    {hotel.whatsapp && (
                      <a 
                        href={hotel.whatsapp} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800 text-sm flex items-center"
                        title="WhatsApp'tan İletişim"
                      >
                        💬
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Hotel Options */}
            <div className="divide-y divide-gray-100">
              {hotel.options.map((option, optionIndex) => (
                <div key={optionIndex} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            🏠 {option.roomType}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({getRoomText(option.totalRooms)})
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <span className="mr-1">🍽️</span>
                          {option.concept}
                        </span>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className={`text-xl font-bold ${getPriceColor(option.totalPrice, allPrices)}`}>
                        {formatPrice(option.totalPrice)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {String(searchParams.totalNights || '')} gece toplam
                      </div>
                      {option.totalPrice === Math.min(...allPrices) && (
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                          🏆 En Uygun
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {optionIndex === 0 && hotel.options.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 italic">
                        ⬇ Bu otelin diğer seçenekleri aşağıda
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p className="flex items-center mb-2">
          <span className="mr-2">ℹ️</span>
          <strong>Önemli Bilgiler:</strong>
        </p>
        <ul className="space-y-1 ml-6">
          <li>• Fiyatlar {String(searchParams.totalNights || '')} gece konaklama için toplam tutardır</li>
          <li>• Çocuk yaş sınırları otellere göre değişiklik gösterebilir</li>
          <li>• Rezervasyon için otelin iletişim bilgilerini kullanın</li>
          <li>• Fiyatlar anlık olarak hesaplanmış olup değişiklik gösterebilir</li>
        </ul>
      </div>
    </div>
  );
}