import type { Types } from "mongoose";

/** Convert ObjectId or string to plain string id. */
export function toId(
  value: Types.ObjectId | string | null | undefined
): string | null {
  if (value == null) return null;
  return typeof value === "string" ? value : value.toString();
}

/**
 * Normalize a lean/document object so API consumers always get `id`
 * instead of `_id`, and nested refs are stringified.
 */
export function serializeDoc<T extends Record<string, unknown>>(
  doc: T | null | undefined
): (Omit<T, "_id" | "__v"> & { id: string }) | null {
  if (!doc) return null;

  const raw = { ...doc } as Record<string, unknown>;
  const id =
    toId(raw._id as Types.ObjectId | string | undefined) ??
    (typeof raw.id === "string" ? raw.id : null);

  delete raw._id;
  delete raw.__v;

  if (id) {
    raw.id = id;
  }

  // Common foreign keys
  for (const key of [
    "organizationId",
    "customerId",
    "assignedAgentId",
    "senderId",
    "authorId",
    "userId",
    "ticketId",
  ]) {
    if (key in raw && raw[key] != null) {
      const v = raw[key];
      if (typeof v === "object" && v !== null && "_id" in (v as object)) {
        // populated document — leave as-is; caller may serialize nested
        continue;
      }
      raw[key] = toId(v as Types.ObjectId | string);
    }
  }

  return raw as Omit<T, "_id" | "__v"> & { id: string };
}

export function serializeDocs<T extends Record<string, unknown>>(
  docs: (T | null | undefined)[]
): NonNullable<ReturnType<typeof serializeDoc<T>>>[] {
  return docs
    .map((d) => serializeDoc(d))
    .filter((d): d is NonNullable<typeof d> => d != null);
}
