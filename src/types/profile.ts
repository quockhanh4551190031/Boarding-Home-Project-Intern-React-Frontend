export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface Profile {
  email: string;
  role: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  gender: Gender | null;
  dateOfBirth: string | null; // định dạng YYYY-MM-DD
  address: string | null;
  identityNumber: string | null;
  bio: string | null;
  profileCompleted: boolean;
}

export interface ProfileFormData {
  fullName: string;
  phone: string;
  gender: Gender | "";
  dateOfBirth: string;
  address: string;
  identityNumber: string;
  bio: string;
}