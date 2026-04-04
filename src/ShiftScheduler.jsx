import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Modales from "./components/Modales";
import Navbar from "./Navbar";
import CellEditModal from "./CellEditModal";
import MobileScheduleView from "./MobileScheduleView";
import {
  fetchCustomSchedules,
  fetchInactiveSchedules,
  fetchVacaciones,
  handleSaveCustomSchedule,
} from "./firebase/firebaseFunctions";
import { fetchHolidays } from "./fetchHolidays";
import generateSchedule from "./components/GenerateSchedule";
import { colors, extraColors, daysOfWeek, dayInitials, loadConfigurations } from "./config";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase/firebaseConfig";
import { useParams } from "react-router-dom";

// ─── Global styles ────────────────────────────────────────────────────────────
const injectGlobalStyles = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById("shift-scheduler-styles")) return;
  const style = document.createElement("style");
  style.id = "shift-scheduler-styles";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    body {
      background: #0a0a14;
      color: #e0e0ff;
      font-family: 'DM Sans', 'Segoe UI', sans-serif;
      margin: 0;
    }

    /* ── Month header row ─────────────────────────────── */
    .month-header-row td {
      background: linear-gradient(90deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%) !important;
      color: #00d4ff !important;
      font-weight: 700 !important;
      font-size: 13px !important;
      letter-spacing: 2px !important;
      text-transform: uppercase !important;
      border-bottom: 1px solid #00d4ff44 !important;
      padding: 10px 14px !important;
    }

    /* ── Hour header row ──────────────────────────────── */
    .hours-header-row td {
      background: #0d0d1e !important;
      color: #555 !important;
      font-size: 10px !important;
      padding: 4px 0 !important;
      text-align: center !important;
      border-bottom: 1px solid #ffffff11 !important;
    }

    /* ── Week summary row ─────────────────────────────── */
    .week-summary-row td {
      cursor: pointer !important;
      transition: background 0.15s !important;
    }
    .week-summary-row:hover td {
      filter: brightness(1.1) !important;
    }

    /* ── Day row ──────────────────────────────────────── */
    .day-row td {
      border: none !important;
      border-bottom: 1px solid #ffffff08 !important;
    }

    /* ── Schedule cell ────────────────────────────────── */
    .schedule-cell {
      transition: filter 0.1s, transform 0.1s !important;
      cursor: pointer !important;
      user-select: none !important;
    }
    .schedule-cell:hover {
      filter: brightness(1.3) !important;
    }
    .schedule-cell:active {
      transform: scale(0.92) !important;
    }

    /* ── Scrollbar ────────────────────────────────────── */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0a0a14; }
    ::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #3a3a5e; }
  `;
  document.head.appendChild(style);
};

// ─── Component ────────────────────────────────────────────────────────────────
const ShiftScheduler = ({ startDate, turnoEmployee, extraEmployees }) => {
  injectGlobalStyles();

  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [holidays, setHolidays] = useState([]);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [customSchedules, setCustomSchedules] = useState([]);
  const [inactiveSchedules, setInactiveSchedules] = useState([]);
  const [vacaciones, setVacaciones] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [inactiveModalOpen, setInactiveModalOpen] = useState(false);
  const [vacacionesModalOpen, setVacacionesModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [configurations, setConfigurations] = useState({});

  // Cell edit modal state
  const [cellEditOpen, setCellEditOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  const numWeeks = 53;
  const schedule = generateSchedule(startDate, numWeeks, turnoEmployee, extraEmployees);

  const { yearMonth } = useParams();
  const weekRefs = useRef({});
  const targetMonth = yearMonth ? yearMonth.replace(/(\d{4})(\d{2})/, "$1-$2") : null;

  useEffect(() => {
    if (!targetMonth || !schedule.length) return;
    const targetIndex = schedule.findIndex((week) => week.date.startsWith(targetMonth));
    if (targetIndex !== -1) {
      setExpandedWeek(targetIndex);
      setTimeout(() => {
        weekRefs.current[targetIndex]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [targetMonth, schedule.length]);

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
      if (docSnap.exists()) setConfigurations(docSnap.data());
    };
    fetchConfigurations();
  }, []);

  const hours = [...Array(24).keys()];

  const getMonthName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-AR", { month: "long", year: "numeric" });
  };

  const getVacacionesForMonth = (month, year) =>
    vacaciones.filter((v) => {
      const desde = new Date(v.desde);
      const hasta = new Date(v.hasta);
      return (
        (desde.getMonth() === month && desde.getFullYear() === year) ||
        (hasta.getMonth() === month && hasta.getFullYear() === year)
      );
    });

  const isHolidayInWeek = (week) =>
    week.days.some((day) => holidays.includes(day.date.toISOString().split("T")[0]));

  const handleCellDoubleClick = (day, hour, currentEmployee) => {
    setSelectedCell({
      date: day.date,
      hour,
      currentEmployee,
      dayLabel: `${dayInitials[day.date.getDay()]} ${day.date.toISOString().split("T")[0]}`,
    });
    setCellEditOpen(true);
  };

  const handleCellSave = (customSchedule) => {
    handleSaveCustomSchedule(customSchedule, setCustomSchedules, customSchedules, () => {});
  };

  // ─── Resolved colors ─────────────────────────────────────────────────────
  const resolvedColors = configurations?.colors || colors;
  const resolvedExtraColors = configurations?.extraColors || extraColors;
  const getEmpColor = (emp) => resolvedColors[emp] || resolvedExtraColors[emp] || "#444";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: "100vh", background: "#0a0a14" }}>
      {/* ── Sticky Navbar ────────────────────────────── */}
      <Navbar
        expandAll={expandAll}
        onToggleExpand={() => setExpandAll(!expandAll)}
        onAddCustom={() => setModalOpen(true)}
        onAddInactive={() => setInactiveModalOpen(true)}
        onAddVacaciones={() => setVacacionesModalOpen(true)}
        onConfig={() => setConfigModalOpen(true)}
      />

      {/* ── Modales existentes ───────────────────────── */}
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

      {/* ── Cell Edit Modal ──────────────────────────── */}
      <CellEditModal
        open={cellEditOpen}
        onClose={() => setCellEditOpen(false)}
        cellInfo={selectedCell}
        configurations={{ ...configurations, turnoEmployee, extraEmployees }}
        onSave={handleCellSave}
      />

      {/* ── Vista Mobile ─────────────────────────────── */}
      {isMobile ? (
        <MobileScheduleView
          schedule={schedule}
          holidays={holidays}
          customSchedules={customSchedules}
          vacaciones={vacaciones}
          configurations={{ ...configurations, turnoEmployee, extraEmployees }}
          expandAll={expandAll}
          onCellDoubleClick={(cellInfo) => {
            setSelectedCell(cellInfo);
            setCellEditOpen(true);
          }}
        />
      ) : (
        /* ── Vista Desktop ─────────────────────────── */
        <TableContainer
          component={Paper}
          sx={{
            overflowX: "auto",
            background: "#0a0a14",
            borderRadius: 0,
            boxShadow: "none",
          }}
        >
          <Table size="small" sx={{ borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow className="hours-header-row">
                <TableCell sx={{ minWidth: "110px", background: "#0d0d1e !important", color: "#333 !important", fontSize: "10px !important" }}>
                  —
                </TableCell>
                {hours.map((hour) => (
                  <TableCell key={hour} sx={{ minWidth: "28px", textAlign: "center" }}>
                    {hour}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {schedule.map((week, index) => (
                <React.Fragment key={index}>
                  {/* Month header */}
                  {(index === 0 ||
                    new Date(schedule[index - 1].date).getMonth() !== new Date(week.date).getMonth()) && (
                    <>
                      <TableRow className="month-header-row">
                        <TableCell colSpan={25}>
                          {getMonthName(week.date)}
                          {getVacacionesForMonth(
                            new Date(week.date).getMonth(),
                            new Date(week.date).getFullYear()
                          ).map((v) => (
                            <span
                              key={v.nombre}
                              style={{
                                marginLeft: "12px",
                                fontSize: "11px",
                                color: "#f59e0b",
                                fontWeight: "500",
                                letterSpacing: "0.5px",
                              }}
                            >
                              ✈ {v.nombre} ({v.desde} – {v.hasta})
                            </span>
                          ))}
                        </TableCell>
                      </TableRow>
                      <TableRow className="hours-header-row">
                        <TableCell sx={{ background: "#0d0d1e !important", color: "#555 !important", fontSize: "10px !important" }}>
                          Horario
                        </TableCell>
                        {hours.map((h) => (
                          <TableCell key={h}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </>
                  )}

                  {/* ── Week summary row ──────────────────── */}
                  <TableRow
                    ref={(el) => (weekRefs.current[index] = el)}
                    className="week-summary-row"
                    onClick={() => setExpandedWeek(expandedWeek === index ? null : index)}
                    sx={{
                      background: isHolidayInWeek(week)
                        ? "linear-gradient(90deg, #2d0a0a, #1a0505)"
                        : "linear-gradient(90deg, #1a1a2e, #16213e)",
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: "700",
                        fontSize: "11px",
                        color: "#aab4c8",
                        whiteSpace: "nowrap",
                        borderRight: "1px solid #ffffff11 !important",
                        padding: "6px 10px !important",
                      }}
                    >
                      {week.date}{" "}
                      <span style={{ color: "#555" }}>
                        {expandedWeek === index ? "▲" : "▼"}
                      </span>
                    </TableCell>
                    {hours.map((hour) => {
                      const emp = week.days[0].shifts[hour];
                      const bg = emp ? getEmpColor(emp) : "#0d0d1e";
                      return (
                        <TableCell
                          key={hour}
                          sx={{
                            background: bg,
                            border: "1px solid #ffffff08 !important",
                            padding: "0 !important",
                            textAlign: "center",
                            fontSize: "9px",
                            fontWeight: "700",
                            color: emp ? "#fff" : "transparent",
                            minWidth: "28px",
                            height: "24px",
                          }}
                        >
                          {emp || ""}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* ── Expanded week ──────────────────────── */}
                  {(expandAll || expandedWeek === index) && (
                    <>
                      <TableRow className="hours-header-row">
                        <TableCell sx={{ background: "#0d0d1e !important", color: "#555 !important", fontSize: "10px !important" }}>
                          Horario
                        </TableCell>
                        {hours.map((h) => (
                          <TableCell key={h}>{h}</TableCell>
                        ))}
                      </TableRow>

                      {week.days.map((day, dIndex) => {
                        const dateStr = day.date.toISOString().split("T")[0];
                        const isHoliday = holidays.includes(dateStr);
                        const isSat = day.date.getDay() === 6;
                        const isSun = day.date.getDay() === 0;

                        return (
                          <React.Fragment key={dIndex}>
                            {(isSat || isSun) && (
                              <TableRow>
                                <TableCell
                                  colSpan={25}
                                  sx={{ height: "6px", background: "#ffffff05 !important", border: "none !important", padding: "0 !important" }}
                                />
                              </TableRow>
                            )}

                            <TableRow
                              className="day-row"
                              sx={{
                                background: isHoliday
                                  ? "linear-gradient(90deg, #2d0a0a88, transparent)"
                                  : isSat
                                  ? "#ffffff04"
                                  : "transparent",
                              }}
                            >
                              {/* Date label */}
                              <TableCell
                                sx={{
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  color: isHoliday ? "#ff6b6b" : isSat ? "#f59e0b" : "#aab4c8",
                                  whiteSpace: "nowrap",
                                  borderRight: "1px solid #ffffff11 !important",
                                  padding: "4px 10px !important",
                                  minWidth: "110px",
                                }}
                              >
                                <span>{dateStr}</span>
                                <span style={{ marginLeft: "6px", color: "#444", fontWeight: "400" }}>
                                  {dayInitials[day.date.getDay()]}
                                </span>
                                {isHoliday && (
                                  <span style={{ marginLeft: "4px", fontSize: "9px", color: "#ff6b6b" }}>●</span>
                                )}
                              </TableCell>

                              {/* Hour cells */}
                              {hours.map((hour) => {
                                const customSchedule = customSchedules.find(
                                  (cs) =>
                                    cs.dates?.includes(dateStr) &&
                                    hour >= cs.startHour &&
                                    hour < cs.endHour
                                );
                                const inactiveSchedule = inactiveSchedules.find(
                                  (is) =>
                                    is.day === (configurations?.daysOfWeek || daysOfWeek)[day.date.getDay()] &&
                                    hour >= is.startHour &&
                                    hour < is.endHour
                                );
                                const isExtraShift = day.date.getDay() === 6 && hour >= 10 && hour < 14;

                                const backgroundColor = customSchedule
                                  ? customSchedule.color
                                  : isExtraShift
                                  ? getEmpColor(day.shifts[hour])
                                  : inactiveSchedule
                                  ? "#0d0d1e"
                                  : day.shifts[hour]
                                  ? getEmpColor(day.shifts[hour])
                                  : "#0d0d1e";

                                const content = customSchedule
                                  ? customSchedule.name
                                  : inactiveSchedule
                                  ? ""
                                  : day.shifts[hour] || "";

                                const hasContent = content || customSchedule;

                                return (
                                  <TableCell
                                    key={hour}
                                    className="schedule-cell"
                                    onDoubleClick={() =>
                                      handleCellDoubleClick(day, hour, day.shifts[hour])
                                    }
                                    sx={{
                                      background: backgroundColor,
                                      border: "1px solid #ffffff08 !important",
                                      padding: "0 !important",
                                      textAlign: "center",
                                      fontSize: "9px",
                                      fontWeight: "700",
                                      color: hasContent ? "#fff" : "transparent",
                                      height: "22px",
                                      minWidth: "28px",
                                      position: "relative",
                                    }}
                                  >
                                    {customSchedule ? (
                                      <Tooltip title={customSchedule.name} arrow placement="top">
                                        <span
                                          style={{
                                            display: "block",
                                            width: "100%",
                                            height: "100%",
                                            fontSize: "8px",
                                            lineHeight: "22px",
                                            color: "#fff",
                                          }}
                                        >
                                          ●
                                        </span>
                                      </Tooltip>
                                    ) : (
                                      content
                                    )}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          </React.Fragment>
                        );
                      })}
                    </>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ShiftScheduler;
