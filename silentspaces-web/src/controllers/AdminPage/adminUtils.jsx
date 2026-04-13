// adminUtils.jsx
// shared constants, helpers, and small UI components used by AdminPage.
// keeping these here stops AdminPage from becoming a wall of code.

import { Fragment, useState, useEffect } from "react";
import { MapPin, Star, VolumeX, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { X } from "lucide-react";

// tabs shown in the sidebar — order matters for the nav
export const TABS       = ["Overview", "Locations", "Ratings", "Users"];
// blank form state used when opening the "add location" modal
export const EMPTY_FORM = { name:"", type:"library", address:"", area:"", wifi:false, seating:false, sockets:false };
// icon for each sidebar tab — kept with the tab list so they're easy to update together
export const TAB_ICONS  = { Overview:<MapPin size={16}/>, Locations:<MapPin size={16}/>, Ratings:<Star size={16}/>, Users:<Users size={16}/> };
// traffic-light colour based on quietness score
export const SCORE_CLR  = s => s>=4?"#10B981":s>=3?"#F59E0B":s>=2?"#F97316":"#EF4444";
// matches the marker colours in useMapLogic so the pie chart and the map are consistent
export const TYPE_CLRS  = { Library:"#7C3AED", Café:"#F87171", Park:"#06B6D4" };

// geocodes an address string to lat/lng via Mapbox — only called when saving a location with a new address
export async function geocodeAddress(addr) {
  const {features} = await (await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?country=gb&limit=1&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`)).json();
  if (!features?.[0]) throw new Error("Address not found");
  const f = features[0];
  return { lat:f.center[1], lng:f.center[0], area:f.context?.find(c=>c.id.startsWith("place")||c.id.startsWith("locality"))?.text||"" };
}

// normalise a type string to a CSS colour variant / short key / display label
export const tc  = t => { t=(t||"").toLowerCase(); return t.includes("library")?"purple":t.includes("cafe")||t.includes("café")||t.includes("coffee")?"red":t.includes("park")||t.includes("garden")?"cyan":"purple"; };
export const nt  = t => { t=(t||"").toLowerCase(); return t.includes("library")?"library":t.includes("cafe")||t.includes("café")||t.includes("coffee")?"cafe":t.includes("park")||t.includes("garden")?"park":"other"; };
export const clt = t => { t=(t||"").toLowerCase(); return t.includes("library")?"Library":t.includes("cafe")||t.includes("coffee")?"Café":t.includes("park")||t.includes("garden")?"Park":"Café"; };

// reusable stat tile used across the overview grid — icon, big number, small label
export function StatCard({ icon, color, value, label }) {
  return (
    <div className="ad-card ad-stat-card">
      <div className={`ad-stat-icon ad-stat-icon--${color}`}>{icon}</div>
      <div className="ad-stat-num">{value}</div>
      <div className="ad-stat-label">{label}</div>
    </div>
  );
}

export function OverviewTab({ stats, locations, ratings }) {
  // defer chart rendering until after mount so ResponsiveContainer gets a real
  // container width — in production the CSS and JS load simultaneously and the
  // container reports width 0 on the first paint, which causes Recharts to throw
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  // only show locations that have at least one rating in the bar chart
  const ratedLocs = locations.filter(l=>l.ratingCount>0).sort((a,b)=>b.quietnessScore-a.quietnessScore).slice(0,8);
  // truncate long names so they don't overflow the x-axis labels
  const barData   = ratedLocs.map(l=>({name:l.name.length>14?l.name.slice(0,13)+"…":l.name, score:Number(l.quietnessScore)}));
  // count how many locations of each type exist — feeds into the pie chart
  const typeMap   = locations.reduce((a,l)=>{const k=clt(l.type);a[k]=(a[k]||0)+1;return a},{});
  const typeData  = Object.entries(typeMap).map(([name,value])=>({name,value}));
  return (
    <div className="ad-overview">
      <div className="ad-stats-grid">
        {[[<MapPin size={20}/>,"purple",stats.totalLocations,"Locations"],[<Star size={20}/>,"yellow",stats.totalRatings,"Ratings"],
          [<VolumeX size={20}/>,"blue",stats.avgQuietness,"Avg Quietness"],[<Users size={20}/>,"green",stats.totalUsers,"Users"],
        ].map(([icon,color,value,label]) => <StatCard key={label} icon={icon} color={color} value={value} label={label}/>)}
      </div>
      <div className="ad-charts-row">
        {/* bar chart — quietness scores ranked highest to lowest, max 8 locations */}
        <div className="ad-card ad-chart-card">
          <h2 className="ad-chart-title">Quietness Score by Location</h2>
          {ratedLocs.length === 0 ? <div className="ad-chart-empty">No rated locations yet</div> : <>
            <div className="ad-chart-legend">
              {[["#10B981","4–5 Very quiet"],["#F59E0B","3–4 Moderate"],["#F97316","2–3 Noisy"],["#EF4444","0–2 Loud"]].map(([bg,lbl]) => (
                <span key={lbl}><span className="ad-legend-dot" style={{background:bg}}/>{lbl}</span>
              ))}
            </div>
            {ready ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{top:4,right:8,left:-20,bottom:40}}>
                  <XAxis dataKey="name" tick={{fontSize:11,fill:"#6B7280"}} angle={-35} textAnchor="end" interval={0}/>
                  <YAxis domain={[0,5]} tick={{fontSize:11,fill:"#6B7280"}}/>
                  <Tooltip formatter={v=>[`${v}/5`,"Quietness"]} contentStyle={{fontSize:12,borderRadius:8,border:"1px solid #E5E7EB"}}/>
                  <Bar dataKey="score" radius={[6,6,0,0]}>
                    {ratedLocs.map((l,i) => <Cell key={i} fill={SCORE_CLR(Number(l.quietnessScore))}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{height:220}}/>}
          </>}
        </div>
        {/* pie chart — shows the split of location types across the whole dataset */}
        <div className="ad-card ad-chart-card">
          <h2 className="ad-chart-title">Location Types</h2>
          {locations.length === 0 ? <div className="ad-chart-empty">No locations yet</div> : (
            ready ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                    label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {typeData.map(({name},i) => <Cell key={i} fill={TYPE_CLRS[name]||"#F87171"}/>)}
                  </Pie>
                  <Tooltip contentStyle={{fontSize:12,borderRadius:8,border:"1px solid #E5E7EB"}}/>
                </PieChart>
              </ResponsiveContainer>
            ) : <div style={{height:220}}/>
          )}
        </div>
      </div>
      {/* most recent 10 ratings — a quick pulse check on what users are saying */}
      <h2 className="ad-section-title">Recent Ratings</h2>
      <div className="ad-card ad-table-wrap">
        <table className="ad-table">
          <thead><tr>{["Location","Score","Comment","Date"].map((h,i)=><th key={i}>{h}</th>)}</tr></thead>
          <tbody>{ratings.slice(0,10).map(r => {
            const loc = locations.find(l=>l.id===r.locationId);
            return <Fragment key={r.id}><tr>
              <td data-label="Location">{loc?.name||r.locationId}</td>
              <td data-label="Score"><span className="ad-badge ad-badge--purple">{r.rating}/5</span></td>
              <td data-label="Comment" className="ad-cell-comment">{r.comment||<span className="ad-muted">—</span>}</td>
              <td data-label="Date" className="ad-muted">{r.createdAt?new Date(r.createdAt).toLocaleDateString():"—"}</td>
            </tr></Fragment>;
          })}</tbody>
        </table>
      </div>
    </div>
  );
}

// modal for adding or editing a location.
// `field` is a curried onChange handler so all form state lives in the parent hook.
export function LocationModal({ editTarget, form, field, saving, onSave, onClose }) {
  return (
    <div className="ad-modal-overlay" onClick={onClose}>
      <div className="ad-modal" onClick={e => e.stopPropagation()}>
        <div className="ad-modal-header">
          <h2>{editTarget ? "Edit Location" : "Add Location"}</h2>
          <button className="ad-modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <form className="ad-modal-form" onSubmit={onSave}>
          <label>Name <span className="ad-required">*</span>
            <input value={form.name} onChange={field("name")} placeholder="e.g. Kingston Library" required/>
          </label>
          <label>Type
            <select value={form.type} onChange={field("type")}>
              <option value="library">Library</option><option value="cafe">Café</option>
              <option value="park">Park</option><option value="other">Other</option>
            </select>
          </label>
          <label>Address <span className="ad-required">*</span>
            <input value={form.address} onChange={field("address")} placeholder="e.g. Fairfield Road, Kingston upon Thames" required/>
            <span className="ad-hint">Used to auto-detect coordinates — be specific</span>
          </label>
          <label>Area / Neighbourhood <span className="ad-optional">(optional)</span>
            <input value={form.area} onChange={field("area")} placeholder="e.g. Kingston upon Thames"/>
          </label>
          <div className="ad-modal-toggles">
            {[["wifi","Wi-Fi available"],["seating","Seating available"],["sockets","Power sockets"]].map(([k,lbl]) => (
              <label key={k} className="ad-toggle-row"><input type="checkbox" checked={form[k]} onChange={field(k)}/> {lbl}</label>
            ))}
          </div>
          <div className="ad-modal-actions">
            <button type="button" className="ad-modal-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="ad-modal-submit" disabled={saving}>
              {saving ? "Saving…" : editTarget ? "Save Changes" : "Add to Map"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
