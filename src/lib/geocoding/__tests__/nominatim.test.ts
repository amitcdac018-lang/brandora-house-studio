import { describe, it, expect } from "vitest";
import { parseNominatimAddress } from "../nominatim";

describe("parseNominatimAddress", () => {
  it("parses a real urban Indian address without duplicating the city in line1", () => {
    // Captured live from Nominatim for a coordinate in Indore — this exact shape caused the
    // original bug: city_district ("Indore City") was being included in line1 even though
    // city ("Indore") already covered it, and city itself wasn't being read correctly.
    const result = parseNominatimAddress({
      display_name: "Martand Chowk, Indore City, Indore, Juni Indore Tahsil, Indore, Madhya Pradesh, 452001, India",
      address: {
        neighbourhood: "Martand Chowk",
        city_district: "Indore City",
        city: "Indore",
        county: "Juni Indore Tahsil",
        state_district: "Indore",
        state: "Madhya Pradesh",
        postcode: "452001",
        country_code: "in",
      },
    });

    expect(result).toEqual({
      line1: "Martand Chowk",
      city: "Indore",
      state: "Madhya Pradesh",
      postalCode: "452001",
      country: "IN",
    });
  });

  it("falls back to town when city is absent", () => {
    const result = parseNominatimAddress({
      address: {
        road: "MG Road",
        town: "Rishikesh",
        state: "Uttarakhand",
        postcode: "249201",
        country_code: "in",
      },
    });

    expect(result?.city).toBe("Rishikesh");
    expect(result?.line1).toBe("MG Road");
  });

  it("falls back to village, then municipality, then county/state_district for city", () => {
    expect(parseNominatimAddress({ address: { village: "Bhicholi Hapsi", state: "MP" } })?.city).toBe(
      "Bhicholi Hapsi"
    );
    expect(parseNominatimAddress({ address: { municipality: "Pithampur", state: "MP" } })?.city).toBe("Pithampur");
    expect(parseNominatimAddress({ address: { county: "Juni Indore Tahsil", state: "MP" } })?.city).toBe(
      "Juni Indore Tahsil"
    );
    expect(parseNominatimAddress({ address: { state_district: "Indore", state: "MP" } })?.city).toBe("Indore");
  });

  it("includes house_number and road together in line1 when both are present", () => {
    const result = parseNominatimAddress({
      address: { house_number: "221B", road: "Baker Street", city: "London", country_code: "gb" },
    });
    expect(result?.line1).toBe("221B, Baker Street");
  });

  it("falls back to display_name when no structured line1 parts are available", () => {
    const result = parseNominatimAddress({
      display_name: "Somewhere remote, India",
      address: { state: "Rajasthan", country_code: "in" },
    });
    expect(result?.line1).toBe("Somewhere remote, India");
  });

  it("returns null when the response has no address object at all", () => {
    expect(parseNominatimAddress({})).toBeNull();
  });

  it("defaults country to IN when country_code is missing", () => {
    const result = parseNominatimAddress({ address: { city: "Bhopal" } });
    expect(result?.country).toBe("IN");
  });
});
