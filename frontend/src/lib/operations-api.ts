function normalizeOperationsApiUrl(configuredUrl?: string) {
  if (!configuredUrl) return "/backend-api";

  const url = configuredUrl.replace(/\/+$/, "");
  return /\/api\/v1$/.test(url) ? url : `${url}/api/v1`;
}

export const OPERATIONS_API_URL = normalizeOperationsApiUrl(
  process.env.NEXT_PUBLIC_AUTH_API_URL
);

export async function fetchOperationsResource<T>(resource: string): Promise<T[]> {
  const endpoint = `${OPERATIONS_API_URL}/operations/${resource}`;
  let response: Response;

  try {
    response = await fetch(endpoint, { cache: "no-store" });
  } catch {
    throw new Error(
      `Unable to reach the operations service at ${OPERATIONS_API_URL}. Start the auth service or set NEXT_PUBLIC_AUTH_API_URL to its public URL.`
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || `Unable to load ${resource}.`);
  }
  return payload.data;
}

export async function logNavigationRequest(input: {
  origin: string;
  destination: string;
  preference: string;
  source: "journey-planner" | "ai-navigator" | "station-map";
}) {
  const response = await fetch(`${OPERATIONS_API_URL}/operations/navigation-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || "Unable to record navigation request.");
  }
  return payload.data;
}
