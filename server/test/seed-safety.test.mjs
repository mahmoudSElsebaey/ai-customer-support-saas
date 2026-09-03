import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("demo seed deletes only messages attached to demo tickets", async () => {
  const source = await readFile(new URL("../src/scripts/seed.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /Message\.deleteMany\(\{\}\)/);
  assert.match(source, /Ticket\.find\(\{ organizationId: orgId \}\)/);
  assert.match(source, /Message\.deleteMany\(\{ ticketId: \{ \$in: demoTicketIds/);
});
