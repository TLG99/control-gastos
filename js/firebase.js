// js/firebase.js
// Inicialización de Firebase y exportación de instancias

import { initializeApp }  from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAT_16DscI-CLP4gUDSc4NFQ1CHZPKXq6E",
  authDomain:        "mis-gastos-3729d.firebaseapp.com",
  projectId:         "mis-gastos-3729d",
  storageBucket:     "mis-gastos-3729d.firebasestorage.app",
  messagingSenderId: "884277483217",
  appId:             "1:884277483217:web:932fc25d61c972e85a97f0"
};

const fbApp = initializeApp(firebaseConfig);

export const db   = getFirestore(fbApp);
export const auth = getAuth(fbApp);
