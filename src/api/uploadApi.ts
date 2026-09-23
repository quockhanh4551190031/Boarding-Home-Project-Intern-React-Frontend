import axiosClient from "./axiosClient";

export const uploadApi = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axiosClient.post<{ url: string }>("/uploads/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url;
  },
};