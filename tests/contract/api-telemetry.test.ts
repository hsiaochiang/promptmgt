import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/telemetry", () => ({
  sendTelemetry: vi.fn(async (payload) => ({ ok: true, payload }))
}));

describe("POST /api/telemetry", () => {
  it("returns 400 when event is missing", async () => {
    const { POST } = await import("@/app/api/telemetry/route");
    const res = await POST(
      new Request("http://localhost/api/telemetry", {
        method: "POST",
        body: JSON.stringify({})
      })
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("event");
  });

  it("sends telemetry with default timestamp when event is provided", async () => {
    const { POST } = await import("@/app/api/telemetry/route");
    const res = await POST(
      new Request("http://localhost/api/telemetry", {
        method: "POST",
        body: JSON.stringify({ event: "editor_save", extra: "info" })
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    const { sendTelemetry } = await import("@/lib/services/telemetry");
    expect(sendTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ event: "editor_save", extra: "info", timestamp: expect.any(String) })
    );
  });

  it("uses provided timestamp when present", async () => {
    const { POST } = await import("@/app/api/telemetry/route");
    const res = await POST(
      new Request("http://localhost/api/telemetry", {
        method: "POST",
        body: JSON.stringify({ event: "with_ts", timestamp: "2025-01-01T00:00:00Z" })
      })
    );

    expect(res.status).toBe(200);
    const { sendTelemetry } = await import("@/lib/services/telemetry");
    expect(sendTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ event: "with_ts", timestamp: "2025-01-01T00:00:00Z" })
    );
  });
});
