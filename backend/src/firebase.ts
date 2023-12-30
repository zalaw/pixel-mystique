import admin, { ServiceAccount } from "firebase-admin";
import serviceAccount from "./pixel-mystique-firebase-adminsdk-llfw8-8ce1b18383.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

export const db = admin.firestore();
