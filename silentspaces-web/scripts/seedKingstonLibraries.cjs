const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBpVhVsottH7rgAN4ssuuCtVYwdkM2hj2s",
  authDomain: "silentspaces-38398.firebaseapp.com",
  projectId: "silentspaces-38398",
  storageBucket: "silentspaces-38398.firebasestorage.app",
  messagingSenderId: "500169237282",
  appId: "1:500169237282:web:0939906a9c725ec7167b7b",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const libraries = [
  {
    id: "ku_penrhyn",
    name: "Kingston University Penrhyn Road Library",
    type: "Library",
    area: "Kingston upon Thames",
    lat: 51.4079,
    lng: -0.3044,
    distanceKm: "0.3",
    quietnessScore: 4.5,
    ratingCount: 18,
    wifi: true,
    seating: true,
    sockets: true,
    openingHours: "Mon–Fri 8AM–9PM, Sat–Sun 10AM–6PM",
    description: "Kingston University's main Penrhyn Road campus library. Quiet study spaces, group rooms and 24-hour access during exam periods.",
    bestTime: "Morning",
  },
  {
    id: "ku_kingston_hill",
    name: "Kingston University Kingston Hill Library",
    type: "Library",
    area: "Kingston upon Thames",
    lat: 51.4247,
    lng: -0.2785,
    distanceKm: "1.2",
    quietnessScore: 4.3,
    ratingCount: 14,
    wifi: true,
    seating: true,
    sockets: true,
    openingHours: "Mon–Fri 8:30AM–8PM, Sat 10AM–5PM",
    description: "Kingston University's Kingston Hill campus library. Quiet individual study areas and computer workstations.",
    bestTime: "Morning",
  },
];

async function main() {
  for (const lib of libraries) {
    await setDoc(doc(db, "locations", lib.id), lib);
    console.log(`✓ Seeded: ${lib.name}`);
  }

  // Add some ratings for each
  const ratings = [
    { rating: 5, comment: "Perfect for exam revision, very quiet.", bestTime: "Morning" },
    { rating: 4, comment: "Great facilities, always a seat available.", bestTime: "Afternoon" },
    { rating: 5, comment: "My go-to study spot on campus.", bestTime: "Morning" },
    { rating: 4, comment: "Quiet and well equipped.", bestTime: "Evening" },
    { rating: 5, comment: "Love the silent study zones.", bestTime: "Morning" },
  ];

  for (const lib of libraries) {
    for (let i = 0; i < ratings.length; i++) {
      const { setDoc: sd, doc: d, collection } = require("firebase/firestore");
      await setDoc(doc(db, "locations", lib.id, "ratings", `r_${i}`), {
        ...ratings[i],
        createdAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
      });
    }
    console.log(`✓ Ratings added for: ${lib.name}`);
  }

  console.log("\nDone!");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
