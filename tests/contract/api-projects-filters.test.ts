import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdir } from "fs/promises";
import { setupIsolatedWorkspace } from "../utils/testEnv";
import { projectStatuses, projectTypes } from "@/lib/taxonomy/data";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
  await mkdir(process.env.DEFAULT_ROOT!, { recursive: true });
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
});

describe("/api/projects filters & edge cases", () => {
  it("GET supports q/status/projectType/tag/limit filters", async () => {
    const { POST, GET } = await import("@/app/api/projects/route");

    const tagObj = { code: "TAG_ONE", name: "Tag One" };

    const a = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          id: "proj-alpha",
          name: "Alpha 專案",
          status: projectStatuses[0].code,
          projectType: projectTypes[0].code,
          tags: ["alpha"],
          summary: "Alpha summary"
        })
      })
    );
    expect(a.status).toBe(201);

    const b = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          id: "proj-beta",
          name: "Beta 專案",
          status: projectStatuses[1].name,
          projectType: projectTypes[1].name,
          tags: [tagObj],
          description: "Beta description"
        })
      })
    );
    expect(b.status).toBe(201);

    // q filter
    const qRes = await GET(new Request("http://localhost/api/projects?q=alpha"));
    const qList = await qRes.json();
    expect(qList.length).toBe(1);
    expect(qList[0].id).toBe("proj-alpha");

    // status filter: code
    const sCodeRes = await GET(new Request(`http://localhost/api/projects?status=${encodeURIComponent(projectStatuses[0].code)}`));
    const sCodeList = await sCodeRes.json();
    expect(sCodeList.some((p: any) => p.id === "proj-alpha")).toBe(true);
    expect(sCodeList.some((p: any) => p.id === "proj-beta")).toBe(false);

    // status filter: name
    const sNameRes = await GET(new Request(`http://localhost/api/projects?status=${encodeURIComponent(projectStatuses[1].name)}`));
    const sNameList = await sNameRes.json();
    expect(sNameList.some((p: any) => p.id === "proj-beta")).toBe(true);
    expect(sNameList.some((p: any) => p.id === "proj-alpha")).toBe(false);

    // projectType filter: code
    const tCodeRes = await GET(
      new Request(`http://localhost/api/projects?projectType=${encodeURIComponent(projectTypes[0].code)}`)
    );
    const tCodeList = await tCodeRes.json();
    expect(tCodeList.some((p: any) => p.id === "proj-alpha")).toBe(true);

    // projectType filter: name
    const tNameRes = await GET(
      new Request(`http://localhost/api/projects?projectType=${encodeURIComponent(projectTypes[1].name)}`)
    );
    const tNameList = await tNameRes.json();
    expect(tNameList.some((p: any) => p.id === "proj-beta")).toBe(true);

    // tag filter: code (free-form tag)
    const tagCodeRes = await GET(new Request("http://localhost/api/projects?tag=alpha"));
    const tagCodeList = await tagCodeRes.json();
    expect(tagCodeList.some((p: any) => p.id === "proj-alpha")).toBe(true);

    // tag filter: name (tag object)
    const tagNameRes = await GET(new Request(`http://localhost/api/projects?tag=${encodeURIComponent(tagObj.name)}`));
    const tagNameList = await tagNameRes.json();
    expect(tagNameList.some((p: any) => p.id === "proj-beta")).toBe(true);

    // limit: numeric
    const limitedRes = await GET(new Request("http://localhost/api/projects?limit=1"));
    const limitedList = await limitedRes.json();
    expect(limitedList.length).toBe(1);

    // limit: invalid -> fallback 1000
    const invalidLimitRes = await GET(new Request("http://localhost/api/projects?limit=not-a-number"));
    const invalidLimitList = await invalidLimitRes.json();
    expect(invalidLimitList.length).toBeGreaterThanOrEqual(2);
  });

  it("POST/PATCH/DELETE cover validation & rootPath branches", async () => {
    const { POST, PATCH, DELETE } = await import("@/app/api/projects/route");

    // POST: missing name
    const missingName = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({})
      })
    );
    expect(missingName.status).toBe(400);

    // POST: description -> summary fallback, and rootPath truthy triggers README write
    const createdRes = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: "README 專案",
          status: projectStatuses[0].name,
          description: "這是描述"
        })
      })
    );
    expect(createdRes.status).toBe(201);
    const created = await createdRes.json();
    expect(created.summary).toContain("這是描述");

    // PATCH: missing id
    const patchMissingId = await PATCH(
      new Request("http://localhost/api/projects", {
        method: "PATCH",
        body: JSON.stringify({ name: "x" })
      })
    );
    expect(patchMissingId.status).toBe(400);

    // PATCH: empty name after trim
    const patchEmptyName = await PATCH(
      new Request("http://localhost/api/projects", {
        method: "PATCH",
        body: JSON.stringify({ id: created.id, name: "   " })
      })
    );
    expect(patchEmptyName.status).toBe(400);

    // Create another project to test duplicate rename
    const otherRes = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "其他專案", status: projectStatuses[0].code })
      })
    );
    expect(otherRes.status).toBe(201);

    const patchDup = await PATCH(
      new Request("http://localhost/api/projects", {
        method: "PATCH",
        body: JSON.stringify({ id: created.id, name: "其他專案" })
      })
    );
    expect(patchDup.status).toBe(409);

    // PATCH: update fields
    const patchOk = await PATCH(
      new Request("http://localhost/api/projects", {
        method: "PATCH",
        body: JSON.stringify({
          id: created.id,
          status: projectStatuses[2].code,
          summary: "   新摘要   ",
          projectType: projectTypes[2].code,
          tags: [{ code: "T2", name: "Tag Two" }],
          promptCount: 7
        })
      })
    );
    expect(patchOk.status).toBe(200);
    const patched = await patchOk.json();
    expect(patched.status.code).toBe(projectStatuses[2].code);
    expect(patched.summary).toBe("新摘要");
    expect(patched.projectType.code).toBe(projectTypes[2].code);
    expect(patched.tags.length).toBe(1);
    expect(patched.promptCount).toBe(7);

    // DELETE: missing id
    const delMissingId = await DELETE(
      new Request("http://localhost/api/projects", {
        method: "DELETE",
        body: JSON.stringify({})
      })
    );
    expect(delMissingId.status).toBe(400);

    const delOk = await DELETE(
      new Request("http://localhost/api/projects", {
        method: "DELETE",
        body: JSON.stringify({ id: created.id })
      })
    );
    expect(delOk.status).toBe(200);

    // DELETE: not found
    const delNotFound = await DELETE(
      new Request("http://localhost/api/projects", {
        method: "DELETE",
        body: JSON.stringify({ id: "nope" })
      })
    );
    expect(delNotFound.status).toBe(404);
  });
});
