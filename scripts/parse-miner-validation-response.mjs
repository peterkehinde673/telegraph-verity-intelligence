export async function parseMinerValidationResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";
  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  const isJson = mediaType === "application/json" || mediaType.endsWith("+json");

  if (!isJson) {
    const safeMediaType = /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(mediaType)
      ? mediaType
      : "missing or invalid content type";
    throw new Error(
      `Telegraph validation endpoint returned HTTP ${response.status} with ${safeMediaType}; expected JSON. No validation result was produced.`
    );
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Telegraph validation endpoint returned malformed JSON. No validation result was produced.");
  }

  if (!result || typeof result !== "object" || Array.isArray(result) || typeof result.valid !== "boolean") {
    throw new Error("Telegraph validation endpoint returned JSON without a boolean valid field. No validation result was produced.");
  }

  return result;
}
