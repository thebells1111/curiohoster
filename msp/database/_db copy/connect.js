import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const { MONGO_URI_SF, MONGO_DB_SF } = process.env;

if (!MONGO_URI_SF) {
  throw new Error(
    "Please define the mongoURI property inside config/default.json"
  );
}

if (!MONGO_DB_SF) {
  throw new Error(
    "Please define the mongoDB property inside config/default.json"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoSF;

if (!cached) {
  cached = global.mongoSF = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cached.promise = MongoClient.connect(MONGO_URI_SF, opts).then((client) => {
      return {
        client,
        db: client.db(MONGO_DB_SF),
      };
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export async function getCollection(collection) {
  const dbConnection = await connectToDatabase();
  const db = dbConnection.db;
  return db.collection(collection);
}
