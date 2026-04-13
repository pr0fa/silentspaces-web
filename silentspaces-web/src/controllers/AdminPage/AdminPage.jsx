import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getAdminStats, getAdminLocations, getAdminRatings, getAdminUsers,
         addLocation, updateLocation, deleteLocation, deleteRating } from "../../models/adminModel";
import { ArrowLeft, Trash2, RefreshCw, Plus, Pencil, Menu } from "lucide-react";
import toast from "react-hot-toast";
import { TABS, EMPTY_FORM, TAB_ICONS, tc, nt, geocodeAddress, OverviewTab, LocationModal } from "./adminUtils.jsx";
import "./AdminPage.css";

function useAdminLogic() {
  const [tab,setTab]=useState("Overview"), [stats,setStats]=useState(null),    [locations,setLocations]=useState([]);
  const [ratings,setRatings]=useState([]), [users,setUsers]=useState([]),       [loading,setLoading]=useState(true);
  const [search,setSearch]=useState(""),   [showAdd,setShowAdd]=useState(false),[editTarget,setEditTarget]=useState(null);
  const [form,setForm]=useState(EMPTY_FORM),[saving,setSaving]=useState(false), [sidebarOpen,setSidebarOpen]=useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s,locs,rats,usrs] = await Promise.all([getAdminStats(),getAdminLocations(),getAdminRatings(),getAdminUsers()]);
      setStats(s); setLocations(locs); setRatings(rats); setUsers(usrs);
    } catch { toast.error("Failed to load data."); } finally { setLoading(false); }
  };
  useEffect(()=>{ loadAll(); },[]);

  const openAdd    = ()    => { setEditTarget(null); setForm(EMPTY_FORM); setShowAdd(true); };
  const openEdit   = loc   => { setEditTarget(loc); setForm({name:loc.name||"",type:nt(loc.type),address:loc.address||"",area:loc.area||"",wifi:!!loc.wifi,seating:!!loc.seating,sockets:!!loc.sockets}); setShowAdd(true); };
  const closeModal = ()    => { setShowAdd(false); setEditTarget(null); setForm(EMPTY_FORM); };

  const handleSaveLocation = async e => {
    e.preventDefault();
    if (!form.name.trim()||!form.address.trim()) { toast.error("Name and address are required."); return; }
    setSaving(true);
    try {
      const ac = !editTarget||editTarget.address!==form.address.trim();
      let lat=editTarget?.lat, lng=editTarget?.lng, area=form.area.trim()||editTarget?.area||"";
      if (ac) { const g=await geocodeAddress(form.address); lat=g.lat; lng=g.lng; area=form.area.trim()||g.area; }
      const p = {name:form.name.trim(),type:form.type,address:form.address.trim(),area,lat,lng,wifi:form.wifi,seating:form.seating,sockets:form.sockets};
      if (editTarget) { await updateLocation(editTarget.id,p); toast.success(`"${form.name}" updated.`); }
      else            { await addLocation(p); toast.success(`"${form.name}" added to the map!`); }
      closeModal(); loadAll();
    } catch(err) { toast.error(err.message||"Failed to save location."); } finally { setSaving(false); }
  };

  const delLoc = async (id,name) => { if(!window.confirm(`Delete "${name}" and all its ratings?`))return; try{await deleteLocation(id);setLocations(p=>p.filter(l=>l.id!==id));toast.success("Location deleted.");loadAll();}catch{toast.error("Failed to delete location.");} };
  const delRat = async (lid,rid) => { if(!window.confirm("Delete this rating?"))return; try{await deleteRating(lid,rid);setRatings(p=>p.filter(r=>r.id!==rid));toast.success("Rating deleted.");loadAll();}catch{toast.error("Failed to delete rating.");} };
  const field  = k => e => setForm(f=>({...f,[k]:e.target.type==="checkbox"?e.target.checked:e.target.value}));
  const q = search.toLowerCase();
  return {
    tab,setTab,stats,locations,ratings,loading,search,setSearch,
    showAdd,editTarget,form,saving,sidebarOpen,setSidebarOpen,
    loadAll,openAdd,openEdit,closeModal,handleSaveLocation,field,
    filteredLocations: locations.filter(l=>!q||(l.name||"").toLowerCase().includes(q)),
    filteredRatings:   ratings.filter(r=>!q||(r.comment||"").toLowerCase().includes(q)),
    filteredUsers:     users.filter(u=>!q||(u.displayName||"").toLowerCase().includes(q)||(u.email||"").toLowerCase().includes(q)),
    handleDeleteLocation:delLoc, handleDeleteRating:delRat,
  };
}

function DataTable({ headers, rows, renderRow, empty }) {
  return (
    <div className="ad-card ad-table-wrap">
      <table className="ad-table">
        <thead><tr>{headers.map((h,i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
      {!rows.length && <div className="ad-empty">{empty}</div>}
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const d = useAdminLogic();
  const tick = v => v ? "✓" : <span className="ad-muted">✗</span>;

  const TABS_MAP = {
    Overview:  d.stats && <OverviewTab stats={d.stats} locations={d.locations} ratings={d.ratings} />,
    Locations: <DataTable key="locations" headers={["Name","Type","Area","Ratings","Score","Wi-Fi","Seating","Sockets",""]}
                 rows={d.filteredLocations} empty="No locations found." renderRow={l => (
                   <tr key={l.id}>
                     <td data-label="Name" className="ad-cell-name">{l.name}</td>
                     <td data-label="Type"><span className={`ad-badge ad-badge--${tc(l.type)}`}>{l.type}</span></td>
                     <td data-label="Area" className="ad-muted">{l.area}</td>
                     <td data-label="Ratings">{l.ratingCount||0}</td>
                     <td data-label="Score">{l.quietnessScore||"—"}</td>
                     <td data-label="Wi-Fi">{tick(l.wifi)}</td>
                     <td data-label="Seating">{tick(l.seating)}</td>
                     <td data-label="Sockets">{tick(l.sockets)}</td>
                     <td><div className="ad-row-actions">
                       <button className="ad-btn-icon ad-btn-icon--edit" onClick={()=>d.openEdit(l)}><Pencil size={14}/></button>
                       <button className="ad-btn-icon ad-btn-icon--delete" onClick={()=>d.handleDeleteLocation(l.id,l.name)}><Trash2 size={14}/></button>
                     </div></td>
                   </tr>
                 )}/>,
    Ratings:   <DataTable key="ratings" headers={["Location","Score","Comment","Best Time","Date",""]}
                 rows={d.filteredRatings} empty="No ratings found." renderRow={r => {
                   const loc = d.locations.find(l=>l.id===r.locationId);
                   return (
                     <tr key={r.id}>
                       <td data-label="Location" className="ad-cell-name">{loc?.name||r.locationId}</td>
                       <td data-label="Score"><span className="ad-badge ad-badge--purple">{r.rating}/5</span></td>
                       <td data-label="Comment" className="ad-cell-comment">{r.comment||<span className="ad-muted">—</span>}</td>
                       <td data-label="Best Time" className="ad-muted">{r.bestTime||"—"}</td>
                       <td data-label="Date" className="ad-muted">{r.createdAt?new Date(r.createdAt).toLocaleDateString():"—"}</td>
                       <td><button className="ad-btn-icon ad-btn-icon--delete" onClick={()=>d.handleDeleteRating(r.locationId,r.id)}><Trash2 size={14}/></button></td>
                     </tr>
                   );
                 }}/>,
    Users:     <DataTable key="users" headers={["Name","Email","Last Seen"]}
                 rows={d.filteredUsers} empty="No users found." renderRow={u => (
                   <tr key={u.id}>
                     <td data-label="Name" className="ad-cell-name">
                       {u.photoURL && <img src={u.photoURL} alt="" className="ad-user-avatar"/>}
                       {u.displayName||<span className="ad-muted">—</span>}
                     </td>
                     <td data-label="Email" className="ad-muted">{u.email}</td>
                     <td data-label="Last Seen" className="ad-muted">{u.lastSeen?.toDate?u.lastSeen.toDate().toLocaleDateString():"—"}</td>
                   </tr>
                 )}/>,
  };

  return (
    <div className="ad-page">
      {d.sidebarOpen && <div className="ad-overlay" onClick={()=>d.setSidebarOpen(false)}/>}
      <aside className={`ad-sidebar ${d.sidebarOpen?"ad-sidebar--open":""}`}>
        <div className="ad-sidebar-logo">
          <svg viewBox="0 0 20 24" width="22" height="26" fill="none">
            <path d="M10 0C4.48 0 0 4.48 0 10c0 7.5 10 14 10 14S20 17.5 20 10C20 4.48 15.52 0 10 0z" fill="#7C3AED"/>
            <circle cx="10" cy="10" r="3.5" fill="white"/>
          </svg>
          <span>Admin</span>
        </div>
        <nav className="ad-nav">
          {TABS.map(t => (
            <button key={t} className={`ad-nav-item ${d.tab===t?"ad-nav-item--active":""}`}
              onClick={()=>{ d.setTab(t); d.setSearch(""); d.setSidebarOpen(false); }}>
              {TAB_ICONS[t]} {t}
            </button>
          ))}
        </nav>
        <div className="ad-sidebar-footer">
          <button className="ad-back-btn" onClick={()=>navigate("/map")}><ArrowLeft size={14}/> Back to app</button>
          <div className="ad-sidebar-user">{currentUser?.email}</div>
        </div>
      </aside>
      <main className="ad-main">
        <div className="ad-topbar">
          <div className="ad-topbar-left">
            <button className="ad-hamburger" onClick={()=>d.setSidebarOpen(o=>!o)}><Menu size={20}/></button>
            <h1 className="ad-page-title">{d.tab}</h1>
          </div>
          <div className="ad-topbar-right">
            {d.tab!=="Overview" && <input className="ad-search" placeholder={`Search ${d.tab.toLowerCase()}…`} value={d.search} onChange={e=>d.setSearch(e.target.value)}/>}
            {d.tab==="Locations" && <button className="ad-add-btn" onClick={d.openAdd}><Plus size={15}/> Add Location</button>}
            <button className="ad-refresh-btn" onClick={d.loadAll} title="Refresh"><RefreshCw size={15}/></button>
          </div>
        </div>
        {d.loading ? <div className="ad-loading">Loading…</div> : TABS_MAP[d.tab]}
      </main>
      {d.showAdd && <LocationModal editTarget={d.editTarget} form={d.form} field={d.field} saving={d.saving} onSave={d.handleSaveLocation} onClose={d.closeModal}/>}
    </div>
  );
}
