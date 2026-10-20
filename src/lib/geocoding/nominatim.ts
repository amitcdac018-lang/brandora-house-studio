export type NominatimAddress = {
  house_number?: string;
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  city_district?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  country_code?: string;
};

export type NominatimReverseResponse = {
  address?: NominatimAddress;
  display_name?: string;
};

export type ParsedAddress = {
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

/**
 * Nominatim's field names vary a lot by location type (city center vs. a village/suburb vs.
 * a rural area), so fall back through several possibilities for "city". city_district is
 * deliberately excluded from line1 — in Indian results it's consistently just the city name
 * with "City"/"District" appended (e.g. "Indore City" when city is "Indore"), not genuinely
 * new address detail, so including it only produces a confusing near-duplicate.
 */
export function parseNominatimAddress(data: NominatimReverseResponse): ParsedAddress | null {
  const address = data.address;
  if (!address) return null;

  const city = address.city ?? address.town ?? address.village ?? address.municipality ?? "";

  const line1Parts = [address.house_number, address.road, address.suburb ?? address.neighbourhood ?? address.quarter].filter(
    (part): part is string => Boolean(part) && part !== city
  );

  const line1 = line1Parts.join(", ");

  return {
    line1: line1 || data.display_name || "",
    city: city || address.county || address.state_district || "",
    state: address.state ?? "",
    postalCode: address.postcode ?? "",
    country: address.country_code?.toUpperCase() ?? "IN",
  };
}
