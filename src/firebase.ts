import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBytlvEbk9vyqktpVdZFgryymZGs9bTEBo",
  authDomain: "streamhub-fb5cf.firebaseapp.com",
  databaseURL: "https://streamhub-fb5cf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "streamhub-fb5cf",
  storageBucket: "streamhub-fb5cf.firebasestorage.app",
  messagingSenderId: "1061267963654",
  appId: "1:1061267963654:web:2b1f18dbfebcf2baa82887",
  measurementId: "G-KGJVCMP9MM"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
