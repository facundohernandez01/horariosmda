import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Box,
} from "@mui/material";
import Modales from "./components/Modales";
import {
  fetchCustomSchedules,
  fetchInactiveSchedules,
  fetchVacaciones,
} from "./firebase/firebaseFunctions";
import { fetchHolidays } from "./fetchHolidays";
import generateSchedule from "./components/GenerateSchedule";
import { colors, extraColors, daysOfWeek, extraEmployees, dayInitials, loadConfigurations } from "./config";
import InitialConfigLoader from "./InitialConfigLoader";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase/firebaseConfig";

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
  const [expandAll, setExpandAll] = useState(false); // Estado para manejar el interruptor
  const [configurations, setConfigurations] = useState({});
  const startDate = "2025-01-01";
  const numWeeks = 52;
  const schedule = generateSchedule(startDate, numWeeks);

  useEffect(() => {
    fetchHolidays(setHolidays);
    fetchCustomSchedules(setCustomSchedules);
    fetchInactiveSchedules(setInactiveSchedules);
    fetchVacaciones(setVacaciones);
    loadConfigurations().then(setConfigurations);
  }, []);

  useEffect(() => {
    const fetchConfigurations = async () => {
      const docRef = doc(db, "configuraciones", "initialConfig");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfigurations(docSnap.data());
      }
    };

    fetchConfigurations();
  }, []);

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
      />

      <TableContainer component={Paper} style={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Semana</TableCell>
              {hours.map((hour) => (
                <TableCell key={hour} style={{ minWidth: 10 }}>
                  {hour}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {schedule.map((week, index) => (
              <React.Fragment key={index}>
                {index === 0 ||
                new Date(schedule[index - 1].date).getMonth() !==
                  new Date(week.date).getMonth() ? (
                  <>
                    <TableRow
                      style={{
                        backgroundColor: "#000",
                        fontWeight: "bold",
                      }}
                    >
                      <TableCell
                        colSpan={25}
                        style={{
                          color: "#fff",
                          fontWeight: "bold",
                          textAlign: "center",
                          height: "40px",
                        }}
                      >
                        {getMonthName(week.date)}
                        {getVacacionesForMonth(
                          new Date(week.date).getMonth(),
                          new Date(week.date).getFullYear()
                        ).map((v) => (
                          <div
                            key={v.nombre}
                          >{`${v.nombre} (${v.desde} - ${v.hasta})`}</div>
                        ))}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ fontWeight: "bold" }}>
                        Horario
                      </TableCell>
                      {hours.map((hour) => (
                        <TableCell key={hour} style={{ fontWeight: "bold" }}>
                          {hour}
                        </TableCell>
                      ))}
                    </TableRow>
                  </>
                ) : null}
                <TableRow
                  style={{
                    backgroundColor: isHolidayInWeek(week) ? "#FFC0CB" : "#e0e0e0",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setExpandedWeek(expandedWeek === index ? null : index)
                  }
                >
                  <TableCell>
                    {week.date} {expandedWeek === index ? "➖" : "➕"}
                  </TableCell>
                  {hours.map((hour) => (
                    <TableCell
                      key={hour}
                      style={{
                        border: `1px solid ${
                          week.days[0].shifts[hour]
                            ? colors[week.days[0].shifts[hour]]
                            : "#000"
                        }`,
                        backgroundColor: week.days[0].shifts[hour]
                          ? colors[week.days[0].shifts[hour]]
                          : "#f0f0f0",
                        minWidth: 5,
                      }}
                    >
                      {week.days[0].shifts[hour] || ""}
                    </TableCell>
                  ))}
                  
                </TableRow>

                {(expandAll || expandedWeek === index) && (
                  <>
                                  <>
                 <Box sx={{ minHeight: "20px"}}></Box>
                </>
                    <TableRow>
                      <TableCell style={{ fontWeight: "bold" }}>
                        Horario
                      </TableCell>
                      {hours.map((hour) => (
                        <TableCell key={hour} style={{ fontWeight: "bold" }}>
                          {hour}
                        </TableCell>
                      ))}
                    </TableRow>

                    {week.days.map((day, dIndex) => (
                      <>
                      {day.date.getDay() === 6 ? <Box sx={{ minHeight: "20px"}}></Box> : null}
   
                      <TableRow
                        key={dIndex}
                        sx={{
                          backgroundColor: holidays.includes(
                            day.date.toISOString().split("T")[0]
                          )
                            ? "#FF2A25"
                            : "white",
                        }}
                      >
                        <TableCell
                          sx={{                        
                            border: "1px solid #ccc!important",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            color: holidays.includes(
                              day.date.toISOString().split("T")[0]
                            )
                              ? "white"
                              : "#000", // 🔹 Color dinámico
                          }}
                        >
                          <span>{day.date.toISOString().split("T")[0]}</span>
                          <span style={{ fontWeight: "bold" }}>
                            {dayInitials[day.date.getDay()]}
                          </span>
                        </TableCell>

                        {hours.map((hour) => {
                          const customSchedule = customSchedules.find(
                            (cs) =>
                              cs.dates &&
                              cs.dates.includes(
                                day.date.toISOString().split("T")[0]
                              ) &&
                              hour >= cs.startHour &&
                              hour < cs.endHour
                          );
                          const inactiveSchedule = inactiveSchedules.find(
                            (is) =>
                              is.day === daysOfWeek[day.date.getDay()] &&
                              hour >= is.startHour &&
                              hour < is.endHour
                          );
                          const isExtraShift =
                            day.date.getDay() === 6 && hour >= 10 && hour < 14;
                          const backgroundColor = customSchedule
                            ? customSchedule.color
                            : isExtraShift
                            ? extraColors[
                                extraEmployees[index % extraEmployees.length]
                              ]
                            : inactiveSchedule
                            ? "white"
                            : day.shifts[hour]
                            ? colors[day.shifts[hour]]
                            : "white";
                          const content = customSchedule
                            ? customSchedule.name
                            : isExtraShift
                            ? extraEmployees[index % extraEmployees.length]
                            : inactiveSchedule
                            ? ""
                            : day.shifts[hour] || "";
                          return (
                            <>
                            <TableCell
                              key={hour}
                              style={{
                                border: "1px solid #000",
                                backgroundColor,
                                color: customSchedule ? "#fff" : "#000",
                              }}
                            >
                              {content}
                            </TableCell>
                          </>

                          );
                        })}
                      </TableRow>
                      {day.date.getDay() === 0 && <Box sx={{ minHeight: "45px"}}></Box>}

                      </>
                    ))}
                  </>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ShiftScheduler;