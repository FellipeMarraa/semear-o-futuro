import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

// Configuração do Firebase - substitua pelos seus dados
const firebaseConfig = {
  apiKey: "AIzaSyCrItfc6SeICVNuj8-xKL7TY2vq-6xn4Os",
  authDomain: "semear-o-futuro.firebaseapp.com",
  projectId: "semear-o-futuro",
  storageBucket: "semear-o-futuro.firebasestorage.app",
  messagingSenderId: "118577810469",
  appId: "1:118577810469:web:4cdb5ad9faf290d2e403cc",
  measurementId: "G-2TMN7Z4WX6"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Exportar serviços
export const db = getFirestore(app)
export const auth = getAuth(app)
export default app
