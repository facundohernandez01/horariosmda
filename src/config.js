import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase/firebaseConfig";

export let colors = {};
export let extraColors = {};
export let daysOfWeek = [];
export let extraEmployees = [];
export let dayInitials = [];

export const loadConfigurations = async () => {
  try {
    const docRef = doc(db, "configuraciones", "initialConfig");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const configData = docSnap.data();
      colors = configData.colors;
      extraColors = configData.extraColors;
      daysOfWeek = configData.daysOfWeek;
      extraEmployees = configData.extraEmployees;
      dayInitials = configData.dayInitials;
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error loading configurations: ", error);
  }
};