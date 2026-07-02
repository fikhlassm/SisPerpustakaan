import { z } from "zod"
import { fail } from "@/lib/api"
import { NextResponse } from "next/server"

// =====================================================
// parseBody — parse + validasi request body dengan Zod v4
//
// Mengembalikan:
//   { data: T, error: null }        — jika valid
//   { data: null, error: NextResponse } — jika invalid (siap return dari handler)
//
// Penggunaan:
//   const { data, error } = await parseBody(req, LoginSchema)
//   if (error) return error
//   // data sudah typed dan validated
//
// Catatan Zod v4: result.error.issues (bukan .errors seperti v3)
// =====================================================

type ParseSuccess<T> = { data: T; error: null }
type ParseFailure = { data: null; error: NextResponse }
type ParseResult<T> = ParseSuccess<T> | ParseFailure

export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<ParseResult<z.infer<T>>> {
  let raw: unknown

  try {
    // Baca sebagai text dulu — handle body kosong dengan graceful (default ke {})
    const text = await req.text()
    raw = text ? JSON.parse(text) : {}
  } catch {
    return {
      data: null,
      error: fail("Request body tidak valid (bukan JSON yang benar)", 400),
    }
  }

  const result = schema.safeParse(raw)

  if (!result.success) {
    // Zod v4: .issues (bukan .errors)
    const issues = result.error.issues
    const firstMessage = issues[0]
      ? `${issues[0].path.length > 0 ? issues[0].path.join(".") + ": " : ""}${issues[0].message}`
      : "Data tidak valid"

    return {
      data: null,
      error: fail(firstMessage, 422, {
        fields: issues.map((issue) => ({
          field: issue.path.join(".") || "body",
          message: issue.message,
        })),
      }),
    }
  }

  return { data: result.data as z.infer<T>, error: null }
}
