// Price Calculation Algorithm

import { HotelPrice, RoomArrangement } from '@/types/hotel';
import { RoomArrangementOption } from './roomDistribution';
import { getDaysBetween, isDateInRange } from '@/lib/utils';

export interface PriceCalculationResult {
  concept: string;
  roomType?: string;
  totalPrice: number;
  pricePerNight: number;
  nights: number;
  roomArrangement: RoomArrangement[];
  isAvailable: boolean;
}

export function calculateHotelPrices(
  hotelId: number,
  checkIn: string,
  checkOut: string,
  roomArrangements: RoomArrangementOption[],
  hotelPrices: HotelPrice[]
): PriceCalculationResult[] {
  
  const results: PriceCalculationResult[] = [];
  const nights = getDaysBetween(checkIn, checkOut);
  
  // Get all unique room types and concepts for this hotel
  const availableRoomTypes = [...new Set(hotelPrices.filter(p => p.otel_id === hotelId).map(p => p.oda_tipi))];
  const availableConcepts = [...new Set(hotelPrices.filter(p => p.otel_id === hotelId).map(p => p.konsept))];
  
  // For each room type + concept combination
  for (const roomType of availableRoomTypes) {
    for (const concept of availableConcepts) {
      // Check if this combination has prices available
      const hasPrice = hotelPrices.some(p => 
        p.otel_id === hotelId && 
        p.oda_tipi === roomType && 
        p.konsept === concept &&
        isDateRangeOverlapping(checkIn, checkOut, p.tarih_baslangic, p.tarih_bitis)
      );
      
      if (!hasPrice) continue;
      
      // Find room arrangements that use this room type
      const compatibleArrangements = roomArrangements.filter(arrangement =>
        arrangement.rooms.every(room => room.roomType === roomType)
      );
      
      if (compatibleArrangements.length === 0) continue;
      
      let bestPrice: PriceCalculationResult | null = null;
      
      // Try each compatible arrangement
      for (const arrangement of compatibleArrangements) {
        const priceResult = calculatePriceForArrangement(
          hotelId,
          checkIn,
          checkOut,
          arrangement,
          concept,
          hotelPrices,
          nights,
          roomType
        );
        
        if (priceResult && (!bestPrice || priceResult.totalPrice < bestPrice.totalPrice)) {
          bestPrice = priceResult;
        }
      }
      
      if (bestPrice) {
        // Add room type info to the result
        bestPrice.roomType = roomType;
        results.push(bestPrice);
      }
    }
  }
  
  // Sort by total price (cheapest first)
  results.sort((a, b) => a.totalPrice - b.totalPrice);
  
  return results;
}

function getAvailableConcepts(
  hotelId: number,
  checkIn: string,
  checkOut: string,
  hotelPrices: HotelPrice[]
): string[] {
  
  const concepts = new Set<string>();
  
  // Find all prices that overlap with our date range
  const relevantPrices = hotelPrices.filter(price => 
    price.otel_id === hotelId &&
    isDateRangeOverlapping(checkIn, checkOut, price.tarih_baslangic, price.tarih_bitis)
  );
  
  relevantPrices.forEach(price => concepts.add(price.konsept));
  
  return Array.from(concepts);
}

function calculatePriceForArrangement(
  hotelId: number,
  checkIn: string,
  checkOut: string,
  arrangement: RoomArrangementOption,
  concept: string,
  hotelPrices: HotelPrice[],
  nights: number,
  specificRoomType?: string
): PriceCalculationResult | null {
  
  let totalPrice = 0;
  let allRoomsAvailable = true;
  
  // Calculate price for each room in the arrangement
  for (const room of arrangement.rooms) {
    // If specific room type is required, check compatibility
    if (specificRoomType && room.roomType !== specificRoomType) {
      allRoomsAvailable = false;
      break;
    }
    
    const roomPrice = calculateRoomPrice(
      hotelId,
      room.roomType,
      concept,
      checkIn,
      checkOut,
      hotelPrices,
      nights
    );
    
    if (!roomPrice.isAvailable) {
      allRoomsAvailable = false;
      break;
    }
    
    // Apply multiplier for this specific room configuration
    const roomMultiplier = arrangement.totalMultiplier / arrangement.rooms.length; // Distribute multiplier
    totalPrice += roomPrice.basePrice * roomMultiplier;
  }
  
  if (!allRoomsAvailable) {
    return null;
  }
  
  const pricePerNight = Math.round(totalPrice / nights);
  
  return {
    concept,
    roomType: specificRoomType,
    totalPrice: Math.round(totalPrice),
    pricePerNight,
    nights,
    roomArrangement: arrangement.rooms,
    isAvailable: true
  };
}

interface RoomPriceResult {
  basePrice: number;
  isAvailable: boolean;
}

function calculateRoomPrice(
  hotelId: number,
  roomType: string,
  concept: string,
  checkIn: string,
  checkOut: string,
  hotelPrices: HotelPrice[],
  nights: number
): RoomPriceResult {
  
  // Find all price periods for this room and concept
  const relevantPrices = hotelPrices.filter(price =>
    price.otel_id === hotelId &&
    price.oda_tipi === roomType &&
    price.konsept === concept
  );
  
  if (relevantPrices.length === 0) {
    return { basePrice: 0, isAvailable: false };
  }
  
  // Calculate total price across all date periods
  let totalPrice = 0;
  let coveredNights = 0;
  
  // Split the stay into periods based on price changes
  const pricePeriods = calculatePricePeriods(checkIn, checkOut, relevantPrices);
  
  for (const period of pricePeriods) {
    if (!period.price) {
      // No price available for this period
      return { basePrice: 0, isAvailable: false };
    }
    
    const periodNights = getDaysBetween(period.startDate, period.endDate);
    totalPrice += period.price.fiyat * periodNights;
    coveredNights += periodNights;
  }
  
  // Check if entire stay is covered
  if (coveredNights < nights) {
    return { basePrice: 0, isAvailable: false };
  }
  
  return {
    basePrice: totalPrice,
    isAvailable: true
  };
}

interface PricePeriod {
  startDate: string;
  endDate: string;
  price: HotelPrice | null;
}

function calculatePricePeriods(
  checkIn: string,
  checkOut: string,
  relevantPrices: HotelPrice[]
): PricePeriod[] {
  
  const periods: PricePeriod[] = [];
  let currentDate = checkIn;
  
  while (currentDate < checkOut) {
    // Find price for current date
    const currentPrice = relevantPrices.find(price =>
      isDateInRange(currentDate, price.tarih_baslangic, price.tarih_bitis)
    );
    
    if (!currentPrice) {
      // No price found - create period until next price or end
      const nextPriceStart = findNextPriceStart(currentDate, relevantPrices);
      const periodEnd = nextPriceStart && nextPriceStart < checkOut ? nextPriceStart : checkOut;
      
      periods.push({
        startDate: currentDate,
        endDate: periodEnd,
        price: null
      });
      
      currentDate = periodEnd;
    } else {
      // Price found - create period until price ends or checkout
      const periodEnd = currentPrice.tarih_bitis < checkOut ? currentPrice.tarih_bitis : checkOut;
      
      periods.push({
        startDate: currentDate,
        endDate: periodEnd,
        price: currentPrice
      });
      
      currentDate = periodEnd;
    }
  }
  
  return periods;
}

function findNextPriceStart(currentDate: string, prices: HotelPrice[]): string | null {
  const futurePrices = prices
    .filter(price => price.tarih_baslangic > currentDate)
    .sort((a, b) => a.tarih_baslangic.localeCompare(b.tarih_baslangic));
  
  return futurePrices.length > 0 ? futurePrices[0].tarih_baslangic : null;
}

function isDateRangeOverlapping(
  checkIn: string,
  checkOut: string,
  priceStart: string,
  priceEnd: string
): boolean {
  return checkIn < priceEnd && checkOut > priceStart;
}

// Utility function to get the best price option for a hotel
export function getBestPriceForHotel(
  priceResults: PriceCalculationResult[]
): PriceCalculationResult | null {
  
  if (priceResults.length === 0) {
    return null;
  }
  
  // Return the cheapest available option
  return priceResults.find(result => result.isAvailable) || null;
}