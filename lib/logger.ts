import "server-only"

type LogFields = Record<string, string | number | boolean | null | undefined>

function formatFields(fields: LogFields = {}) {
  const cleanFields = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  )

  return Object.keys(cleanFields).length ? ` ${JSON.stringify(cleanFields)}` : ""
}

export const logger = {
  info(event: string, fields?: LogFields) {
    console.info(`[privacy-app] ${event}${formatFields(fields)}`)
  },
  warn(event: string, fields?: LogFields) {
    console.warn(`[privacy-app] ${event}${formatFields(fields)}`)
  },
  error(event: string, error: unknown, fields?: LogFields) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[privacy-app] ${event}${formatFields({ ...fields, error: message })}`)
  },
}
