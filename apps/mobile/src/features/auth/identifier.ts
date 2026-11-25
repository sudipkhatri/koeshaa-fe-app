import { ApiError, normaliseIdentifier, normalisePhone } from "@keoshaa/core";

/** Normalised phone, email, or username. Throws `VALIDATION_ERROR` when the text is none of those. */
export function identifierForApi(raw: string): string {
  const normalised = normaliseIdentifier(raw);
  if (!normalised) {
    throw new ApiError(400, { code: "VALIDATION_ERROR", message: "VALIDATION_ERROR" });
  }
  return normalised.value;
}

/** Nepal mobile in the form the backend stores (`+9779XXXXXXXX`). */
export function phoneForApi(raw: string): string {
  const phone = normalisePhone(raw);
  if (!phone) {
    throw new ApiError(400, { code: "VALIDATION_ERROR", message: "VALIDATION_ERROR" });
  }
  return phone;
}
