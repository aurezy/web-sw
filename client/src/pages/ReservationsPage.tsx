import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchReservations, updateReservationStatus } from "@/api/reservations";

export default function ReservationsPage() {
  const [role, setRole] = useState<"owner" | "requester">("owner");

  const reservationsQuery = useQuery({
    queryKey: ["reservations", role],
    queryFn: () => fetchReservations(role),
  });

  const updateMutation = useMutation({
    mutationFn: updateReservationStatus,
    onSuccess: () => {
      reservationsQuery.refetch();
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">예약 현황</h1>
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            onClick={() => setRole("owner")}
            className={`rounded px-3 py-2 font-medium ${role === "owner" ? "bg-primary text-white" : "border border-slate-200"}`}
          >
            내 재능에 온 요청
          </button>
          <button
            type="button"
            onClick={() => setRole("requester")}
            className={`rounded px-3 py-2 font-medium ${role === "requester" ? "bg-primary text-white" : "border border-slate-200"}`}
          >
            내가 요청한 예약
          </button>
        </div>
      </header>

      <section className="space-y-4">
        {reservationsQuery.data?.map((reservation) => (
          <article key={reservation.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{reservation.talent.title}</h2>
                <p className="text-sm text-slate-500">상태: {reservation.status}</p>
              </div>
              <p className="text-xs text-slate-400">요청일: {new Date(reservation.requestedAt).toLocaleString()}</p>
            </div>
            {reservation.message && (
              <p className="mt-3 rounded bg-slate-100 px-3 py-2 text-sm text-slate-700">{reservation.message}</p>
            )}
            {role === "owner" && reservation.status === "PENDING" && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => updateMutation.mutate({ id: reservation.id, status: "ACCEPTED" })}
                  className="rounded bg-primary px-3 py-2 text-sm font-medium text-white"
                >
                  수락
                </button>
                <button
                  type="button"
                  onClick={() => updateMutation.mutate({ id: reservation.id, status: "DECLINED" })}
                  className="rounded border border-red-400 px-3 py-2 text-sm font-medium text-red-500"
                >
                  거절
                </button>
              </div>
            )}
          </article>
        ))}
        {reservationsQuery.data?.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            예약 내역이 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
