import type { Role } from "@prisma/client";

export interface SocketUser {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
  name: string;
}

export interface ServerToClientEvents {
  "message:created": (payload: {
    ticketId: string;
    message: unknown;
  }) => void;
  "message:read": (payload: {
    ticketId: string;
    messageId: string;
    readAt: string;
  }) => void;
  "ticket:created": (payload: { ticket: unknown }) => void;
  "ticket:updated": (payload: { ticket: unknown }) => void;
  "ticket:assigned": (payload: {
    ticketId: string;
    assignedAgentId: string | null;
  }) => void;
  "typing:start": (payload: {
    ticketId: string;
    userId: string;
    name: string;
  }) => void;
  "typing:stop": (payload: {
    ticketId: string;
    userId: string;
  }) => void;
  "agent:online": (payload: {
    userId: string;
    name: string;
    organizationId: string;
  }) => void;
  "agent:offline": (payload: {
    userId: string;
    organizationId: string;
  }) => void;
  "notification:new": (payload: {
    id: string;
    type: string;
    title: string;
    body?: string;
    data?: unknown;
  }) => void;
  "presence:list": (payload: {
    onlineUserIds: string[];
  }) => void;
}

export interface ClientToServerEvents {
  "ticket:join": (ticketId: string) => void;
  "ticket:leave": (ticketId: string) => void;
  "typing:start": (payload: { ticketId: string }) => void;
  "typing:stop": (payload: { ticketId: string }) => void;
  "message:read": (payload: { ticketId: string; messageId: string }) => void;
  "presence:ping": () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: SocketUser;
}
