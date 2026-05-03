import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDHfmraTSNIE2YhjrGPvFlcvA-KlAIQUSw",
  authDomain: "stealthpay-afb63.firebaseapp.com",
  projectId: "stealthpay-afb63",
  storageBucket: "stealthpay-afb63.firebasestorage.app",
  messagingSenderId: "486334082132",
  appId: "1:486334082132:web:0b8ee222a971a9a009d1c1",
  measurementId: "G-J604SG5G88"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
