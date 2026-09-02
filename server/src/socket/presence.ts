/**
 * In-memory presence tracker (org-scoped).
 * For multi-instance production, replace with Redis later.
 */

const onlineByOrg = new Map<string, Map<string, { name: string; sockets: Set<string> }>>();

export function addPresence(
  organizationId: string,
  userId: string,
  name: string,
  socketId: string
): boolean {
  if (!onlineByOrg.has(organizationId)) {
    onlineByOrg.set(organizationId, new Map());
  }
  const orgMap = onlineByOrg.get(organizationId)!;

  if (!orgMap.has(userId)) {
    orgMap.set(userId, { name, sockets: new Set([socketId]) });
    return true; // newly online
  }

  orgMap.get(userId)!.sockets.add(socketId);
  return false;
}

export function removePresence(
  organizationId: string,
  userId: string,
  socketId: string
): boolean {
  const orgMap = onlineByOrg.get(organizationId);
  if (!orgMap) return false;

  const entry = orgMap.get(userId);
  if (!entry) return false;

  entry.sockets.delete(socketId);

  if (entry.sockets.size === 0) {
    orgMap.delete(userId);
    if (orgMap.size === 0) onlineByOrg.delete(organizationId);
    return true; // fully offline
  }

  return false;
}

export function getOnlineUserIds(organizationId: string): string[] {
  const orgMap = onlineByOrg.get(organizationId);
  if (!orgMap) return [];
  return Array.from(orgMap.keys());
}
