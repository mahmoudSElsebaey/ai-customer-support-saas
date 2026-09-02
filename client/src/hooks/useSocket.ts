import { useEffect, useState, useCallback } from "react";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useMeQuery } from "@/features/auth/authApi";

export function useSocket() {
  const { data: meData, isSuccess } = useMeQuery();
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isSuccess || !meData?.data) {
      disconnectSocket();
      setConnected(false);
      return;
    }

    const socket = connectSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onPresenceList = (payload: { onlineUserIds: string[] }) => {
      setOnlineUserIds(payload.onlineUserIds);
    };

    const onAgentOnline = (payload: { userId: string }) => {
      setOnlineUserIds((prev) =>
        prev.includes(payload.userId) ? prev : [...prev, payload.userId]
      );
    };

    const onAgentOffline = (payload: { userId: string }) => {
      setOnlineUserIds((prev) => prev.filter((id) => id !== payload.userId));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("presence:list", onPresenceList);
    socket.on("agent:online", onAgentOnline);
    socket.on("agent:offline", onAgentOffline);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("presence:list", onPresenceList);
      socket.off("agent:online", onAgentOnline);
      socket.off("agent:offline", onAgentOffline);
    };
  }, [isSuccess, meData?.data?.id]);

  const joinTicket = useCallback((ticketId: string) => {
    getSocket().emit("ticket:join", ticketId);
  }, []);

  const leaveTicket = useCallback((ticketId: string) => {
    getSocket().emit("ticket:leave", ticketId);
  }, []);

  const emitTypingStart = useCallback((ticketId: string) => {
    getSocket().emit("typing:start", { ticketId });
  }, []);

  const emitTypingStop = useCallback((ticketId: string) => {
    getSocket().emit("typing:stop", { ticketId });
  }, []);

  const emitMessageRead = useCallback(
    (ticketId: string, messageId: string) => {
      getSocket().emit("message:read", { ticketId, messageId });
    },
    []
  );

  return {
    connected,
    onlineUserIds,
    joinTicket,
    leaveTicket,
    emitTypingStart,
    emitTypingStop,
    emitMessageRead,
    socket: getSocket(),
  };
}
