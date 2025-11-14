import api from "./client";

export type Conversation = {
  id: number;
  talentId: number;
  senderId: number;
  createdAt: string;
  talent: {
    id: number;
    title: string;
    ownerId: number;
  };
  messages: Array<{
    id: number;
    content: string;
    createdAt: string;
  }>;
};

export type ConversationDetail = {
  conversation: {
    id: number;
    talentId: number;
    senderId: number;
    createdAt: string;
    talent: {
      id: number;
      title: string;
      ownerId: number;
    };
  };
  messages: Array<{
    id: number;
    senderId: number;
    content: string;
    createdAt: string;
  }>;
};

export const fetchConversations = async () => {
  const { data } = await api.get<Conversation[]>("/messages/conversations");
  return data;
};

export const fetchConversationDetail = async (conversationId: number) => {
  const { data } = await api.get<ConversationDetail>(
    `/messages/conversations/${conversationId}/messages`,
  );
  return data;
};

export const sendMessage = async (payload: {
  talentId: number;
  content: string;
}) => {
  const { data } = await api.post<{ conversationId: number } & { message: { id: number } }>(
    `/messages/talents/${payload.talentId}/messages`,
    {
      content: payload.content,
    },
  );
  return data;
};

export const acknowledgeNotification = async (conversationId: number) => {
  await api.post(`/messages/conversations/${conversationId}/notify`);
};
