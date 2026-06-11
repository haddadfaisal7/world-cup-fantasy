import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCTd25btS1tP44IVDxr_QZIu9Q0D2hIV8M",
  authDomain: "world-cup-fantasy-c0be8.firebaseapp.com",
  projectId: "world-cup-fantasy-c0be8",
  storageBucket: "world-cup-fantasy-c0be8.firebasestorage.app",
  messagingSenderId: "337143593891",
  appId: "1:337143593891:web:2bf101c55d0f07851f3816"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };