// Hotel Type Definitions

export interface Hotel {
  otel_id: number;
  otel_adi: string;
  otel_lokasyon: string;
  otel_sitesi: string;
  otel_no: string;
  otel_whatsapp: string;
  otel_info: string;
}

export interface RoomMultiplier {
  otel_id: number;
  oda_tipi: string;
  yetiskin_sayisi: number;
  cocuk_sayisi: number;
  birinci_cocuk_yas_araligi: number;
  ikinci_cocuk_yas_araligi: number;
  ucuncu_cocuk_yas_araligi: number;
  carpan: number;
}

export interface HotelPrice {
  otel_id: number;
  oda_tipi: string;
  tarih_baslangic: string;
  tarih_bitis: string;
  konsept: string;
  fiyat: number;
  para_birimi: string;
}

export interface SearchRequest {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number[];
}

export interface RoomArrangement {
  roomType: string;
  adults: number;
  children: number;
  childrenAges: number[];
}

export interface HotelResult {
  hotelName: string;
  city: string;
  roomType?: string;
  totalRooms: number;
  concept: string;
  totalPrice: number;
  pricePerNight: number;
  nights: number;
  roomArrangement: RoomArrangement[];
}

export interface SearchResponse {
  searchParams: {
    checkIn: string;
    checkOut: string;
    totalAdults: number;
    totalChildren: number;
    childrenAges: string;
  };
  hotels: HotelResult[];
}