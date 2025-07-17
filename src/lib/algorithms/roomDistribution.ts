// Room Distribution Algorithm

import { RoomMultiplier, RoomArrangement } from '@/types/hotel';
import { categorizeChildren } from '@/lib/utils';

export interface RoomDistributionResult {
  isValid: boolean;
  arrangements: RoomArrangementOption[];
  totalRooms: number;
}

export interface RoomArrangementOption {
  rooms: RoomArrangement[];
  totalMultiplier: number;
  totalRooms: number;
}

export function findOptimalRoomDistribution(
  adults: number,
  childrenAges: number[],
  hotelMultipliers: RoomMultiplier[]
): RoomDistributionResult {
  
  // Get unique room types for this hotel
  const roomTypes = [...new Set(hotelMultipliers.map(m => m.oda_tipi))];
  
  // Find all possible room arrangements
  const allArrangements: RoomArrangementOption[] = [];
  
  // For each room type, try different combinations
  for (const roomType of roomTypes) {
    const roomMultipliersForType = hotelMultipliers.filter(m => m.oda_tipi === roomType);
    
    // Try to distribute guests across multiple rooms of this type
    const arrangements = distributeGuestsAcrossRooms(adults, childrenAges, roomMultipliersForType, roomType);
    allArrangements.push(...arrangements);
  }
  
  // Try mixed room type arrangements (for larger groups)
  if (adults + childrenAges.length > 4) {
    const mixedArrangements = findMixedRoomArrangements(adults, childrenAges, hotelMultipliers, roomTypes);
    allArrangements.push(...mixedArrangements);
  }
  
  if (allArrangements.length === 0) {
    return {
      isValid: false,
      arrangements: [],
      totalRooms: 0
    };
  }
  
  // Sort by total multiplier (lowest first = cheapest)
  allArrangements.sort((a, b) => a.totalMultiplier - b.totalMultiplier);
  
  return {
    isValid: true,
    arrangements: allArrangements,
    totalRooms: allArrangements[0].totalRooms
  };
}

function distributeGuestsAcrossRooms(
  adults: number,
  childrenAges: number[],
  roomMultipliers: RoomMultiplier[],
  roomType: string
): RoomArrangementOption[] {
  
  const arrangements: RoomArrangementOption[] = [];
  
  // Try single room first
  const singleRoomArrangement = trySingleRoom(adults, childrenAges, roomMultipliers, roomType);
  if (singleRoomArrangement) {
    arrangements.push(singleRoomArrangement);
  }
  
  // Try multiple rooms if single room doesn't work or for larger groups
  if (!singleRoomArrangement || adults + childrenAges.length > 4) {
    const multiRoomArrangements = tryMultipleRooms(adults, childrenAges, roomMultipliers, roomType);
    arrangements.push(...multiRoomArrangements);
  }
  
  return arrangements;
}

function trySingleRoom(
  adults: number,
  childrenAges: number[],
  roomMultipliers: RoomMultiplier[],
  roomType: string
): RoomArrangementOption | null {
  
  for (const multiplier of roomMultipliers) {
    // Check if this room configuration can accommodate our guests
    if (multiplier.yetiskin_sayisi < adults) continue;
    
    // Categorize children based on age ranges
    const ageRanges = [
      multiplier.birinci_cocuk_yas_araligi,
      multiplier.ikinci_cocuk_yas_araligi,
      multiplier.ucuncu_cocuk_yas_araligi
    ].filter(range => range > 0);
    
    const { validChildren, adultsFromChildren } = categorizeChildren(childrenAges, ageRanges);
    const totalAdults = adults + adultsFromChildren.length;
    
    // Check if room can accommodate total adults
    if (multiplier.yetiskin_sayisi < totalAdults) continue;
    
    // Check if room can accommodate children
    if (multiplier.cocuk_sayisi < validChildren.length) continue;
    
    // Validate children fit in age ranges
    if (!validateChildrenInAgeRanges(validChildren, ageRanges)) continue;
    
    // Valid arrangement found
    return {
      rooms: [{
        roomType: roomType,
        adults: totalAdults,
        children: validChildren.length,
        childrenAges: validChildren
      }],
      totalMultiplier: multiplier.carpan,
      totalRooms: 1
    };
  }
  
  return null;
}

function tryMultipleRooms(
  adults: number,
  childrenAges: number[],
  roomMultipliers: RoomMultiplier[],
  roomType: string
): RoomArrangementOption[] {
  
  const arrangements: RoomArrangementOption[] = [];
  
  // Try 2 rooms configuration
  const twoRoomArrangements = tryTwoRooms(adults, childrenAges, roomMultipliers, roomType);
  arrangements.push(...twoRoomArrangements);
  
  // Try 3 rooms if needed for larger groups
  if (adults + childrenAges.length > 8) {
    const threeRoomArrangements = tryThreeRooms(adults, childrenAges, roomMultipliers, roomType);
    arrangements.push(...threeRoomArrangements);
  }
  
  return arrangements;
}

function tryTwoRooms(
  adults: number,
  childrenAges: number[],
  roomMultipliers: RoomMultiplier[],
  roomType: string
): RoomArrangementOption[] {
  
  const arrangements: RoomArrangementOption[] = [];
  
  // Each room must have at least 1 adult
  if (adults < 2) return arrangements;
  
  // Try different adult distributions
  for (let adultsRoom1 = 1; adultsRoom1 < adults; adultsRoom1++) {
    const adultsRoom2 = adults - adultsRoom1;
    
    // Try different children distributions
    for (let childrenRoom1 = 0; childrenRoom1 <= childrenAges.length; childrenRoom1++) {
      const childrenRoom2 = childrenAges.length - childrenRoom1;
      
      const childrenAgesRoom1 = childrenAges.slice(0, childrenRoom1);
      const childrenAgesRoom2 = childrenAges.slice(childrenRoom1);
      
      // Find room configurations for both rooms
      const room1Config = findRoomConfig(adultsRoom1, childrenAgesRoom1, roomMultipliers);
      const room2Config = findRoomConfig(adultsRoom2, childrenAgesRoom2, roomMultipliers);
      
      if (room1Config && room2Config) {
        arrangements.push({
          rooms: [
            {
              roomType: roomType,
              adults: room1Config.totalAdults,
              children: room1Config.validChildren.length,
              childrenAges: room1Config.validChildren
            },
            {
              roomType: roomType,
              adults: room2Config.totalAdults,
              children: room2Config.validChildren.length,
              childrenAges: room2Config.validChildren
            }
          ],
          totalMultiplier: room1Config.multiplier + room2Config.multiplier,
          totalRooms: 2
        });
      }
    }
  }
  
  return arrangements;
}

function tryThreeRooms(
  adults: number,
  childrenAges: number[],
  roomMultipliers: RoomMultiplier[],
  roomType: string
): RoomArrangementOption[] {
  
  const arrangements: RoomArrangementOption[] = [];
  
  // Each room must have at least 1 adult
  if (adults < 3) return arrangements;
  
  // Try different adult distributions (simplified for 3 rooms)
  for (let adultsRoom1 = 1; adultsRoom1 <= adults - 2; adultsRoom1++) {
    for (let adultsRoom2 = 1; adultsRoom2 <= adults - adultsRoom1 - 1; adultsRoom2++) {
      const adultsRoom3 = adults - adultsRoom1 - adultsRoom2;
      
      if (adultsRoom3 < 1) continue;
      
      // Simple children distribution (can be enhanced)
      const childrenPerRoom = Math.floor(childrenAges.length / 3);
      const extraChildren = childrenAges.length % 3;
      
      const childrenAgesRoom1 = childrenAges.slice(0, childrenPerRoom + (extraChildren > 0 ? 1 : 0));
      const childrenAgesRoom2 = childrenAges.slice(childrenAgesRoom1.length, childrenAgesRoom1.length + childrenPerRoom + (extraChildren > 1 ? 1 : 0));
      const childrenAgesRoom3 = childrenAges.slice(childrenAgesRoom1.length + childrenAgesRoom2.length);
      
      // Find room configurations
      const room1Config = findRoomConfig(adultsRoom1, childrenAgesRoom1, roomMultipliers);
      const room2Config = findRoomConfig(adultsRoom2, childrenAgesRoom2, roomMultipliers);
      const room3Config = findRoomConfig(adultsRoom3, childrenAgesRoom3, roomMultipliers);
      
      if (room1Config && room2Config && room3Config) {
        arrangements.push({
          rooms: [
            {
              roomType: roomType,
              adults: room1Config.totalAdults,
              children: room1Config.validChildren.length,
              childrenAges: room1Config.validChildren
            },
            {
              roomType: roomType,
              adults: room2Config.totalAdults,
              children: room2Config.validChildren.length,
              childrenAges: room2Config.validChildren
            },
            {
              roomType: roomType,
              adults: room3Config.totalAdults,
              children: room3Config.validChildren.length,
              childrenAges: room3Config.validChildren
            }
          ],
          totalMultiplier: room1Config.multiplier + room2Config.multiplier + room3Config.multiplier,
          totalRooms: 3
        });
      }
    }
  }
  
  return arrangements;
}

function findMixedRoomArrangements(
  adults: number,
  childrenAges: number[],
  hotelMultipliers: RoomMultiplier[],
  roomTypes: string[]
): RoomArrangementOption[] {
  
  // This is a simplified version - can be enhanced for complex mixed arrangements
  const arrangements: RoomArrangementOption[] = [];
  
  // Try combinations of different room types
  // For now, we'll implement a basic version
  
  return arrangements;
}

interface RoomConfig {
  totalAdults: number;
  validChildren: number[];
  multiplier: number;
}

function findRoomConfig(
  adults: number,
  childrenAges: number[],
  roomMultipliers: RoomMultiplier[]
): RoomConfig | null {
  
  for (const multiplier of roomMultipliers) {
    if (multiplier.yetiskin_sayisi < adults) continue;
    
    const ageRanges = [
      multiplier.birinci_cocuk_yas_araligi,
      multiplier.ikinci_cocuk_yas_araligi,
      multiplier.ucuncu_cocuk_yas_araligi
    ].filter(range => range > 0);
    
    const { validChildren, adultsFromChildren } = categorizeChildren(childrenAges, ageRanges);
    const totalAdults = adults + adultsFromChildren.length;
    
    if (multiplier.yetiskin_sayisi < totalAdults) continue;
    if (multiplier.cocuk_sayisi < validChildren.length) continue;
    if (!validateChildrenInAgeRanges(validChildren, ageRanges)) continue;
    
    return {
      totalAdults,
      validChildren,
      multiplier: multiplier.carpan
    };
  }
  
  return null;
}

function validateChildrenInAgeRanges(childrenAges: number[], ageRanges: number[]): boolean {
  // Simple validation - can be enhanced for more complex age range matching
  return childrenAges.length <= ageRanges.length;
}