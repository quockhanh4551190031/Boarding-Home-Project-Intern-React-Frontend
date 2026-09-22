export interface BoardingHouse {
  id: number;
  name: string;
  address: string;
  ward: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
  status: "ACTIVE" | "HIDDEN" | "DELETED";
  roomCount: number;
  createdAt: string;
}

export interface HouseFormData {
  name: string;
  address: string;
  ward: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
}