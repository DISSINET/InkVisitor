function normalizeOrigin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  const withScheme = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return "";
  }
}

export function getAllowedOrigins(): string[] {
  const origins = new Set<string>();

  if (process.env.CORS_ORIGINS) {
    for (const entry of process.env.CORS_ORIGINS.split(",")) {
      const origin = normalizeOrigin(entry);
      if (origin) {
        origins.add(origin);
      }
    }
  }

  if (process.env.DOMAIN) {
    const origin = normalizeOrigin(process.env.DOMAIN);
    if (origin) {
      origins.add(origin);
      if (origin.startsWith("https://")) {
        origins.add(origin.replace("https://", "http://"));
      }
    }
  }

  if (process.env.NODE_ENV === "development") {
    origins.add("http://localhost:8000");
    origins.add("http://127.0.0.1:8000");
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }

  return [...origins];
}

export function isAllowedOrigin(origin: string): boolean {
  return getAllowedOrigins().includes(origin);
}
