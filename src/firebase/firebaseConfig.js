// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBSRZ8SpH07iaZ21J8OpVL8gTvlKRf-juY",
  authDomain: "quant-grant-finder.firebaseapp.com",
  projectId: "quant-grant-finder",
  storageBucket: "quant-grant-finder.firebasestorage.app",
  messagingSenderId: "211312784788",
  appId: "1:211312784788:web:66261c86f605aaaccf8b81",
  measurementId: "G-RQM3X2Q15C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
