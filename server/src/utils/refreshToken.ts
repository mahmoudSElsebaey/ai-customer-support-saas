import { createHash } from "crypto";

/**
 * Store only a deterministic digest of refresh tokens. A database leak must not
 * give an attacker a bearer credential they can present to the refresh route.
 */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
