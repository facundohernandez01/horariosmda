import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import Modales from "./components/Modales";
import { fetchCustomSchedules, fetchInactiveSchedules, fetchVacaciones } from "./firebase/firebaseFunctions";
import generateSchedule from "./components/GenerateSchedule";

const colors = { "JG": "#FFC000", "LL": "#008080", "BF": "#948A54" };
const extraColors = { "Leo": "#FF5733", "Gabi": "#33FF57", "Facu": "#3357FF", "Extras": "#FF33A1" };
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const extraEmployees = ["Gabi", "Facu", "Extras", "Leo"];
const dayInitials = ["D", "L", "M", "M", "J", "V", "S"]; // Letras iniciales de los días de la semana en español

const fetchHolidays = async (setHolidays) => {
  try {
    const year = new Date().getFullYear();
    const response = await axios.get(`https://api.argentinadatos.com/v1/feriados/${year}`);
    setHolidays(response.data.map(holiday => holiday.fecha));
  } catch (error) {
    console.error("Error fetching holidays", error);
  }
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
    fetchCustomSchedules(setCustomSchedules);
    fetchInactiveSchedules(setInactiveSchedules);
    fetchVacaciones(setVacaciones);
  }, []);

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
      />
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
                      <TableCell colSpan={25} style={{ border: "1px solid #ccc", color: "#fff", fontWeight: "bold", textAlign: "center"  }}>
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
                  <TableCell>{week.date} {expandedWeek === index ? '➖' : '➕'}</TableCell>
                  {hours.map(hour => (
                    <TableCell key={hour} style={{ border: "1px solid #ccc", backgroundColor: week.days[0].shifts[hour] ? colors[week.days[0].shifts[hour]] : "#f0f0f0", minWidth: 10 }}>
                      {week.days[0].shifts[hour] || ""}
                    </TableCell>
                  ))}
                </TableRow>
                {expandedWeek === index && week.days.map((day, dIndex) => (
                  <TableRow 
  key={dIndex} 
  sx={{ 
    backgroundColor: holidays.includes(day.date.toISOString().split("T")[0]) ? "#FF2A25" : "white"
  }}
>
  <TableCell 
    sx={{ 
      border: "1px solid #ccc", 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center",
      color: holidays.includes(day.date.toISOString().split("T")[0]) ? "white" : "black" // 🔹 Color dinámico
    }}
  >
    <span>{day.date.toISOString().split("T")[0]}</span>
    <span style={{ fontWeight: "bold" }}>{dayInitials[day.date.getDay()]}</span>
  </TableCell>


                    {hours.map(hour => {
                      const customSchedule = customSchedules.find(cs => cs.dates && cs.dates.includes(day.date.toISOString().split("T")[0]) && hour >= cs.startHour && hour < cs.endHour);
                      const inactiveSchedule = inactiveSchedules.find(is => is.day === daysOfWeek[day.date.getDay()] && hour >= is.startHour && hour < is.endHour);
                      const isExtraShift = day.date.getDay() === 6 && hour >= 10 && hour < 14;
                      const backgroundColor = customSchedule ? customSchedule.color : (isExtraShift ? extraColors[extraEmployees[(index % extraEmployees.length)]] : (inactiveSchedule ? "white" : (day.shifts[hour] ? colors[day.shifts[hour]] : "white")));
                      const content = customSchedule ? customSchedule.name : (isExtraShift ? extraEmployees[(index % extraEmployees.length)] : (inactiveSchedule ? "" : (day.shifts[hour] || "")));
                      return (
                        <TableCell key={hour} style={{ border: "1px solid #ccc", backgroundColor, color: customSchedule ? "#fff" : "#000", minWidth: 10 }}>
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