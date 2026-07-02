import { getSession } from "@/lib/auth"
import { apiHandler, ok } from "@/lib/api"

// GET /api/auth/me — mengembalikan sesi saat ini
export const GET = apiHandler(async () => {
  const session = await getSession()
  if (!session) return ok({ user: null })
  return ok({ user: session })
})
