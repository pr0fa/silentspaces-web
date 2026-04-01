import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAdminStats,
  getAdminLocations,
  getAdminRatings,
  getAdminUsers,
  addLocation,
  updateLocation,
  deleteLocation,
  deleteRating,
} from "../../models/adminModel";
import { MapPin, Star, VolumeX, Users, ArrowLeft, Trash2, RefreshCw, Plus, X, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import "./AdminPage.css";

const TABS = ["Overview", "Locations", "Ratings", "Users"];

const EMPTY_FORM = {
  name: "", type: "library", address: "", area: "",
  wifi: false, seating: false, sockets: false,
};

async function geocodeAddress(address) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?country=gb&limit=1&access_token=${token}`;
  const res  = await fetch(url);
  const data = await res.json();
  const feat = data.features?.[0];
  if (!feat) throw new Error("Address not found");
  return {
    lat:  feat.center[1],
    lng:  feat.center[0],
    area: feat.context?.find(c => c.id.startsWith("place") || c.id.startsWith("locality"))?.text || "",
  };
}

export default function AdminPage() {
  const navigate  = useNavigate();
  const { currentUser, logout } = useAuth();

  const [tab,       setTab]       = useState("Overview");
  const [stats,     setStats]     = useState(null);
  const [locations, setLocations] = useState([]);
  const [ratings,   setRatings]   = useState([]);
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");

  // Add / Edit location modal
  const [showAdd,   setShowAdd]   = useState(false);
  const [editTarget, setEditTarget] = useState(null); // location being edited, or null for add
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, locs, rats, usrs] = await Promise.all([
        getAdminStats(),
        getAdminLocations(),
        getAdminRatings(),
        getAdminUsers(),
      ]);
      setStats(s);
      setLocations(locs);
      setRatings(rats);
      setUsers(usrs);
    } catch (e) {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowAdd(true);
  };

  const openEdit = (loc) => {
    setEditTarget(loc);
    setForm({
      name:    loc.name    || "",
      type:    loc.type    || "library",
      address: loc.address || "",
      area:    loc.area    || "",
      wifi:    !!loc.wifi,
      seating: !!loc.seating,
      sockets: !!loc.sockets,
    });
    setShowAdd(true);
  };

  const closeModal = () => { setShowAdd(false); setEditTarget(null); setForm(EMPTY_FORM); };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim()) {
      toast.error("Name and address are required.");
      return;
    }
    setSaving(true);
    try {
      // Re-geocode only if address changed (or it's a new location)
      const addressChanged = !editTarget || editTarget.address !== form.address.trim();
      let lat = editTarget?.lat;
      let lng = editTarget?.lng;
      let area = form.area.trim() || editTarget?.area || "";

      if (addressChanged) {
        const geo = await geocodeAddress(form.address);
        lat  = geo.lat;
        lng  = geo.lng;
        area = form.area.trim() || geo.area;
      }

      const payload = {
        name: form.name.trim(), type: form.type,
        address: form.address.trim(), area,
        lat, lng,
        wifi: form.wifi, seating: form.seating, sockets: form.sockets,
      };

      if (editTarget) {
        await updateLocation(editTarget.id, payload);
        toast.success(`"${form.name}" updated.`);
      } else {
        await addLocation(payload);
        toast.success(`"${form.name}" added to the map!`);
      }

      closeModal();
      loadAll();
    } catch (err) {
      toast.error(err.message || "Failed to save location.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = async (id, name) => {
    if (!window.confirm(`Delete "${name}" and all its ratings?`)) return;
    try {
      await deleteLocation(id);
      setLocations(prev => prev.filter(l => l.id !== id));
      toast.success("Location deleted.");
      loadAll();
    } catch {
      toast.error("Failed to delete location.");
    }
  };

  const handleDeleteRating = async (locationId, ratingId) => {
    if (!window.confirm("Delete this rating?")) return;
    try {
      await deleteRating(locationId, ratingId);
      setRatings(prev => prev.filter(r => r.id !== ratingId));
      toast.success("Rating deleted.");
      loadAll();
    } catch {
      toast.error("Failed to delete rating.");
    }
  };

  const field = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const filteredLocations = locations.filter(l =>
    !search || (l.name || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredRatings = ratings.filter(r =>
    !search || (r.comment || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredUsers = users.filter(u =>
    !search ||
    (u.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ad-page">

      {/* Sidebar */}
      <aside className="ad-sidebar">
        <div className="ad-sidebar-logo">
          <svg viewBox="0 0 20 24" width="22" height="26" fill="none">
            <path d="M10 0C4.48 0 0 4.48 0 10c0 7.5 10 14 10 14S20 17.5 20 10C20 4.48 15.52 0 10 0z" fill="#7C3AED"/>
            <circle cx="10" cy="10" r="3.5" fill="white"/>
          </svg>
          <span>Admin</span>
        </div>

        <nav className="ad-nav">
          {TABS.map(t => (
            <button
              key={t}
              className={`ad-nav-item ${tab === t ? "ad-nav-item--active" : ""}`}
              onClick={() => { setTab(t); setSearch(""); }}
            >
              {t === "Overview"  && <MapPin size={16} />}
              {t === "Locations" && <MapPin size={16} />}
              {t === "Ratings"   && <Star size={16} />}
              {t === "Users"     && <Users size={16} />}
              {t}
            </button>
          ))}
        </nav>

        <div className="ad-sidebar-footer">
          <button className="ad-back-btn" onClick={() => navigate("/map")}>
            <ArrowLeft size={14} /> Back to app
          </button>
          <div className="ad-sidebar-user">{currentUser?.email}</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ad-main">

        <div className="ad-topbar">
          <h1 className="ad-page-title">{tab}</h1>
          <div className="ad-topbar-right">
            {tab !== "Overview" && (
              <input
                className="ad-search"
                placeholder={`Search ${tab.toLowerCase()}…`}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            )}
            {tab === "Locations" && (
              <button className="ad-add-btn" onClick={openAdd}>
                <Plus size={15} /> Add Location
              </button>
            )}
            <button className="ad-refresh-btn" onClick={loadAll} title="Refresh">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="ad-loading">Loading…</div>
        ) : (
          <>
            {/* ── Overview ── */}
            {tab === "Overview" && stats && (
              <div className="ad-overview">
                <div className="ad-stats-grid">
                  <div className="ad-stat-card">
                    <div className="ad-stat-icon ad-stat-icon--purple"><MapPin size={20} /></div>
                    <div className="ad-stat-num">{stats.totalLocations}</div>
                    <div className="ad-stat-label">Locations</div>
                  </div>
                  <div className="ad-stat-card">
                    <div className="ad-stat-icon ad-stat-icon--yellow"><Star size={20} /></div>
                    <div className="ad-stat-num">{stats.totalRatings}</div>
                    <div className="ad-stat-label">Ratings</div>
                  </div>
                  <div className="ad-stat-card">
                    <div className="ad-stat-icon ad-stat-icon--blue"><VolumeX size={20} /></div>
                    <div className="ad-stat-num">{stats.avgQuietness}</div>
                    <div className="ad-stat-label">Avg Quietness</div>
                  </div>
                  <div className="ad-stat-card">
                    <div className="ad-stat-icon ad-stat-icon--green"><Users size={20} /></div>
                    <div className="ad-stat-num">{stats.totalUsers}</div>
                    <div className="ad-stat-label">Users</div>
                  </div>
                </div>

                <h2 className="ad-section-title">Recent Ratings</h2>
                <div className="ad-table-wrap">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>Location</th>
                        <th>Score</th>
                        <th>Comment</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ratings.slice(0, 10).map(r => {
                        const loc = locations.find(l => l.id === r.locationId);
                        return (
                          <tr key={r.id}>
                            <td>{loc?.name || r.locationId}</td>
                            <td><span className="ad-badge ad-badge--purple">{r.rating}/5</span></td>
                            <td className="ad-cell-comment">{r.comment || <span className="ad-muted">—</span>}</td>
                            <td className="ad-muted">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Locations ── */}
            {tab === "Locations" && (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Area</th>
                      <th>Ratings</th>
                      <th>Score</th>
                      <th>Wi-Fi</th>
                      <th>Seating</th>
                      <th>Sockets</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLocations.map(l => (
                      <tr key={l.id}>
                        <td className="ad-cell-name">{l.name}</td>
                        <td><span className={`ad-badge ad-badge--${typeColor(l.type)}`}>{l.type}</span></td>
                        <td className="ad-muted">{l.area}</td>
                        <td>{l.ratingCount || 0}</td>
                        <td>{l.quietnessScore || "—"}</td>
                        <td>{l.wifi    ? "✓" : <span className="ad-muted">✗</span>}</td>
                        <td>{l.seating ? "✓" : <span className="ad-muted">✗</span>}</td>
                        <td>{l.sockets ? "✓" : <span className="ad-muted">✗</span>}</td>
                        <td>
                          <div className="ad-row-actions">
                            <button
                              className="ad-edit-btn"
                              onClick={() => openEdit(l)}
                              title="Edit location"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="ad-delete-btn"
                              onClick={() => handleDeleteLocation(l.id, l.name)}
                              title="Delete location"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredLocations.length === 0 && <div className="ad-empty">No locations found.</div>}
              </div>
            )}

            {/* ── Ratings ── */}
            {tab === "Ratings" && (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Score</th>
                      <th>Comment</th>
                      <th>Best Time</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRatings.map(r => {
                      const loc = locations.find(l => l.id === r.locationId);
                      return (
                        <tr key={r.id}>
                          <td className="ad-cell-name">{loc?.name || r.locationId}</td>
                          <td><span className="ad-badge ad-badge--purple">{r.rating}/5</span></td>
                          <td className="ad-cell-comment">{r.comment || <span className="ad-muted">—</span>}</td>
                          <td className="ad-muted">{r.bestTime || "—"}</td>
                          <td className="ad-muted">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                          <td>
                            <button
                              className="ad-delete-btn"
                              onClick={() => handleDeleteRating(r.locationId, r.id)}
                              title="Delete rating"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredRatings.length === 0 && <div className="ad-empty">No ratings found.</div>}
              </div>
            )}

            {/* ── Users ── */}
            {tab === "Users" && (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Last Seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td className="ad-cell-name">
                          {u.photoURL && <img src={u.photoURL} alt="" className="ad-user-avatar" />}
                          {u.displayName || <span className="ad-muted">—</span>}
                        </td>
                        <td className="ad-muted">{u.email}</td>
                        <td className="ad-muted">
                          {u.lastSeen?.toDate ? u.lastSeen.toDate().toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && <div className="ad-empty">No users found.</div>}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Add Location Modal ── */}
      {showAdd && (
        <div className="ad-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="ad-modal" onClick={e => e.stopPropagation()}>
            <div className="ad-modal-header">
              <h2>{editTarget ? "Edit Location" : "Add Location"}</h2>
              <button className="ad-modal-close" onClick={closeModal}><X size={18} /></button>
            </div>

            <form className="ad-modal-form" onSubmit={handleSaveLocation}>
              <label>
                Name <span className="ad-required">*</span>
                <input
                  value={form.name}
                  onChange={field("name")}
                  placeholder="e.g. Kingston Library"
                  required
                />
              </label>

              <label>
                Type
                <select value={form.type} onChange={field("type")}>
                  <option value="library">Library</option>
                  <option value="cafe">Café</option>
                  <option value="park">Park</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label>
                Address <span className="ad-required">*</span>
                <input
                  value={form.address}
                  onChange={field("address")}
                  placeholder="e.g. Fairfield Road, Kingston upon Thames"
                  required
                />
                <span className="ad-hint">Used to auto-detect coordinates — be specific</span>
              </label>

              <label>
                Area / Neighbourhood <span className="ad-optional">(optional)</span>
                <input
                  value={form.area}
                  onChange={field("area")}
                  placeholder="e.g. Kingston upon Thames"
                />
              </label>

              <div className="ad-modal-toggles">
                <label className="ad-toggle-row">
                  <input type="checkbox" checked={form.wifi}    onChange={field("wifi")}    />
                  Wi-Fi available
                </label>
                <label className="ad-toggle-row">
                  <input type="checkbox" checked={form.seating} onChange={field("seating")} />
                  Seating available
                </label>
                <label className="ad-toggle-row">
                  <input type="checkbox" checked={form.sockets} onChange={field("sockets")} />
                  Power sockets
                </label>
              </div>

              <div className="ad-modal-actions">
                <button type="button" className="ad-modal-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="ad-modal-submit" disabled={saving}>
                  {saving ? "Saving…" : editTarget ? "Save Changes" : "Add to Map"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function typeColor(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("library")) return "purple";
  if (t.includes("cafe") || t.includes("coffee")) return "red";
  if (t.includes("park") || t.includes("garden")) return "cyan";
  return "purple";
}
