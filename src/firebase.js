import { initializeApp } from "firebase/app";
import {createUserWithEmailAndPassword, 
    getAuth, 
    signInWithEmailAndPassword,
    signOut} from "firebase/auth";
import {addDoc,
     collection, 
     getFirestore} from "firebase/firestore";
import { toast } from "react-toastify";

const firebaseConfig = {
  apiKey: "AIzaSyA-YYKqucu9KYys3IgkpIO4jpSEmF5bGKE",
  authDomain: "cinehub-55105.firebaseapp.com",
  projectId: "cinehub-55105",
  storageBucket: "cinehub-55105.firebasestorage.app",
  messagingSenderId: "456627029281",
  appId: "1:456627029281:web:c852a48f72aa689dd2ea60"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

const signup = async (name,email,password)=>{
    try{
      const res =  await createUserWithEmailAndPassword(auth,email,password);
      const user = res.user;
      await addDoc(collection(db, "user"), {
        uid: user.uid,
        name,
        authProvider: "local",
        email,

      });
    }catch(error){
        console.log(error);
        toast.error(error.code.split('/')[1].split('-').join(" "));

    }

}

const login = async (email,password)=>{
    try{
     await   signInWithEmailAndPassword(auth,email,password);


    } catch(error){
        console.log(error);
        toast.error(error.code.split('/')[1].split('-').join(" "));

    }
}

const logout = ()=>{
    signOut(auth);
}

export {auth , db ,login,signup,logout};