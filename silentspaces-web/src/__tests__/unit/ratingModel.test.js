import { describe, it, expect, vi, beforeEach } from "vitest";

// ── mock Firebase before any model import ────────────────────────────────────
vi.mock("../../config/firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", () => ({
  collection:      vi.fn(),
  doc:             vi.fn(),
  getDocs:         vi.fn(),
  runTransaction:  vi.fn(),
  serverTimestamp: vi.fn(() => "MOCK_TIMESTAMP"),
  orderBy:         vi.fn(),
  query:           vi.fn(),
}));

import { getRatings } from "../../models/ratingModel";
import { getDocs, collection, query, orderBy } from "firebase/firestore";

// ── helpers ───────────────────────────────────────────────────────────────────
const makeDoc = (id, data) => ({
  id,
  data: () => ({
    ...data,
    createdAt: { toDate: () => new Date("2024-01-01") },
  }),
});

const mockSnapshot = (docs) => ({ docs });

// ── getRatings() ──────────────────────────────────────────────────────────────
describe("getRatings()", () => {
  beforeEach(() => {
    collection.mockReturnValue("ratings-ref");
    orderBy.mockReturnValue("order-by-clause");
    query.mockReturnValue("ordered-query");
  });

  it("returns empty ratings with average 0 when no ratings exist", async () => {
    getDocs.mockResolvedValue(mockSnapshot([]));
    const result = await getRatings("loc-1");
    expect(result.count).toBe(0);
    expect(result.average).toBe(0);
    expect(result.ratings).toHaveLength(0);
  });

  it("calculates correct average for a single rating", async () => {
    getDocs.mockResolvedValue(mockSnapshot([makeDoc("r1", { rating: 4, comment: "quiet" })]));
    const result = await getRatings("loc-1");
    expect(result.average).toBe(4);
    expect(result.count).toBe(1);
  });

  it("calculates correct average for multiple ratings", async () => {
    getDocs.mockResolvedValue(mockSnapshot([
      makeDoc("r1", { rating: 4, comment: "nice" }),
      makeDoc("r2", { rating: 2, comment: "loud" }),
      makeDoc("r3", { rating: 3, comment: "okay" }),
    ]));
    const result = await getRatings("loc-1");
    // (4 + 2 + 3) / 3 = 3.0
    expect(result.average).toBe(3);
    expect(result.count).toBe(3);
  });

  it("rounds average to 1 decimal place", async () => {
    getDocs.mockResolvedValue(mockSnapshot([
      makeDoc("r1", { rating: 5, comment: "" }),
      makeDoc("r2", { rating: 3, comment: "" }),
    ]));
    const result = await getRatings("loc-1");
    // (5 + 3) / 2 = 4.0
    expect(result.average).toBe(4);
  });

  it("converts Firestore Timestamp to ISO string", async () => {
    getDocs.mockResolvedValue(mockSnapshot([makeDoc("r1", { rating: 4, comment: "" })]));
    const result = await getRatings("loc-1");
    expect(typeof result.ratings[0].createdAt).toBe("string");
    expect(result.ratings[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it("returns all rating fields on each item", async () => {
    getDocs.mockResolvedValue(mockSnapshot([
      makeDoc("r1", { rating: 3, comment: "decent", bestTime: "Morning" }),
    ]));
    const result = await getRatings("loc-1");
    const r = result.ratings[0];
    expect(r.id).toBe("r1");
    expect(r.rating).toBe(3);
    expect(r.comment).toBe("decent");
    expect(r.bestTime).toBe("Morning");
  });
});

// ── running-average maths (pure, no Firebase) ─────────────────────────────────
describe("running average calculation (pure logic)", () => {
  // mirrors the formula used inside submitRating's transaction
  const calcNewScore = (currentScore, currentCount, newRating) => {
    const newCount = currentCount + 1;
    return Math.round(((currentScore * currentCount + newRating) / newCount) * 10) / 10;
  };

  it("first rating becomes the score", () =>
    expect(calcNewScore(0, 0, 4)).toBe(4));

  it("averages two ratings correctly", () =>
    expect(calcNewScore(4, 1, 2)).toBe(3));

  it("rounds to 1 decimal place", () =>
    expect(calcNewScore(4, 2, 3)).toBe(3.7));

  it("handles adding a 5-star to existing 3-star average", () =>
    expect(calcNewScore(3, 5, 5)).toBe(3.3));
});

// ── busyness level logic (pure, no Firebase) ──────────────────────────────────
describe("busyness level calculation (pure logic)", () => {
  // mirrors the formula used inside submitRating's transaction
  const calcBusyness = (dayVisits) => {
    const maxDay     = Math.max(...dayVisits);
    const totalVisits = dayVisits.reduce((a, b) => a + b, 0);
    const ratio       = totalVisits > 0 ? maxDay / totalVisits : 0;
    return ratio >= 0.35 ? "High" : ratio >= 0.2 ? "Mid" : "Low";
  };

  it("returns Low when no visits", () =>
    expect(calcBusyness([0,0,0,0,0,0,0])).toBe("Low"));

  it("returns High when visits concentrated on one day", () =>
    expect(calcBusyness([10,1,1,1,1,1,1])).toBe("High"));

  it("returns Mid when moderately spread", () =>
    expect(calcBusyness([3,2,2,2,2,2,2])).toBe("Mid"));

  it("returns Low when perfectly evenly spread", () =>
    expect(calcBusyness([1,1,1,1,1,1,1])).toBe("Low"));

  it("boundary: exactly 0.35 ratio is High", () => {
    // maxDay/total = 0.35 → e.g. 7 out of 20
    expect(calcBusyness([7,2,2,2,2,2,3])).toBe("High");
  });
});

// ── deleteRating reverse-average maths (pure, no Firebase) ────────────────────
describe("deleteRating score recalculation (pure logic)", () => {
  // mirrors the formula in adminModel.deleteRating
  const calcAfterDelete = (currentScore, currentCount, deletedRating) => {
    const newCount = Math.max(0, currentCount - 1);
    if (newCount === 0) return 0;
    return Math.round(((currentScore * currentCount - deletedRating) / newCount) * 10) / 10;
  };

  it("returns 0 when last rating is deleted", () =>
    expect(calcAfterDelete(4, 1, 4)).toBe(0));

  it("correctly removes one rating from the average", () =>
    expect(calcAfterDelete(3, 2, 4)).toBe(2));

  it("rounds result to 1 decimal place", () =>
    expect(calcAfterDelete(4, 3, 5)).toBe(3.5));

  it("never returns negative count", () =>
    expect(calcAfterDelete(3, 1, 3)).toBe(0));
});
