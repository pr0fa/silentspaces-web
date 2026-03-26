const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, setDoc, updateDoc, getDocs } = require("firebase/firestore");

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

const comments = [
  "Really peaceful spot, great for studying.",
  "Surprisingly quiet for this area.",
  "Gets busy after lunch but mornings are great.",
  "Good facilities, would recommend.",
  "A bit noisy at peak times but generally quiet.",
  "Perfect for focused work.",
  "Lovely atmosphere, very relaxing.",
  "Decent spot, could be quieter at times.",
  "Not bad, a little noisy on weekends.",
  "Quiet and comfortable, good facilities.",
];

const bestTimes = ["Morning", "Afternoon", "Evening", "Weekends", ""];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate() {
  const now = Date.now();
  const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
  return new Date(sixMonthsAgo + Math.random() * (now - sixMonthsAgo));
}

async function main() {
  const snapshot = await getDocs(collection(db, "locations"));
  const locations = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  // Only seed locations with no ratings
  const unseeded = locations.filter(l => !l.ratingCount || l.ratingCount === 0);
  console.log(`Seeding ratings for ${unseeded.length} locations...`);

  for (const loc of unseeded) {
    const numRatings = randomBetween(2, 12);
    let totalScore = 0;

    for (let i = 0; i < numRatings; i++) {
      const rating = randomBetween(2, 5);
      totalScore += rating;
      const ratingId = `seeded_${i}_${Date.now()}`;
      await setDoc(doc(db, "locations", loc.id, "ratings", ratingId), {
        rating,
        comment: Math.random() > 0.3 ? comments[Math.floor(Math.random() * comments.length)] : "",
        bestTime: bestTimes[Math.floor(Math.random() * bestTimes.length)],
        createdAt: randomDate(),
      });
    }

    const avg = Math.round((totalScore / numRatings) * 10) / 10;
    await updateDoc(doc(db, "locations", loc.id), {
      quietnessScore: avg,
      ratingCount: numRatings,
    });

    process.stdout.write(".");
  }

  console.log(`\nDone! Ratings seeded for ${unseeded.length} locations.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
