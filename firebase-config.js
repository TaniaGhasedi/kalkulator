
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// Firebase-konfigurasjon
const firebaseConfig = {
    apiKey: "AIzaSyBrZOQzjpCaUQo8CDU2kiAYlsbADpYS2eo",
    authDomain: "taniassecrethelper.firebaseapp.com",
    projectId: "taniassecrethelper",
    storageBucket: "taniassecrethelper.firebasestorage.app",
    messagingSenderId: "184018074058",
    appId: "1:184018074058:web:13bdbceb3e87bad3247733"
};

// Start Firebase
const app = initializeApp(firebaseConfig);

// Innlogging uten passord
export const auth = getAuth(app);

// Database for notater
export const db = getFirestore(app);
