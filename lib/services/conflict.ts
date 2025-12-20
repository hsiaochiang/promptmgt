import { createHash } from "crypto";

export function computeHash(content: string) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function hasConflict(params: {
  localMtime: number;
  externalMtime: number;
  localHash?: string;
  externalHash?: string;
}) {
  const timeConflict = params.externalMtime > params.localMtime;
  const hashConflict =
    params.localHash && params.externalHash ? params.localHash !== params.externalHash : false;
  return timeConflict || hashConflict;
}
