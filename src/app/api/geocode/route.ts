import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Reverse-geocodes GPS coordinates to a postal address via OpenStreetMap's Nominatim —
 * free, no API key, but has a strict fair-use policy (no more than ~1 req/sec, identify
 * your app via User-Agent). Proxied server-side so the browser never talks to a third
 * party directly and so we can rate-limit per user.
 */
export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const { success } = await rateLimit(`geocode:${user.id}:${ip}`, { limit: 10, windowMs: 60 * 1000 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "BrandoraHouseStudio/1.0 (checkout address autofill)",
          "Accept-Language": "en",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Could not resolve your location." }, { status: 502 });
    }

    const data = (await response.json()) as {
      address?: {
        road?: string;
        suburb?: string;
        neighbourhood?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        postcode?: string;
        country_code?: string;
      };
      display_name?: string;
    };

    const address = data.address;
    if (!address) {
      return NextResponse.json({ error: "No address found for this location." }, { status: 404 });
    }

    const line1 = [address.road, address.suburb ?? address.neighbourhood].filter(Boolean).join(", ");

    return NextResponse.json({
      line1: line1 || data.display_name || "",
      city: address.city ?? address.town ?? address.village ?? "",
      state: address.state ?? "",
      postalCode: address.postcode ?? "",
      country: address.country_code?.toUpperCase() ?? "IN",
    });
  } catch {
    return NextResponse.json({ error: "Could not resolve your location." }, { status: 502 });
  }
}
