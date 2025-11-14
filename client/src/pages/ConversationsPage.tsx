import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchConversations, fetchConversationDetail, acknowledgeNotification } from "@/api/messages";
import { sendMessage } from "@/api/messages";
import { useAuth } from "@/contexts/AuthContext";

export default function ConversationsPage() {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [content, setContent] = useState("");

  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
  });

  const detailQuery = useQuery({
    queryKey: ["conversation", selectedId],
    queryFn: () => fetchConversationDetail(selectedId!),
    enabled: selectedId !== null,
  });

  useEffect(() => {
    if (!selectedId && conversationsQuery.data?.length) {
      setSelectedId(conversationsQuery.data[0].id);
    }
  }, [conversationsQuery.data, selectedId]);

  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      setContent("");
      detailQuery.refetch();
      conversationsQuery.refetch();
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeNotification,
    onSuccess: () => {
      conversationsQuery.refetch();
    },
  });

  const selectedConversation = conversationsQuery.data?.find((item) => item.id === selectedId);
  const isOwner = selectedConversation && selectedConversation.talent.ownerId === user?.id;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr,2fr]">
      <aside className="h-[600px] overflow-y-auto rounded-lg border border-slate-200 bg-white">
        <h2 className="border-b border-slate-200 px-4 py-3 text-lg font-semibold">대화 목록</h2>
        <ul className="divide-y divide-slate-100">
          {conversationsQuery.data?.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => setSelectedId(conversation.id)}
                className={`w-full px-4 py-3 text-left text-sm ${selectedId === conversation.id ? "bg-primary/10" : "hover:bg-slate-100"}`}
              >
                <p className="font-medium">{conversation.talent.title}</p>
                <p className="text-xs text-slate-500">최근 메시지: {conversation.messages[0]?.content ?? "없음"}</p>
              </button>
            </li>
          ))}
          {conversationsQuery.data?.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-500">대화가 없습니다.</li>
          )}
        </ul>
      </aside>
      <section className="flex h-[600px] flex-col rounded-lg border border-slate-200 bg-white">
        {selectedId && detailQuery.data ? (
          <>
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{detailQuery.data.conversation.talent.title}</p>
                <p className="text-xs text-slate-500">대화 ID: {detailQuery.data.conversation.id}</p>
              </div>
              <button
                type="button"
                onClick={() => acknowledgeMutation.mutate(selectedId)}
                className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                알림 확인
              </button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {detailQuery.data.messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-lg px-3 py-2 text-sm ${message.senderId === user?.id ? "bg-primary text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  {message.content}
                </div>
              ))}
              {detailQuery.data.messages.length === 0 && (
                <p className="text-center text-sm text-slate-500">아직 메시지가 없습니다.</p>
              )}
            </div>
            <form
              className="border-t border-slate-200 p-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!content.trim()) return;
                sendMutation.mutate({ talentId: detailQuery.data!.conversation.talentId, content });
              }}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="메시지 입력"
                  className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sendMutation.isPending}
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  보내기
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            대화를 선택해주세요.
          </div>
        )}
      </section>
    </div>
  );
}
