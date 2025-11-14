import api from "./client";

export type Talent = {
  id: number;
  title: string;
  description: string;
  imageUrl?: string | null;
  category: string;
  tags: string;
  available: boolean;
  ownerId: number;
  createdAt: string;
  owner: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
};

export const fetchTalents = async (params?: {
  q?: string;
  category?: string;
  tag?: string;
}) => {
  const { data } = await api.get<Talent[]>("/talents", { params });
  return data;
};

export const fetchTalentById = async (id: number) => {
  const { data } = await api.get<Talent>(`/talents/${id}`);
  return data;
};

export const createTalent = async (payload: {
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  available: boolean;
}) => {
  const { data } = await api.post<Talent>("/talents", payload);
  return data;
};

export const updateTalent = async (
  id: number,
  payload: Partial<{
    title: string;
    description: string;
    imageUrl: string;
    category: string;
    tags: string[];
    available: boolean;
  }>,
) => {
  const { data } = await api.patch<Talent>(`/talents/${id}`, payload);
  return data;
};

export const deleteTalent = async (id: number) => {
  await api.delete(`/talents/${id}`);
};
