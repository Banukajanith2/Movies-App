// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCq-eMTN2MOi7JC1Pxc4Tp-_pxXH8ebkB0",
  authDomain: "movies-app-69cc5.firebaseapp.com",
  projectId: "movies-app-69cc5",
  storageBucket: "movies-app-69cc5.firebasestorage.app",
  messagingSenderId: "809038721165",
  appId: "1:809038721165:web:d999c6077cd2873f8d72c4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;