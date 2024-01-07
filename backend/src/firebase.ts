import admin, { ServiceAccount } from "firebase-admin";
import serviceAccount from "../service-account-key.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

export const db = admin.firestore();
