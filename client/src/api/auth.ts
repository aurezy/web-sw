import api from "./client";

export type User = {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string | null;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export const register = async (payload: {
  email: string;
  password: string;
  name: string;
  avatarUrl?: string;
}) => {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
};

export const login = async (payload: { email: string; password: string }) => {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
};
