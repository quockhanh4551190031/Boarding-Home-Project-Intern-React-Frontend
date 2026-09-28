import axiosClient from "./axiosClient";
import type { Profile, ProfileFormData } from "../types/profile";

// Backend validate phone bằng regex nên chuỗi rỗng "" sẽ bị từ chối —
// chuyển mọi trường trống thành null trước khi gửi
const emptyToNull = (v: string) => (v.trim() === "" ? null : v.trim());

export const profileApi = {
  getMine: async (): Promise<Profile> => {
    const res = await axiosClient.get<Profile>("/users/me/profile");
    return res.data;
  },

  update: async (data: ProfileFormData): Promise<Profile> => {
    const payload = {
      fullName: data.fullName.trim(),
      phone: emptyToNull(data.phone),
      gender: data.gender === "" ? null : data.gender,
      dateOfBirth: emptyToNull(data.dateOfBirth),
      address: emptyToNull(data.address),
      identityNumber: emptyToNull(data.identityNumber),
      bio: emptyToNull(data.bio),
    };
    const res = await axiosClient.put<Profile>("/users/me/profile", payload);
    return res.data;
  },
};