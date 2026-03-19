import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { db } from "./firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

import ShiftScheduler from "./ShiftScheduler";
import ApiTurnos from "./ApiTurnos";

function App() {
  const [startDate, setStartDate] = useState(null);
  const [turnoEmployee, setTurnoEmployee] = useState(null);
  const [extraEmployees, setExtraEmployees] = useState(null);



  useEffect(() => {
    const fetchConfig = async () => {
      const snapshot = await getDocs(collection(db, "configuraciones")); // ajustá el nombre de tu colección
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.turnoEmployee) {
        setTurnoEmployee(data.turnoEmployee); // ya es ["LL", "JG", "BF"]
        }
        if (data.extraEmployees) {
        setExtraEmployees(data.extraEmployees); // ["LC", "GG", "FH", "EX"]
        }
        if (data.fechaInicioRotacion?.[0]) {
          // "2025-12-29" → new Date con hora fija para evitar desfase de timezone
          const [year, month, day] = data.fechaInicioRotacion[0].split("-").map(Number);
          setStartDate(new Date(year, month - 1, day));
        }
      });
    };
    fetchConfig();
  }, []);

  if (!startDate) return <div>Cargando...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ShiftScheduler startDate={startDate} turnoEmployee={turnoEmployee} extraEmployees={extraEmployees}/>} />
        <Route path="/api-turnos" element={<ApiTurnos startDate={startDate} turnoEmployee={turnoEmployee} extraEmployees={extraEmployees}/>} />
        <Route path="/:yearMonth" element={<ShiftScheduler startDate={startDate} turnoEmployee={turnoEmployee} extraEmployees={extraEmployees} />} />
      </Routes>
    </Router>
  );
}

export default App;