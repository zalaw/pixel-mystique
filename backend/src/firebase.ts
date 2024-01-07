import { config } from "dotenv";
import admin, { ServiceAccount } from "firebase-admin";

config();

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: JSON.parse(process.env.FIREBASE_PRIVATE_KEY || "").privateKey,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

export const db = admin.firestore();
