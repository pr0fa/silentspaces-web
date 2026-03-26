const https = require("https");
const fs = require("fs");

const cities = [
  { name: "Kingston upon Thames", lat: 51.4123, lng: -0.3007 },
  { name: "Richmond", lat: 51.4613, lng: -0.3037 },
  { name: "Wimbledon", lat: 51.4214, lng: -0.2064 },
  { name: "Surbiton", lat: 51.3937, lng: -0.3068 },
  { name: "Twickenham", lat: 51.4482, lng: -0.3326 },
  { name: "Sutton", lat: 51.3618, lng: -0.1945 },
];

const types = [
  { tag: "amenity=library",         label: "Library" },
  { tag: "amenity=cafe",            label: "Café" },
  { tag: "leisure=park",            label: "Park" },
  { tag: "amenity=coworking_space", label: "Study Space" },
];

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const url = `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`;
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        if (data.trim().startsWith("<")) {
          reject(new Error("Rate limited (XML response)"));
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

async function main() {
  const results = [];
  let id = 200;

  for (const city of cities) {
    for (const type of types) {
      console.log(`Fetching ${type.label} in ${city.name}...`);
      try {
        const query = `[out:json][timeout:25];node[${type.tag}](around:2000,${city.lat},${city.lng});out body;`;
        const data = await fetchOverpass(query);
        for (const el of data.elements) {
          if (!el.tags?.name) continue;
          results.push({
            id: String(id++),
            name: el.tags.name,
            type: type.label,
            area: city.name,
            lat: el.lat,
            lng: el.lon,
            distanceKm: (Math.random() * 4 + 0.2).toFixed(1),
            quietnessScore: 0,
            ratingCount: 0,
            wifi: Math.random() > 0.4,
            seating: Math.random() > 0.3,
            sockets: Math.random() > 0.5,
            openingHours: "Mon–Fri 9AM–6PM",
            description: `A ${type.label.toLowerCase()} in ${city.name}.`,
            bestTime: "",
          });
        }
        console.log(`  ✓ found ${data.elements.filter(e => e.tags?.name).length}`);
      } catch (e) {
        console.log(`  ✗ skipped: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 4000));
    }
  }

  const unique = results.filter((loc, i, arr) =>
    arr.findIndex(l => l.name === loc.name) === i
  );

  fs.writeFileSync("src/data/south-london.json", JSON.stringify(unique, null, 2));
  console.log(`\nDone! ${unique.length} locations saved to src/data/south-london.json`);
}

main();
