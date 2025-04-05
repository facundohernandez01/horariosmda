import React, { useEffect } from "react";
import { collection, setDoc, doc } from "firebase/firestore";
import { db } from "./firebase/firebaseConfig";

const initialConfigurations = {
  colors: { JG: "#FFC000", LL: "#008080", BF: "#948A54" },
  extraColors: {
    LC: "#33FF57",
    GG: "#E46C0A",
    FH: "#3357FF",
    EX: "#FF5733",
  },
  daysOfWeek: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  extraEmployees: ["GG", "FH", "EX", "LC"],
  dayInitials: ["D", "L", "M", "M", "J", "V", "S"],
};

const InitialConfigLoader = () => {
  useEffect(() => {
    const loadInitialConfigurations = async () => {
      try {
        await setDoc(doc(collection(db, "configuraciones"), "initialConfig"), initialConfigurations);
        console.log("Initial configurations loaded successfully.");
      } catch (error) {
        console.error("Error loading initial configurations: ", error);
      }
    };

    loadInitialConfigurations();
  }, []);

  return <div>Loading initial configurations...</div>;
};

export default InitialConfigLoader;