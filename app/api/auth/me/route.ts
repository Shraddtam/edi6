import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { databaseUnavailableResponse, isDatabaseUnavailableError } from "@/lib/api-errors"

export async function GET() {
  let user
  try {
    user = await getCurrentUser()
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return databaseUnavailableResponse()
    }

    console.error("Current user error:", error)
    return NextResponse.json({ error: "Failed to load current user" }, { status: 500 })
  }

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  return NextResponse.json({ user })
}
