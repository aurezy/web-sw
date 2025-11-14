import api from "./client";

export type Reservation = {
  id: number;
  talentId: number;
  requesterId: number;
  message?: string | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  requestedAt: string;
  notifiedAt?: string | null;
  talent: {
    id: number;
    title: string;
    category: string;
  };
  requester?: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
};

export const fetchReservations = async (role: "owner" | "requester") => {
  const { data } = await api.get<Reservation[]>("/reservations", {
    params: { role },
  });
  return data;
};

export const createReservation = async (payload: {
  talentId: number;
  message?: string;
}) => {
  const { data } = await api.post(`/reservations/talents/${payload.talentId}`, {
    message: payload.message,
  });
  return data;
};

export const updateReservationStatus = async (payload: {
  id: number;
  status: "ACCEPTED" | "DECLINED";
}) => {
  const { data } = await api.patch(`/reservations/${payload.id}/status`, {
    status: payload.status,
  });
  return data;
};
