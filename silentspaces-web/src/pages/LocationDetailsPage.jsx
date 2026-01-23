import {useParams, useNavigate} from "react-router-dom";
import { useState } from "react";
import locations from "../data/locations.mock.json";

export default function LocationDetailsPage(){
  const{ id } = useParams();
  const navigate = useNavigate();

  const loc= locations.find((l) => l.id==id);
  const [favourite, setFavourite] = useState(false);

  if(!loc){
    return <div style ={{ padding: 16 }}> Location not found.</div>;
  }

  return (
    <div style = {{ padding: 16, maxWidth: 520, margin: "0 auto"}}>
      <button onClick = {() => navigate(-1)} style={{ marginBottom:12}}> ← Back </button>
   
   <div style = {{ display: "flex", justifyContent: "space-between", gap:12}}>
    <div>
    <div style={{ opacity: 0.8, marginTop: 4, fontSize: 13 }}>
            {loc.area} • {loc.type} • {loc.distanceKm} km
   </div>
</div>

<button
  onClick= {()=> setFavourite((v)=> !v)}
  title="Save to favourites"
   style={{
            fontSize: 18,
            borderRadius: 12,
            padding: "8px 12px",
            cursor: "pointer"
          }}
        >
          {favourite ? "♥" : "♡"}
        </button>
      </div>
         <div style={{ marginTop: 16, padding: 14, border: "1px solid #eee", borderRadius: 14 }}>
        <div>
          <b>Quietness:</b> {loc.quietnessScore} ({loc.ratingCount} ratings)
        </div>

        <div style={{ marginTop: 10 }}>
          <b>Facilities:</b>
          <div style={{ marginTop: 6 }}>
            Wi-Fi: {loc.wifi ? "Yes" : "No"} <br />
            Seating: {loc.seating ? "Yes" : "No"} <br />
            Sockets: {loc.sockets ? "Yes" : "No"}
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <b>Best time to visit:</b> {loc.bestTime}
        </div>
      </div>

      <button
        onClick={() => navigate(`/rate/${loc.id}`)}
        style={{
          marginTop: 16,
          width: "100%",
          padding: 12,
          borderRadius: 14,
          cursor: "pointer"
        }}
      >
        Rate this place
      </button>
    </div>
  );
}
  