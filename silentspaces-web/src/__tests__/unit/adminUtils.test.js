import { describe, it, expect } from "vitest";
import { tc, nt, clt, SCORE_CLR, TYPE_CLRS, TABS, EMPTY_FORM } from "../../controllers/AdminPage/adminUtils.jsx";

// ── tc() — badge colour classifier ───────────────────────────────────────────
describe("tc()", () => {
  it("returns 'purple' for library", () => expect(tc("library")).toBe("purple"));
  it("returns 'purple' for Library (capital)", () => expect(tc("Library")).toBe("purple"));
  it("returns 'red' for cafe",    () => expect(tc("cafe")).toBe("red"));
  it("returns 'red' for Café",    () => expect(tc("Café")).toBe("red"));
  it("returns 'red' for coffee",  () => expect(tc("coffee shop")).toBe("red"));
  it("returns 'cyan' for park",   () => expect(tc("park")).toBe("cyan"));
  it("returns 'cyan' for garden", () => expect(tc("garden")).toBe("cyan"));
  it("defaults to 'purple' for unknown type", () => expect(tc("other")).toBe("purple"));
  it("handles null gracefully",   () => expect(tc(null)).toBe("purple"));
  it("handles undefined gracefully", () => expect(tc(undefined)).toBe("purple"));
});

// ── nt() — normalised type string ────────────────────────────────────────────
describe("nt()", () => {
  it("normalises 'Library' → 'library'",    () => expect(nt("Library")).toBe("library"));
  it("normalises 'Café' → 'cafe'",          () => expect(nt("Café")).toBe("cafe"));
  it("normalises 'coffee shop' → 'cafe'",   () => expect(nt("coffee shop")).toBe("cafe"));
  it("normalises 'Park' → 'park'",          () => expect(nt("Park")).toBe("park"));
  it("normalises 'garden' → 'park'",        () => expect(nt("garden")).toBe("park"));
  it("normalises unknown type → 'other'",   () => expect(nt("office")).toBe("other"));
  it("handles null gracefully",             () => expect(nt(null)).toBe("other"));
});

// ── clt() — capitalised label ─────────────────────────────────────────────────
describe("clt()", () => {
  it("returns 'Library' for library", () => expect(clt("library")).toBe("Library"));
  it("returns 'Café' for café",       () => expect(clt("café")).toBe("Café"));
  it("returns 'Café' for coffee",     () => expect(clt("coffee")).toBe("Café"));
  it("returns 'Park' for park",       () => expect(clt("park")).toBe("Park"));
  it("returns 'Park' for garden",     () => expect(clt("garden")).toBe("Park"));
  it("defaults to 'Café' for unknown", () => expect(clt("other")).toBe("Café"));
  it("handles null gracefully",        () => expect(clt(null)).toBe("Café"));
});

// ── SCORE_CLR() — quietness colour thresholds ─────────────────────────────────
describe("SCORE_CLR()", () => {
  it("returns green  for score 4",   () => expect(SCORE_CLR(4)).toBe("#10B981"));
  it("returns green  for score 5",   () => expect(SCORE_CLR(5)).toBe("#10B981"));
  it("returns amber  for score 3",   () => expect(SCORE_CLR(3)).toBe("#F59E0B"));
  it("returns orange for score 2",   () => expect(SCORE_CLR(2)).toBe("#F97316"));
  it("returns red    for score 1",   () => expect(SCORE_CLR(1)).toBe("#EF4444"));
  it("returns red    for score 0",   () => expect(SCORE_CLR(0)).toBe("#EF4444"));
  it("boundary: 3.9 is amber not green", () => expect(SCORE_CLR(3.9)).toBe("#F59E0B"));
  it("boundary: 4.0 is green",           () => expect(SCORE_CLR(4.0)).toBe("#10B981"));
});

// ── TYPE_CLRS — static colour map ────────────────────────────────────────────
describe("TYPE_CLRS", () => {
  it("has a colour for Library", () => expect(TYPE_CLRS.Library).toBeDefined());
  it("has a colour for Café",    () => expect(TYPE_CLRS.Café).toBeDefined());
  it("has a colour for Park",    () => expect(TYPE_CLRS.Park).toBeDefined());
});

// ── TABS — tab order ──────────────────────────────────────────────────────────
describe("TABS", () => {
  it("has exactly 4 tabs",          () => expect(TABS).toHaveLength(4));
  it("starts with Overview",        () => expect(TABS[0]).toBe("Overview"));
  it("includes Locations tab",      () => expect(TABS).toContain("Locations"));
  it("includes Ratings tab",        () => expect(TABS).toContain("Ratings"));
  it("includes Users tab",          () => expect(TABS).toContain("Users"));
});

// ── EMPTY_FORM — default form state ──────────────────────────────────────────
describe("EMPTY_FORM", () => {
  it("has empty name",              () => expect(EMPTY_FORM.name).toBe(""));
  it("has empty address",           () => expect(EMPTY_FORM.address).toBe(""));
  it("defaults type to library",    () => expect(EMPTY_FORM.type).toBe("library"));
  it("defaults wifi to false",      () => expect(EMPTY_FORM.wifi).toBe(false));
  it("defaults seating to false",   () => expect(EMPTY_FORM.seating).toBe(false));
  it("defaults sockets to false",   () => expect(EMPTY_FORM.sockets).toBe(false));
});
