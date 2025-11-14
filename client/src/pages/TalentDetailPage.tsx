import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { fetchTalentById } from "@/api/talents";
import { createReservation } from "@/api/reservations";
import { sendMessage } from "@/api/messages";
import { useAuth } from "@/contexts/AuthContext";

export default function TalentDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [requestNote, setRequestNote] = useState("");

  const talentId = Number(params.id);

  const { data: talent, isLoading } = useQuery({
    queryKey: ["talent", talentId],
    queryFn: () => fetchTalentById(talentId),
    enabled: Number.isFinite(talentId),
  });

  const messageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      setMessage("");
      alert("메시지를 전송했습니다.");
    },
  });

  const reservationMutation = useMutation({
    mutationFn: createReservation,
    onSuccess: () => {
      setRequestNote("");
      alert("예약 요청이 전송되었습니다.");
    },
  });

  if (!Number.isFinite(talentId)) {
    return <p>잘못된 재능 ID입니다.</p>;
  }

  if (isLoading || !talent) {
    return <p>불러오는 중...</p>;
  }

  const isOwner = user?.id === talent.ownerId;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          {talent.imageUrl ? (
            <img src={talent.imageUrl} alt={talent.title} className="w-full rounded-lg" />
          ) : (
            <div className="flex h-60 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              이미지가 없습니다.
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>카테고리: {talent.category}</span>
            <span>등록자: {talent.owner.name}</span>
          </div>
          <h1 className="text-2xl font-semibold">{talent.title}</h1>
          <p className="whitespace-pre-wrap text-slate-700">{talent.description}</p>
          <div className="flex flex-wrap gap-2 text-sm text-primary">
            {talent.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
              .map((tag) => (
                <span key={tag} className="rounded-full bg-primary/10 px-2 py-1">
                  #{tag}
                </span>
              ))}
          </div>
        </div>
      </section>
      <aside className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">연락하기</h2>
          {isOwner ? (
            <p className="mt-2 text-sm text-slate-500">본인 재능에는 메시지를 보낼 수 없습니다.</p>
          ) : user ? (
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!message.trim()) return;
                messageMutation.mutate({ talentId, content: message });
              }}
            >
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                placeholder="메시지를 입력하세요"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={messageMutation.isPending}
                className="w-full rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {messageMutation.isPending ? "전송 중..." : "DM 보내기"}
              </button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-slate-500">로그인 후 메시지를 보낼 수 있습니다.</p>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">예약 요청</h2>
          {isOwner ? (
            <p className="mt-2 text-sm text-slate-500">본인 재능에는 예약을 신청할 수 없습니다.</p>
          ) : user ? (
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                reservationMutation.mutate({ talentId, message: requestNote });
              }}
            >
              <textarea
                value={requestNote}
                onChange={(event) => setRequestNote(event.target.value)}
                rows={4}
                placeholder="요청 내용을 입력하세요"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={reservationMutation.isPending || !talent.available}
                className="w-full rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {talent.available ? (reservationMutation.isPending ? "요청 중..." : "예약 요청") : "예약 불가"}
              </button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-slate-500">로그인 후 예약을 요청할 수 있습니다.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
