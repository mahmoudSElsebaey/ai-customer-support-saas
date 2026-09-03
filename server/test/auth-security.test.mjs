import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("refresh token hashing is deterministic and never returns the bearer token", async () => {
  const { hashRefreshToken } = await import("../dist/utils/refreshToken.js");
  const token = "refresh-token-for-test";
  const digest = hashRefreshToken(token);

  assert.equal(digest, hashRefreshToken(token));
  assert.notEqual(digest, token);
  assert.match(digest, /^[a-f0-9]{64}$/);
});

test("authentication services persist only refresh token hashes", async () => {
  const [authSource, portalSource] = await Promise.all([
    readFile(new URL("../src/services/auth.service.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/services/portal.service.ts", import.meta.url), "utf8"),
  ]);

  assert.match(authSource, /tokenHash: hashRefreshToken\(refreshToken\)/);
  assert.match(portalSource, /tokenHash: hashRefreshToken\(refreshToken\)/);
  assert.doesNotMatch(authSource, /token: refreshToken/);
  assert.doesNotMatch(portalSource, /token: refreshToken/);
});
