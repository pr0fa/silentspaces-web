import { useCallback, useEffect, useRef, useState } from "react";

export const LS_PREF_WIFI    = "ss:pref:wifiRequired";
export const LS_PREF_SEATING = "ss:pref:seatingRequired";
export const LS_PREF_QUIET   = "ss:pref:quietRequired";
export const LS_PREF_SOCKETS = "ss:pref:socketsRequired";

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

export const readBool = (key, fallback = false) => {
  const raw = localStorage.getItem(key);
  return raw == null ? fallback : raw === "true";
};

const getMarkerColor = type => {
  const t = String(type || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t.includes("library"))                       return "#7C3AED";
  if (t.includes("cafe") || t.includes("coffee")) return "#F87171";
  if (t.includes("park") || t.includes("garden")) return "#06B6D4";
  return "#7C3AED";
};

const makeTeardropSvg = color =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="${color}"/><circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/></svg>`;

const USER_DOT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4285F4" opacity="0.15"><animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/></circle><circle cx="12" cy="12" r="6" fill="#4285F4" stroke="white" stroke-width="2.5"/></svg>`;

export const geocodeAddress = (query, token) =>
  fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=gb&types=place,locality,neighborhood,district&access_token=${token}`)
    .then(r => r.json());

export function useMapLogic(filtered) {
  const mapRef        = useRef(null);
  const iwRef         = useRef(null);
  const iwContentRef  = useRef(document.createElement("div"));
  const markersRef    = useRef([]);
  const iconsRef      = useRef(null);
  const userMarkerRef = useRef(null);
  const fittedRef     = useRef(false);

  const [mapReady,     setMapReady]     = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

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

  const onContainerMount = useCallback(node => {
    if (!node || mapRef.current) return;
    const map = new window.google.maps.Map(node, MAP_INIT_OPTIONS);
    map.addListener("click", () => setSelected(null));
    mapRef.current = map;
    buildIcons();
    const iw = new window.google.maps.InfoWindow({ content: iwContentRef.current, pixelOffset: new window.google.maps.Size(0, -28) });
    iw.addListener("closeclick", () => setSelected(null));
    iwRef.current = iw;
    setMapReady(true);
  }, [buildIcons]);

  useEffect(() => {
    if (!iwRef.current || !mapRef.current) return;
    if (selected) {
      iwRef.current.setPosition({ lat: Number(selected.lat), lng: Number(selected.lng) });
      iwRef.current.open(mapRef.current);
    } else {
      iwRef.current.close();
    }
  }, [selected]);

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

  useEffect(() => {
    if (fittedRef.current || !mapReady || filtered.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    filtered.forEach(loc => bounds.extend({ lat: Number(loc.lat), lng: Number(loc.lng) }));
    mapRef.current.fitBounds(bounds, 40);
    fittedRef.current = true;
  }, [filtered, mapReady]);

  const panTo = useCallback((coords, zoom) => {
    if (!mapRef.current) return;
    mapRef.current.panTo(coords);
    if (zoom != null) mapRef.current.setZoom(zoom);
  }, []);

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
