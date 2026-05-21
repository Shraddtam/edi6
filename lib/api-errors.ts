import { Prisma } from "@prisma/client"

export function isDatabaseUnavailableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Error && error.message.includes("Can't reach database server"))
  )
}

export function databaseUnavailableResponse() {
  return Response.json(
    {
      error: "Database is not running. Start PostgreSQL on localhost:5432, then run npm run db:migrate.",
    },
    { status: 503 }
  )
}
