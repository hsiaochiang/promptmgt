// 讓 VS Code 在 tests (inferred project) 也能解析 @/ 路徑，避免 TS2307。
// 注意：Vitest/Vite 實際執行仍走 vitest.config.ts 的 alias；這裡只為了編輯器型別服務。

declare module "@/app/api/projects/[id]/timeline/route" {
  export const GET: any;
  export const POST: any;
  export const PUT: any;
  export const DELETE: any;
  const _default: any;
  export default _default;
}

declare module "@/app/api/projects/[id]/files/route" {
  export const GET: any;
  export const POST: any;
  export const PUT: any;
  export const DELETE: any;
  const _default: any;
  export default _default;
}

declare module "@/app/api/projects/[id]/files/[name]/route" {
  export const GET: any;
  export const POST: any;
  export const PUT: any;
  export const DELETE: any;
  const _default: any;
  export default _default;
}

declare module "@/app/api/projects/[id]/meta/route" {
  export const GET: any;
  export const POST: any;
  export const PUT: any;
  export const DELETE: any;
  const _default: any;
  export default _default;
}

declare module "@/app/api/_lib/responses" {
  export const apiError: any;
  export const badRequest: any;
  export const notFound: any;
  export const conflict: any;
  export const unauthorized: any;
  export const serverError: any;
  export const success: any;
}

declare module "@/lib/db" {
  export const getDb: any;
}

declare module "@/lib/utils/sanitizeFilename" {
  export const sanitizeFilename: any;
}
