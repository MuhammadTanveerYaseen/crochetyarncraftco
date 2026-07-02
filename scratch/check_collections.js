const mongoose = require('mongoose');

async function run() {
  const MONGODB_URI = "mongodb+srv://meercoder_db_user:gXNh33Gff9n9iS7V@cluster0.wacsqlc.mongodb.net/crochet?appName=Cluster0";
  console.log("Connecting...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected. Fetching collections...");
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  for (const coll of collections) {
    const count = await db.collection(coll.name).countDocuments();
    console.log(`- ${coll.name}: ${count} documents`);
  }
  await mongoose.disconnect();
  console.log("Disconnected.");
}

run().catch(console.error);
