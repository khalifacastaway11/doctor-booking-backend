/**
 * Safely extract primitive fields from an error for logging.
 * Prevents circular reference crashes in Winston/JSON.stringify.
 */
export const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      // Prisma error codes (P2002, P2025, etc.)
      code: (error as any).code,
      // HTTP status if set
      statusCode: (error as any).statusCode,
    };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  if (error && typeof error === "object") {
    // Attempt to extract useful fields without circular refs
    return {
      message: (error as any).message || "Unknown error",
      code: (error as any).code,
      name: (error as any).name,
    };
  }

  return { message: String(error) };
};