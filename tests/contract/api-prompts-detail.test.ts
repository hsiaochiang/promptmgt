import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
});

describe("/api/prompts/:id contract", () => {
  it("GET/POST returns server updatedAt and enforces conflict details", async () => {
    const { POST: createPrompt } = await import("@/app/api/prompts/route");
    const createRes = await createPrompt(
      new Request("http://localhost/api/prompts", {
        method: "POST",
        body: JSON.stringify({
          frontmatter: { title: "契約測試", project: "P1", type: "其他", status: "草稿", tags: [] },
          body: "Hello"
        })
      })
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();

    const { GET, POST: update } = await import("@/app/api/prompts/[id]/route");
    const readRes = await GET(new Request(`http://localhost/api/prompts/${created.id}`), { params: { id: created.id } });
    expect(readRes.status).toBe(200);
    const read = await readRes.json();
    expect(read.frontmatter.updatedAt).toBeTruthy();

    const updateRes = await update(
      new Request(`http://localhost/api/prompts/${created.id}`, {
        method: "POST",
        body: JSON.stringify({
          frontmatter: read.frontmatter,
          body: "Updated body",
          clientHash: read.hash,
          clientMtime: read.mtimeMs
        })
      }),
      { params: { id: created.id } }
    );
    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();
    expect(updated.updatedAt).toBeTruthy();

    const conflictRes = await update(
      new Request(`http://localhost/api/prompts/${created.id}`, {
        method: "POST",
        body: JSON.stringify({
          frontmatter: read.frontmatter,
          body: "stale",
          clientHash: "stale-hash",
          clientMtime: read.mtimeMs
        })
      }),
      { params: { id: created.id } }
    );
    expect(conflictRes.status).toBe(409);
    const err = await conflictRes.json();
    expect(err.details?.currentHash).toBeTruthy();
    expect(typeof err.details?.currentMtime).toBe("number");
  });
});
