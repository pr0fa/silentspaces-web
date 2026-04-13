/*
  useMapLogic.js
  everything that isn't JSX for the map page lives here — marker creation,
  info window management, user location tracking, and the initial fitBounds.
  MapPage just calls this hook and renders what comes back.
*/

import { useCallback, useEffect, useRef, useState } from "react";

// localStorage keys for filter preferences — exported so MapPage and ProfilePage share the same strings
export const LS_PREF_WIFI    = "ss:pref:wifiRequired";
export const LS_PREF_SEATING = "ss:pref:seatingRequired";
export const LS_PREF_QUIET   = "ss:pref:quietRequired";
export const LS_PREF_SOCKETS = "ss:pref:socketsRequired";

// disableDefaultUI + our own zoomControl keeps the map clean without Google branding clutter.
// gestureHandling "greedy" means single-finger scroll on mobile — much better UX.
const MAP_INIT_OPTIONS = {
  center: { lat: 51.5074, lng: -0.1278 },
  zoom: 12,
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  gestureHandling: "greedy",
  renderingType: "VECTOR",       // WebGL vector tiles — smooth 60fps panning
  isFractionalZoomEnabled: true, // smooth pinch-zoom (no integer snapping)
};

// read a boolean safely from localStorage — defaults to false if the key doesn't exist yet
export const readBool = (key, fallback = false) => {
  const raw = localStorage.getItem(key);
  return raw == null ? fallback : raw === "true";
};

// maps a location type to one of our three marker colours.
// normalise + strip accents so "Café" and "cafe" both match.
const getMarkerColor = type => {
  const t = String(type || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t.includes("library"))                       return "#7C3AED";
  if (t.includes("cafe") || t.includes("coffee")) return "#F87171";
  if (t.includes("park") || t.includes("garden")) return "#06B6D4";
  return "#7C3AED";
};

// inline SVG as a data URL — the only reliable cross-browser way to get custom markers with Maps JS API v3
const makeTeardropSvg = color =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="${color}"/><circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/></svg>`;

// animated pulsing dot for the user's own location.
// optimized: false is required on the marker or the SVG animation won't play.
const USER_DOT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4285F4" opacity="0.15"><animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/></circle><circle cx="12" cy="12" r="6" fill="#4285F4" stroke="white" stroke-width="2.5"/></svg>`;

// hits Mapbox geocoding to turn an area name into lat/lng — used by the search bar
export const geocodeAddress = (query, token) =>
  fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=gb&types=place,locality,neighborhood,district&access_token=${token}`)
    .then(r => r.json());

export function useMapLogic(filtered) {
  // refs for all Google Maps objects — changes to these don't need to trigger a re-render
  const mapRef        = useRef(null);
  const iwRef         = useRef(null);
  const iwContentRef  = useRef(document.createElement("div")); // portal target for the popup
  const markersRef    = useRef([]);
  const iconsRef      = useRef(null);
  const userMarkerRef = useRef(null);
  const fittedRef     = useRef(false); // tracks whether we've done the initial fitBounds

  const [mapReady,     setMapReady]     = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // watch the user's GPS position so the dot moves if they walk around
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // silently ignore — user probably denied location access
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // build the three icon objects once and cache them — new google.maps.Size() isn't cheap
  const buildIcons = useCallback(() => {
    if (iconsRef.current) return iconsRef.current;
    const make = color => ({
      url:        `data:image/svg+xml,${encodeURIComponent(makeTeardropSvg(color))}`,
      scaledSize: new window.google.maps.Size(18, 24),
      anchor:     new window.google.maps.Point(9, 24),
    });
    iconsRef.current = { "#7C3AED": make("#7C3AED"), "#F87171": make("#F87171"), "#06B6D4": make("#06B6D4") };
    return iconsRef.current;
  }, []);

  // called by the <div ref={onContainerMount}> in MapPage — this is where the Map instance is created.
  // we can't do it earlier because the container div needs to be in the DOM first.
  const onContainerMount = useCallback(node => {
    if (!node || mapRef.current) return;
    const map = new window.google.maps.Map(node, MAP_INIT_OPTIONS);
    map.addListener("click", () => setSelected(null)); // clicking the map closes any open popup
    mapRef.current = map;
    buildIcons();
    // one shared InfoWindow that all markers reuse rather than one per marker
    const iw = new window.google.maps.InfoWindow({ content: iwContentRef.current, pixelOffset: new window.google.maps.Size(0, -28) });
    iw.addListener("closeclick", () => setSelected(null));
    iwRef.current = iw;
    setMapReady(true);
  }, [buildIcons]);

  // open or close the info window whenever the selected location changes
  useEffect(() => {
    if (!iwRef.current || !mapRef.current) return;
    if (selected) {
      iwRef.current.setPosition({ lat: Number(selected.lat), lng: Number(selected.lng) });
      iwRef.current.open(mapRef.current);
    } else {
      iwRef.current.close();
    }
  }, [selected]);

  // re-draw markers every time the filtered list changes — clear old ones first
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const icons = buildIcons();
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = filtered.map(loc => {
      const marker = new window.google.maps.Marker({
        position: { lat: Number(loc.lat), lng: Number(loc.lng) },
        map:       mapRef.current,
        icon:      icons[getMarkerColor(loc.type)],
        title:     loc.name,
        optimized: true,
      });
      marker.addListener("click", () => setSelected(loc));
      return marker;
    });
    return () => markersRef.current.forEach(m => m.setMap(null));
  }, [filtered, mapReady, buildIcons]);

  // update the user's location dot whenever GPS gives a new position
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (userMarkerRef.current) userMarkerRef.current.setMap(null);
    if (!userLocation) return;
    userMarkerRef.current = new window.google.maps.Marker({
      position: userLocation,
      map:      mapRef.current,
      icon: {
        url:        `data:image/svg+xml,${encodeURIComponent(USER_DOT_SVG)}`,
        scaledSize: new window.google.maps.Size(24, 24),
        anchor:     new window.google.maps.Point(12, 12),
      },
      zIndex:    999,
      optimized: false, // SVG animation requires this
    });
  }, [userLocation, mapReady]);

  // once on first load, fit the map to show all markers. fittedRef stops this running again on filter changes.
  useEffect(() => {
    if (fittedRef.current || !mapReady || filtered.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    filtered.forEach(loc => bounds.extend({ lat: Number(loc.lat), lng: Number(loc.lng) }));
    mapRef.current.fitBounds(bounds, 40);
    fittedRef.current = true;
  }, [filtered, mapReady]);

  // programmatic pan — used by the search bar when a user picks an area suggestion
  const panTo = useCallback((coords, zoom) => {
    if (!mapRef.current) return;
    mapRef.current.panTo(coords);
    if (zoom != null) mapRef.current.setZoom(zoom);
  }, []);

  // "locate me" — uses the already-known position if we have it, otherwise does a one-shot fetch
  const handleLocateMe = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(16);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (mapRef.current) { mapRef.current.panTo(coords); mapRef.current.setZoom(16); }
      });
    }
  }, [userLocation]);

  return { onContainerMount, selected, setSelected, handleLocateMe, panTo, iwContentRef };
}
