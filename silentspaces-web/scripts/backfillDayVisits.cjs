const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, updateDoc } = require("firebase/firestore");

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

async function backfill() {
  const locSnap = await getDocs(collection(db, "locations"));
  console.log(`Processing ${locSnap.size} locations...`);

  for (const locDoc of locSnap.docs) {
    const ratingsSnap = await getDocs(collection(db, "locations", locDoc.id, "ratings"));
    const dayVisits = [0, 0, 0, 0, 0, 0, 0];

    ratingsSnap.docs.forEach((r) => {
      const ts = r.data().createdAt;
      if (ts) {
        const day = ts.toDate().getDay();
        dayVisits[day]++;
      }
    });

    const maxDay = Math.max(...dayVisits);
    const totalVisits = dayVisits.reduce((a, b) => a + b, 0);
    const ratio = totalVisits > 0 ? maxDay / totalVisits : 0;
    const busynessLevel = ratio >= 0.35 ? "High" : ratio >= 0.2 ? "Mid" : "Low";

    await updateDoc(doc(db, "locations", locDoc.id), { dayVisits, busynessLevel });
    console.log(`✓ ${locDoc.data().name} → ${busynessLevel} (ratio: ${ratio.toFixed(2)})`);
  }

  console.log("Done!");
  process.exit(0);
}

backfill().catch((e) => { console.error(e); process.exit(1); });
