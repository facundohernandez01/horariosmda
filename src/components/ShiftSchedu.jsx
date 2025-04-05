import React, { useState, useEffect } from "react";
import { Switch, FormControlLabel, Button } from "@mui/material";
import Modales from "../components/Modales";
import { fetchCustomSchedules, fetchInactiveSchedules, fetchVacaciones } from "../firebase/firebaseFunctions";
import { fetchHolidays } from "../fetchHolidays";
import generateSchedule from "../components/GenerateSchedule";
import { colors, extraColors, daysOfWeek, extraEmployees, dayInitials, loadConfigurations, fechaInicioRotacion, fechaInicioRotacionAlt, turnoEmployee } from "../config";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import ScheduleTable from "../components/ScheduleTable";

const ShiftScheduler = () => {
  const [holidays, setHolidays] = useState([]);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [customSchedules, setCustomSchedules] = useState([]);
  const [inactiveSchedules, setInactiveSchedules] = useState([]);
  const [vacaciones, setVacaciones] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [inactiveModalOpen, setInactiveModalOpen] = useState(false);
  const [vacacionesModalOpen, setVacacionesModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [rotationModalOpen, setRotationModalOpen] = useState(false);
  const [expandAll, setExpandAll] = useState(false); // Estado para manejar el interruptor
  const [configurations, setConfigurations] = useState({});
  const [rotationConfig, setRotationConfig] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const startDate = "2025-01-01";
  const numWeeks = 52;

  useEffect(() => {
    fetchHolidays(setHolidays);
    fetchCustomSchedules(setCustomSchedules);
    fetchInactiveSchedules(setInactiveSchedules);
    fetchVacaciones(setVacaciones);
    loadConfigurations().then((config) => {
      console.log("Configurations loaded:", config); // Log para verificar
      setConfigurations(config);
      setRotationConfig(config.rotationConfig || []);
    });
  }, []);

  useEffect(() => {
    const fetchConfigurations = async () => {
      const docRef = doc(db, "configuraciones", "initialConfig");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const configData = docSnap.data();
        console.log("Fetched configurations:", configData); // Log para verificar
        setConfigurations(configData);
      }
    };

    fetchConfigurations();
  }, []);

  useEffect(() => {
    setSchedule(generateSchedule(startDate, numWeeks, rotationConfig, extraEmployees));
  }, [rotationConfig]);

  const hours = [...Array(24).keys()];

  const getMonthName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("default", { month: "long" });
  };

  const getVacacionesForMonth = (month, year) => {
    return vacaciones.filter((v) => {
      const desde = new Date(v.desde);
      const hasta = new Date(v.hasta);
      return (
        (desde.getMonth() === month && desde.getFullYear() === year) ||
        (hasta.getMonth() === month && hasta.getFullYear() === year)
      );
    });
  };

  const isHolidayInWeek = (week) => {
    return week.days.some((day) =>
      holidays.includes(day.date.toISOString().split("T")[0])
    );
  };

  const handleSaveRotation = (newRotation) => {
    setRotationConfig((prevRotationConfig) => [...prevRotationConfig, newRotation]);
  };

  return (
    <div>
      <FormControlLabel
        control={
          <Switch
            checked={expandAll}
            onChange={() => setExpandAll(!expandAll)}
          />
        }
        label="Expandir todas las semanas"
      />
      <Button variant="contained" onClick={() => setRotationModalOpen(true)}>
        Definir Rotación General
      </Button>
      <Modales
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        inactiveModalOpen={inactiveModalOpen}
        setInactiveModalOpen={setInactiveModalOpen}
        vacacionesModalOpen={vacacionesModalOpen}
        setVacacionesModalOpen={setVacacionesModalOpen}
        setCustomSchedules={setCustomSchedules}
        customSchedules={customSchedules}
        setInactiveSchedules={setInactiveSchedules}
        inactiveSchedules={inactiveSchedules}
        setVacaciones={setVacaciones}
        vacaciones={vacaciones}
        configModalOpen={configModalOpen}
        setConfigModalOpen={setConfigModalOpen}
        configurations={configurations}
        setConfigurations={setConfigurations}
        rotationModalOpen={rotationModalOpen}
        setRotationModalOpen={setRotationModalOpen}
        handleSaveRotation={handleSaveRotation}
      />

      <ScheduleTable
        schedule={schedule}
        hours={hours}
        holidays={holidays}
        customSchedules={customSchedules}
        inactiveSchedules={inactiveSchedules}
        expandAll={expandAll}
        expandedWeek={expandedWeek}
        setExpandedWeek={setExpandedWeek}
        getMonthName={getMonthName}
        getVacacionesForMonth={getVacacionesForMonth}
        isHolidayInWeek={isHolidayInWeek}
        dayInitials={dayInitials}
        colors={colors}
        extraColors={extraColors}
        extraEmployees={extraEmployees}
        daysOfWeek={daysOfWeek}
        turnoEmployee={turnoEmployee} // Pasar turnoEmployee como prop
      />
    </div>
  );
};

export default ShiftScheduler;