// Utility Functions

import { Hotel, RoomMultiplier, HotelPrice } from '@/types/hotel';
import hotelsData from './data/hotels.json';
import carpanlarData from './data/carpanlar.json';
import fiyatlarData from './data/fiyatlar.json';

// Data loaders
export function getHotels(): Hotel[] {
  return hotelsData as Hotel[];
}

export function getRoomMultipliers(): RoomMultiplier[] {
  return carpanlarData as RoomMultiplier[];
}

export function getHotelPrices(): HotelPrice[] {
  return fiyatlarData as HotelPrice[];
}

// Date utilities
export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getDaysBetween(startDate: string, endDate: string): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isDateInRange(date: string, startRange: string, endRange: string): boolean {
  const checkDate = parseDate(date);
  const rangeStart = parseDate(startRange);
  const rangeEnd = parseDate(endRange);
  
  return checkDate >= rangeStart && checkDate <= rangeEnd;
}

// Child age utilities
export function isChildInAgeRange(childAge: number, ageRange: number): boolean {
  if (ageRange === 0) return false;
  return childAge <= ageRange;
}

export function categorizeChildren(childrenAges: number[], ageRanges: number[]): {
  validChildren: number[];
  adultsFromChildren: number[];
} {
  const validChildren: number[] = [];
  const adultsFromChildren: number[] = [];
  
  childrenAges.forEach(age => {
    // Check if child fits in any of the age ranges
    const fitsInRange = ageRanges.some(range => range > 0 && age <= range);
    
    if (fitsInRange) {
      validChildren.push(age);
    } else {
      adultsFromChildren.push(age);
    }
  });
  
  return { validChildren, adultsFromChildren };
}

// Price calculation utilities
export function calculateTotalPrice(basePrice: number, multiplier: number, nights: number): number {
  return Math.round(basePrice * multiplier * nights);
}

// Validation utilities
export function validateSearchParams(checkIn: string, checkOut: string, adults: number, children: number[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Date validation
  const checkInDate = parseDate(checkIn);
  const checkOutDate = parseDate(checkOut);
  const today = new Date();
  
  if (checkInDate <= today) {
    errors.push('Giriş tarihi bugünden sonra olmalıdır');
  }
  
  if (checkOutDate <= checkInDate) {
    errors.push('Çıkış tarihi giriş tarihinden sonra olmalıdır');
  }
  
  // Guest validation
  if (adults < 1) {
    errors.push('En az 1 yetişkin olmalıdır');
  }
  
  if (children.length > 0) {
    children.forEach((age, index) => {
      if (age < 0 || age > 17) {
        errors.push(`${index + 1}. çocuğun yaşı 0-17 arasında olmalıdır`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}