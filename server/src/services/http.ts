export type HttpError = Error & { statusCode: number }

export function httpError(statusCode: number, message: string): HttpError {
  const err: HttpError = new Error(message) as HttpError
  err.statusCode = statusCode
  return err
}
