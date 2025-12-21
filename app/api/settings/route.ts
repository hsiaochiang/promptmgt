import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { getSettings, updateSettings } from "@/lib/services/settings";
import { badRequest } from "@/app/api/_lib/responses";

export async function GET() {
  const settings = await getSettings();
  const rootPath = settings.rootPath ?? "";
  const pathExists = rootPath ? await fs.access(rootPath).then(() => true).catch(() => false) : false;
  return NextResponse.json({ ...settings, pathExists });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const nextRoot = typeof payload.rootPath === "string" ? payload.rootPath.trim() : undefined;

  if (nextRoot !== undefined) {
    if (!nextRoot) {
      return badRequest("rootPath is required", { field: "rootPath" });
    }
    try {
      await fs.mkdir(nextRoot, { recursive: true });
      await fs.access(nextRoot);
    } catch (error: any) {
      return badRequest("rootPath is not accessible", { message: error?.message });
    }
  }

  const updated = await updateSettings(payload);
  const pathExists = updated.rootPath ? await fs.access(updated.rootPath).then(() => true).catch(() => false) : false;
  return NextResponse.json({ ...updated, pathExists });
}
