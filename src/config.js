import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase/firebaseConfig";

export let colors = {};
export let extraColors = {};
export let daysOfWeek = [];
export let extraEmployees = [];
export let dayInitials = [];
export let fechaInicioRotacion = "";
export let fechaInicioRotacionAlt = [];
export let turnoEmployee = [];

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
      fechaInicioRotacion = configData.fechaInicioRotacion;
      fechaInicioRotacionAlt = configData.fechaInicioRotacionAlt || [];
      turnoEmployee = configData.turnoEmployee || [];
      return configData;
    } else {
    }
  } catch (error) {
    console.error("Error loading configurations: ", error);
  }
};