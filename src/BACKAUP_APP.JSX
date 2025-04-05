import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Modal, Box } from "@mui/material";
import CustomScheduleForm from "./CustomScheduleForm";
import InactiveScheduleForm from "./InactiveScheduleForm";
import VacacionesForm from "./VacacionesForm";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2HjF3Bkn0q-fS76CfuOkVll6-tGlFX0g",
  authDomain: "horario-sdesk.firebaseapp.com",
  projectId: "horario-sdesk",
  storageBucket: "horario-sdesk.firebasestorage.app",
  messagingSenderId: "408148478727",
  appId: "1:408148478727:web:146e0f82a2fe83d01093a2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const employees = ["BF", "JG", "LL"];
const shifts = ["6-14", "14-22", "22-6"];
const shiftHours = { "6-14": [6, 14], "14-22": [14, 22], "22-6": [22, 6] };
const colors = { "LL": "#008080", "JG": "#FFC000", "BF": "#948A54" };

const extraEmployees = ["Gabi", "Facu", "Extras", "Leo"];
const extraColors = { "Leo": "#FF5733", "Gabi": "#33FF57", "Facu": "#3357FF", "Extras": "#FF33A1" };

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const fetchHolidays = async (setHolidays) => {
  try {
    const year = new Date().getFullYear();
    const response = await axios.get(`https://api.argentinadatos.com/v1/feriados/${year}`);
    setHolidays(response.data.map(holiday => holiday.fecha));
  } catch (error) {
    console.error("Error fetching holidays", error);
  }
};

const getMonday = (date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // ajustar cuando el día es domingo
  date.setDate(diff);
  return new Date(date.setHours(0, 0, 0, 0)); // asegurarse de que la hora sea 00:00:00
};

const generateSchedule = (startDate, numWeeks) => {
  let schedule = [];
  let date = getMonday(new Date(startDate));
  const shiftRotation = [
    ["22-6", "6-14", "14-22"],  // Semana 1
    ["14-22", "22-6", "6-14"],  // Semana 2
    ["6-14", "14-22", "22-6"],  // Semana 3
  ];

  let currentExtraIndex = 0;

  for (let week = 0; week < numWeeks; week++) {
    let shiftIndex = week % 3; // Rotación de 3 semanas
    let currentShifts = shiftRotation[shiftIndex];
    
    let weekData = { date: date.toISOString().split("T")[0], days: [], summary: {} };

    employees.forEach((employee, i) => {
      weekData.summary[currentShifts[i]] = employee;
    });

    for (let day = 0; day < 7; day++) {
      let dayData = { date: new Date(date), shifts: Array(24).fill(null) };

      employees.forEach((employee, i) => {
        let [start, end] = shiftHours[currentShifts[i]];

        if (day === 5 && start === 22) { // Extender el viernes noche hasta el sábado 10am
          end = 10;
        }

        for (let h = start; h !== end; h = (h + 1) % 24) {
          dayData.shifts[h] = employee;
        }
      });

      if (day === 6) { // Turno extra los sábados de 10 a 14
        for (let h = 10; h < 14; h++) {
          dayData.shifts[h] = extraEmployees[currentExtraIndex];
        }
        currentExtraIndex = (currentExtraIndex + 1) % extraEmployees.length;
      }

      weekData.days.push(dayData);
      date.setDate(date.getDate() + 1);
    }

    schedule.push(weekData);
  }
  return schedule;
};

const ShiftScheduler = () => {
  const [holidays, setHolidays] = useState([]);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [customSchedules, setCustomSchedules] = useState([]);
  const [inactiveSchedules, setInactiveSchedules] = useState([]);
  const [vacaciones, setVacaciones] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [inactiveModalOpen, setInactiveModalOpen] = useState(false);
  const [vacacionesModalOpen, setVacacionesModalOpen] = useState(false);
  const startDate = "2025-01-01";
  const numWeeks = 52;
  const schedule = generateSchedule(startDate, numWeeks);

  useEffect(() => {
    fetchHolidays(setHolidays);
    fetchCustomSchedules();
    fetchInactiveSchedules();
    fetchVacaciones();
  }, []);

  const fetchCustomSchedules = async () => {
    const querySnapshot = await getDocs(collection(db, "customSchedules"));
    const schedules = querySnapshot.docs.map(doc => doc.data());
    setCustomSchedules(schedules);
  };

  const fetchInactiveSchedules = async () => {
    const querySnapshot = await getDocs(collection(db, "inactiveSchedules"));
    const schedules = querySnapshot.docs.map(doc => doc.data());
    setInactiveSchedules(schedules);
  };

  const fetchVacaciones = async () => {
    const querySnapshot = await getDocs(collection(db, "vacaciones"));
    const vacaciones = querySnapshot.docs.map(doc => doc.data());
    setVacaciones(vacaciones);
  };

  const handleSaveCustomSchedule = async (customSchedule) => {
    try {
      await addDoc(collection(db, "customSchedules"), customSchedule);
      setCustomSchedules([...customSchedules, customSchedule]);
      setModalOpen(false);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleSaveInactiveSchedule = async (inactiveSchedule) => {
    try {
      await addDoc(collection(db, "inactiveSchedules"), inactiveSchedule);
      setInactiveSchedules([...inactiveSchedules, inactiveSchedule]);
      setInactiveModalOpen(false);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleSaveVacaciones = async (vacacion) => {
    try {
      await addDoc(collection(db, "vacaciones"), vacacion);
      setVacaciones([...vacaciones, vacacion]);
      setVacacionesModalOpen(false);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const hours = [...Array(24).keys()];

  const getMonthName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'long' });
  };

  const getVacacionesForMonth = (month, year) => {
    return vacaciones.filter(v => {
      const desde = new Date(v.desde);
      const hasta = new Date(v.hasta);
      return (desde.getMonth() === month && desde.getFullYear() === year) || (hasta.getMonth() === month && hasta.getFullYear() === year);
    });
  };

  return (
    <div>
      <Button variant="contained" color="primary" onClick={() => setModalOpen(true)}>
        Agregar nota o feriado
      </Button>
      <Button variant="contained" color="secondary" onClick={() => setInactiveModalOpen(true)}>
        Desactivar en serie
      </Button>
      <Button variant="contained" color="secondary" onClick={() => setVacacionesModalOpen(true)}>
        Add Vacaciones
      </Button>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
          <CustomScheduleForm onSave={handleSaveCustomSchedule} />
        </Box>
      </Modal>
      <Modal open={inactiveModalOpen} onClose={() => setInactiveModalOpen(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
          <InactiveScheduleForm onSave={handleSaveInactiveSchedule} />
        </Box>
      </Modal>
      <Modal open={vacacionesModalOpen} onClose={() => setVacacionesModalOpen(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
          <VacacionesForm onSave={handleSaveVacaciones} />
        </Box>
      </Modal>
      <TableContainer component={Paper} style={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Semana</TableCell>
              {hours.map(hour => (
                <TableCell key={hour} style={{ minWidth: 10 }}>{hour}:00</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {schedule.map((week, index) => (
              <React.Fragment key={index}>
                {index === 0 || new Date(schedule[index - 1].date).getMonth() !== new Date(week.date).getMonth() ? (
                  <TableRow style={{ backgroundColor: "#000", color: "#fff!important", fontWeight: "bold" }}>
                      <TableCell colSpan={25} style={{ color: "#fff", fontWeight: "bold", textAlign: "center"  }}>
                    {getMonthName(week.date)}
                    {getVacacionesForMonth(new Date(week.date).getMonth(), new Date(week.date).getFullYear()).map(v => (
                      <div key={v.nombre}>{`${v.nombre} (${v.desde} - ${v.hasta})`}</div>
                    ))}
                    </TableCell>
                  </TableRow>
                ) : null}
                <TableRow 
                  style={{ backgroundColor: "#e0e0e0", fontWeight: "bold", cursor: "pointer" }}
                  onClick={() => setExpandedWeek(expandedWeek === index ? null : index)}
                >
                  <TableCell>{week.date}</TableCell>
                  {hours.map(hour => (
                    <TableCell key={hour} style={{ backgroundColor: week.days[0].shifts[hour] ? colors[week.days[0].shifts[hour]] : "#f0f0f0", minWidth: 10 }}>
                      {week.days[0].shifts[hour] || ""}
                    </TableCell>
                  ))}
                </TableRow>
                {expandedWeek === index && week.days.map((day, dIndex) => (
                  <TableRow key={dIndex} style={{ backgroundColor: holidays.includes(day.date.toISOString().split("T")[0]) ? "#FF2A25" : "white" }}>
                    <TableCell style={{ color: "#000", fontWeight: "bold" }}>
                    {day.date.toISOString().split("T")[0]}
                    </TableCell>
                    {hours.map(hour => {
                      const customSchedule = customSchedules.find(cs => cs.dates && cs.dates.includes(day.date.toISOString().split("T")[0]) && hour >= cs.startHour && hour < cs.endHour);
                      const inactiveSchedule = inactiveSchedules.find(is => is.day === daysOfWeek[day.date.getDay()] && hour >= is.startHour && hour < is.endHour);
                      const isExtraShift = day.date.getDay() === 6 && hour >= 10 && hour < 14;
                      const backgroundColor = customSchedule ? customSchedule.color : (isExtraShift ? extraColors[extraEmployees[(index % extraEmployees.length)]] : (inactiveSchedule ? "white" : (day.shifts[hour] ? colors[day.shifts[hour]] : "white")));
                      const content = customSchedule ? customSchedule.name : (isExtraShift ? extraEmployees[(index % extraEmployees.length)] : (inactiveSchedule ? "" : (day.shifts[hour] || "")));
                      return (
                        <TableCell key={hour} style={{ backgroundColor, color: customSchedule ? "#fff" : "#000", minWidth: 10 }}>
                          {content}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ShiftScheduler;