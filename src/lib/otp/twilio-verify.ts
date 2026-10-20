import "server-only";
import twilio from "twilio";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

let client: ReturnType<typeof twilio> | null = null;
let clientCacheKey: string | null = null;

/**
 * Supports either auth style depending on which env vars are set:
 *  - API Key (recommended by Twilio): TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET + TWILIO_ACCOUNT_SID
 *  - Legacy Auth Token: TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN
 * Rebuilds the client if the relevant env vars change between calls (stale warm instance).
 */
function getTwilioClient(): ReturnType<typeof twilio> {
  const accountSid = getEnv("TWILIO_ACCOUNT_SID");
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

  const cacheKey = apiKeySid ? `apikey:${apiKeySid}` : `token:${accountSid}`;
  if (client && clientCacheKey === cacheKey) return client;

  if (apiKeySid && apiKeySecret) {
    client = twilio(apiKeySid, apiKeySecret, { accountSid });
  } else {
    client = twilio(accountSid, getEnv("TWILIO_AUTH_TOKEN"));
  }
  clientCacheKey = cacheKey;
  return client;
}

/**
 * Twilio phone numbers must be in E.164 format (+<countrycode><number>, no spaces/punctuation).
 * We treat a bare 10-digit number as an Indian mobile number by default, matching the rest of
 * the app's India-first assumptions (see Shiprocket's phone normalization for the same pattern).
 */
export function toE164(rawPhone: string): string | null {
  const digitsOnly = rawPhone.replace(/\D/g, "");

  if (/^[6-9]\d{9}$/.test(digitsOnly)) {
    return `+91${digitsOnly}`;
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91") && /^91[6-9]\d{9}$/.test(digitsOnly)) {
    return `+${digitsOnly}`;
  }
  return null;
}

export async function sendOtp(e164Phone: string): Promise<void> {
  const verifyServiceSid = getEnv("TWILIO_VERIFY_SERVICE_SID");
  await getTwilioClient().verify.v2.services(verifyServiceSid).verifications.create({
    to: e164Phone,
    channel: "sms",
  });
}

export type OtpCheckResult = "approved" | "denied" | "expired";

export async function checkOtp(e164Phone: string, code: string): Promise<OtpCheckResult> {
  const verifyServiceSid = getEnv("TWILIO_VERIFY_SERVICE_SID");

  try {
    const result = await getTwilioClient()
      .verify.v2.services(verifyServiceSid)
      .verificationChecks.create({ to: e164Phone, code });

    return result.status === "approved" ? "approved" : "denied";
  } catch (error) {
    // Twilio throws (rather than returning a status) once a verification has expired or
    // the max check-attempt count is exceeded — surface that distinctly from "wrong code".
    if (error && typeof error === "object" && "status" in error && (error as { status: number }).status === 404) {
      return "expired";
    }
    throw error;
  }
}
