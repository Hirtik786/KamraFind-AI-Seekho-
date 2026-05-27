
export type AccommodationType = 'Hostel' | 'Sharing Flat' | 'Single Room' | 'Full Apartment' | 'Any';
export type GenderPreference = 'Boys' | 'Girls' | 'Any';
export type UtilitiesType = 'Yes' | 'No' | 'Partial';

export interface Listing {
  id: string;
  title: string;
  type: AccommodationType;
  area: string;
  university: string;
  rent: number;
  securityDeposit: number;
  gender: GenderPreference;
  mealsIncluded: boolean;
  utilities: UtilitiesType;
  seatsAvailable: number;
  totalRoommates: number;
  wifi: boolean;
  ac: boolean;
  description: string;
  contactName: string;
  whatsappNumber: string;
  moveInDate: string;
  ownerId: string;
  imageUrl?: string;
  images?: string[];
  createdAt: number;
  
  // Extended UI/UX properties for advanced filters
  rating?: number;
  verified?: boolean;
  furnished?: boolean;
  attachedBath?: boolean;
  parking?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  listings?: Listing[];
}
