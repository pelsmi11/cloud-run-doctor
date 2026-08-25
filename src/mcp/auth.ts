import { GoogleAuth } from "google-auth-library";
import { getEnv } from "@/lib/env";

export const normalizeAuthHeaders = (headers: unknown): Record<string, string> => {
  const result: Record<string, string> = {};
  if (
    typeof headers === "object" &&
    headers !== null &&
    "forEach" in headers &&
    typeof headers.forEach === "function"
  ) {
    (headers.forEach as (callback: (value: string, key: string) => void) => void)(
      (value, key) => {
        result[key] = value;
      }
    );
    return result;
  }

  if (typeof headers === "object" && headers !== null) {
    for (const [key, value] of Object.entries(headers)) {
      result[key] = String(value);
    }
  }
  return result;
};

export async function getMcpHeaders(scopes: string[]): Promise<Record<string, string>> {
  const env = getEnv();
  const auth = new GoogleAuth({ scopes });
  const client = await auth.getClient();
  const headers = await client.getRequestHeaders();
  const result = normalizeAuthHeaders(headers);
  result["x-goog-user-project"] = env.GOOGLE_CLOUD_PROJECT;
  return result;
}

export function getRunScopes(): string[] {
  return ["https://www.googleapis.com/auth/run.readonly"];
}

export function getLoggingScopes(): string[] {
  return ["https://www.googleapis.com/auth/logging.read"];
}
