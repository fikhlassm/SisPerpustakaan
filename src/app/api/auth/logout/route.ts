import { destroySession } from "@/lib/auth"
import { apiHandler, ok } from "@/lib/api"

// POST /api/auth/logout
export const POST = apiHandler(async () => {
  await destroySession()
  return ok({ message: "Logout berhasil" })
})
