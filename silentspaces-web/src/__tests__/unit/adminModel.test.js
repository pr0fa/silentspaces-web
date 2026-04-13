import { describe, it, expect, vi, beforeEach } from "vitest";

// ── mock Firebase before any model import ────────────────────────────────────
vi.mock("../../config/firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", () => ({
  collection:      vi.fn(),
  collectionGroup: vi.fn(),
  doc:             vi.fn(),
  getDocs:         vi.fn(),
  deleteDoc:       vi.fn(),
  addDoc:          vi.fn(),
  updateDoc:       vi.fn(),
  runTransaction:  vi.fn(),
  serverTimestamp: vi.fn(() => "MOCK_TIMESTAMP"),
}));

import {
  getAdminStats,
  getAdminLocations,
  getAdminUsers,
  addLocation,
  updateLocation,
} from "../../models/adminModel";

import { getDocs, addDoc, updateDoc, collection, collectionGroup, doc } from "firebase/firestore";

// ── helpers ───────────────────────────────────────────────────────────────────
const makeDoc = (id, data) => ({ id, data: () => data, ref: { parent: { parent: { id: "loc-1" } } } });
const snap    = (docs) => ({ docs, size: docs.length });

// ── getAdminStats() ───────────────────────────────────────────────────────────
describe("getAdminStats()", () => {
  beforeEach(() => {
    collection.mockReturnValue("col-ref");
    collectionGroup.mockReturnValue("group-ref");
  });

  it("returns zeros when database is empty", async () => {
    getDocs.mockResolvedValue(snap([]));
    const stats = await getAdminStats();
    expect(stats.totalLocations).toBe(0);
    expect(stats.totalRatings).toBe(0);
    expect(stats.totalUsers).toBe(0);
    expect(stats.avgQuietness).toBe(0);
  });

  it("counts locations correctly", async () => {
    getDocs
      .mockResolvedValueOnce(snap([makeDoc("l1", { quietnessScore: 4 }), makeDoc("l2", { quietnessScore: 3 })]))
      .mockResolvedValueOnce(snap([]))
      .mockResolvedValueOnce(snap([]));
    const stats = await getAdminStats();
    expect(stats.totalLocations).toBe(2);
  });

  it("calculates average quietness correctly", async () => {
    getDocs
      .mockResolvedValueOnce(snap([
        makeDoc("l1", { quietnessScore: 4 }),
        makeDoc("l2", { quietnessScore: 2 }),
      ]))
      .mockResolvedValueOnce(snap([]))
      .mockResolvedValueOnce(snap([]));
    const stats = await getAdminStats();
    expect(stats.avgQuietness).toBe(3);
  });

  it("excludes locations with score 0 from the average", async () => {
    getDocs
      .mockResolvedValueOnce(snap([
        makeDoc("l1", { quietnessScore: 4 }),
        makeDoc("l2", { quietnessScore: 0 }), // unrated — should be excluded
      ]))
      .mockResolvedValueOnce(snap([]))
      .mockResolvedValueOnce(snap([]));
    const stats = await getAdminStats();
    expect(stats.avgQuietness).toBe(4); // only l1 counted
  });

  it("counts total ratings from collectionGroup", async () => {
    getDocs
      .mockResolvedValueOnce(snap([]))
      .mockResolvedValueOnce(snap([]))
      .mockResolvedValueOnce(snap([makeDoc("r1",{}), makeDoc("r2",{}), makeDoc("r3",{})]));
    const stats = await getAdminStats();
    expect(stats.totalRatings).toBe(3);
  });

  it("counts total users correctly", async () => {
    getDocs
      .mockResolvedValueOnce(snap([]))
      .mockResolvedValueOnce(snap([makeDoc("u1",{}), makeDoc("u2",{})]))
      .mockResolvedValueOnce(snap([]));
    const stats = await getAdminStats();
    expect(stats.totalUsers).toBe(2);
  });
});

// ── getAdminLocations() ───────────────────────────────────────────────────────
describe("getAdminLocations()", () => {
  it("returns an array of locations with ids", async () => {
    getDocs.mockResolvedValue(snap([
      makeDoc("loc-1", { name: "Kingston Library", type: "library" }),
      makeDoc("loc-2", { name: "Surbiton Park",    type: "park" }),
    ]));
    const locs = await getAdminLocations();
    expect(locs).toHaveLength(2);
    expect(locs[0].id).toBe("loc-1");
    expect(locs[0].name).toBe("Kingston Library");
  });

  it("returns empty array when no locations exist", async () => {
    getDocs.mockResolvedValue(snap([]));
    const locs = await getAdminLocations();
    expect(locs).toEqual([]);
  });
});

// ── getAdminUsers() ───────────────────────────────────────────────────────────
describe("getAdminUsers()", () => {
  it("returns users with their ids", async () => {
    getDocs.mockResolvedValue(snap([
      makeDoc("u1", { displayName: "Alice", email: "alice@test.com" }),
    ]));
    const users = await getAdminUsers();
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe("u1");
    expect(users[0].email).toBe("alice@test.com");
  });
});

// ── addLocation() ─────────────────────────────────────────────────────────────
describe("addLocation()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the new document id", async () => {
    addDoc.mockResolvedValue({ id: "new-loc-id" });
    collection.mockReturnValue("col-ref");
    const id = await addLocation({ name:"Test", type:"library", address:"1 Road", area:"Kingston", lat:51.4, lng:-0.3, wifi:true, seating:false, sockets:false });
    expect(id).toBe("new-loc-id");
  });

  it("coerces lat/lng to numbers", async () => {
    addDoc.mockResolvedValue({ id: "x" });
    collection.mockReturnValue("col-ref");
    await addLocation({ name:"T", type:"library", address:"A", area:"", lat:"51.4", lng:"-0.3", wifi:false, seating:false, sockets:false });
    const payload = addDoc.mock.calls[0][1];
    expect(typeof payload.lat).toBe("number");
    expect(typeof payload.lng).toBe("number");
  });

  it("coerces wifi/seating/sockets to booleans", async () => {
    addDoc.mockResolvedValue({ id: "x" });
    collection.mockReturnValue("col-ref");
    await addLocation({ name:"T", type:"library", address:"A", area:"", lat:0, lng:0, wifi:1, seating:0, sockets:1 });
    const payload = addDoc.mock.calls[0][1];
    expect(payload.wifi).toBe(true);
    expect(payload.seating).toBe(false);
    expect(payload.sockets).toBe(true);
  });

  it("initialises quietnessScore and ratingCount to 0", async () => {
    addDoc.mockResolvedValue({ id: "x" });
    collection.mockReturnValue("col-ref");
    await addLocation({ name:"T", type:"library", address:"A", area:"", lat:0, lng:0, wifi:false, seating:false, sockets:false });
    const payload = addDoc.mock.calls[0][1];
    expect(payload.quietnessScore).toBe(0);
    expect(payload.ratingCount).toBe(0);
  });
});

// ── updateLocation() ──────────────────────────────────────────────────────────
describe("updateLocation()", () => {
  it("calls updateDoc with the correct location id", async () => {
    updateDoc.mockResolvedValue();
    doc.mockReturnValue("doc-ref");
    collection.mockReturnValue("col-ref");
    await updateLocation("loc-99", { name:"Updated", type:"cafe", address:"2 Road", area:"Surbiton", lat:51.3, lng:-0.4, wifi:true, seating:true, sockets:false });
    expect(updateDoc).toHaveBeenCalledWith("doc-ref", expect.objectContaining({ name: "Updated" }));
  });

  it("does not overwrite quietnessScore or ratingCount", async () => {
    updateDoc.mockResolvedValue();
    doc.mockReturnValue("doc-ref");
    await updateLocation("loc-99", { name:"X", type:"cafe", address:"A", area:"", lat:0, lng:0, wifi:false, seating:false, sockets:false });
    const payload = updateDoc.mock.calls[0][1];
    expect(payload.quietnessScore).toBeUndefined();
    expect(payload.ratingCount).toBeUndefined();
  });
});

// ── avgQuietness calculation (pure logic) ─────────────────────────────────────
describe("avgQuietness calculation (pure logic)", () => {
  // mirrors the formula in getAdminStats
  const calcAvg = (scores) => {
    const filtered = scores.filter(s => s > 0);
    if (filtered.length === 0) return 0;
    return Math.round((filtered.reduce((a,b) => a+b, 0) / filtered.length) * 10) / 10;
  };

  it("returns 0 for empty array",       () => expect(calcAvg([])).toBe(0));
  it("returns 0 when all scores are 0", () => expect(calcAvg([0,0,0])).toBe(0));
  it("ignores zero scores in average",  () => expect(calcAvg([4,0,2])).toBe(3));
  it("rounds to 1 decimal",            () => expect(calcAvg([4,3,3])).toBe(3.3));
  it("handles single score",           () => expect(calcAvg([4.5])).toBe(4.5));
});
