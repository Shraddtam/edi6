import "server-only"

import { NextResponse } from "next/server"
import { getCurrentUser, type AuthUser } from "@/lib/auth"

export async function requireCurrentUser(): Promise<
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    }
  }

  return { ok: true, user }
}
