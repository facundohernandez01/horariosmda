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
import ScheduleManagement, { useOvertime, overtimeOnDate } from "./components/ScheduleManagement";
import VacationWarnings, { cellVacation, coverageWarnings, VACATION_COLOR, EXTRA_COLOR } from "./components/VacationWarnings";
import StaffSettings from "./components/StaffSettings";
import {applyRotationRules} from "./components/rotationRules";
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
import { doc, onSnapshot } from "firebase/firestore";
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
  const [overtimeOpen,setOvertimeOpen]=useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [inactiveModalOpen, setInactiveModalOpen] = useState(false);
  const [vacacionesModalOpen, setVacacionesModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [configurations, setConfigurations] = useState({});

  // Cell edit modal state
  const [cellEditOpen, setCellEditOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  const { entries: overtime, error: overtimeError } = useOvertime();
  const overtimeAt = (date, hour) => overtime.filter(e => overtimeOnDate(e,date).some(s => hour >= s.start && hour < s.end));
  const { yearMonth } = useParams();
  const currentYear = Number(new Intl.DateTimeFormat("en", {year:"numeric",timeZone:"America/Argentina/Buenos_Aires"}).format(new Date()));
  const [selectedYear, setSelectedYear] = useState(() => /^\d{6}$/.test(yearMonth || "") ? Number(yearMonth.slice(0,4)) : currentYear);
  const firstYear = new Date(startDate).getFullYear();
  const numWeeks = Math.max(53, Math.ceil((Date.UTC(selectedYear + 1,0,7) - Date.UTC(firstYear,0,1))/604800000));
  const today = new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Argentina/Buenos_Aires"}).format(new Date());
  const warningYear = Math.max(currentYear+1,selectedYear,...vacaciones.map(v=>Number(v.hasta?.slice(0,4))||currentYear));
  const allWeeks = applyRotationRules(generateSchedule(new Date(startDate), Math.max(numWeeks,Math.ceil((Date.UTC(warningYear+1,0,7)-Date.UTC(firstYear,0,1))/604800000)), turnoEmployee, extraEmployees),configurations?.rotationRules);
  const schedule = allWeeks.filter(w => w.days.some(d => d.date.getFullYear() === selectedYear));
  const vacationStatus = (day,hour) => cellVacation(day,hour,vacaciones,turnoEmployee||[],extraEmployees||[],customSchedules,inactiveSchedules,configurations?.daysOfWeek||daysOfWeek);
  const warnings = coverageWarnings(allWeeks,vacaciones,turnoEmployee||[],extraEmployees||[],holidays,customSchedules,inactiveSchedules,configurations?.daysOfWeek||daysOfWeek,today);

  const weekRefs = useRef({});
  const [warningTarget,setWarningTarget] = useState(null);
  const scrollTargetRef = useRef(null); // índice al que hay que scrollear después del expand
  const targetMonth = yearMonth ? yearMonth.replace(/(\d{4})(\d{2})/, "$1-$2") : null;

  useEffect(()=>{if(!warningTarget)return;const idx=schedule.findIndex(w=>w.days.some(d=>d.date.toISOString().slice(0,10)===warningTarget));if(idx<0)return;setExpandedWeek(idx);setWarningTarget(null);requestAnimationFrame(()=>requestAnimationFrame(()=>{const el=document.getElementById("schedule-week-"+idx);el?.scrollIntoView({behavior:"smooth",block:"center"});}));},[warningTarget,selectedYear,schedule.length]);

  // 1️⃣ Cuando cambia la URL: encontrar la semana y expandirla
  useEffect(() => {
    if (!targetMonth || !schedule.length) return;
    const targetIndex = schedule.findIndex((week) => week.date.startsWith(targetMonth));
    if (targetIndex !== -1) {
      scrollTargetRef.current = targetIndex;
      setExpandedWeek(targetIndex);
    }
  }, [targetMonth, schedule.length]);

  // 2️⃣ Cuando expandedWeek cambia y hay un scroll pendiente, scrollear
  useEffect(() => {
    if (scrollTargetRef.current === null) return;
    const idx = scrollTargetRef.current;
    scrollTargetRef.current = null;

    // Esperar a que React termine de renderizar las filas expandidas
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = weekRefs.current[idx];
        if (!el) return;
        const navbarHeight = 56; // altura del sticky navbar
        const top = el.getBoundingClientRect().top + window.scrollY - navbarHeight - 8;
        window.scrollTo({ top, behavior: "smooth" });
      });
    });
  }, [expandedWeek]);

  useEffect(() => {

    fetchCustomSchedules(setCustomSchedules);
    fetchInactiveSchedules(setInactiveSchedules);
    fetchVacaciones(setVacaciones);
    loadConfigurations();
  }, []);

  useEffect(()=>onSnapshot(doc(db,"configuraciones","initialConfig"),snap=>{if(snap.exists())setConfigurations(snap.data());},error=>console.error("Error loading configuration",error)),[]);

  useEffect(()=>{let active=true;fetchHolidays(values=>{if(active)setHolidays(values);},Array.from({length:Math.max(1,warningYear-Math.min(currentYear,selectedYear)+1)},(_,i)=>Math.min(currentYear,selectedYear)+i));return()=>{active=false;};},[warningYear,currentYear,selectedYear]);

  const hours = [...Array(24).keys()];

  const getMonthName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-AR", { month: "long", year: "numeric" });
  };

  const getVacacionesForMonth = (month, year) =>
    vacaciones.filter((v) => {
      const first = `${year}-${String(month+1).padStart(2,"0")}-01`;
      const last = `${year}-${String(month+1).padStart(2,"0")}-${new Date(year,month+1,0).getDate()}`;
      return v.desde <= last && v.hasta >= first;
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
  const displayName = emp => configurations?.employeeNames?.[emp] || emp;
  const getEmpColor = (emp) => resolvedColors[emp] || resolvedExtraColors[emp] || "#444";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: "100vh", background: "#0a0a14" }}>
      {/* ── Sticky Navbar ────────────────────────────── */}
      <Navbar
        selectedYear={selectedYear}
        availableYears={Array.from({length:Math.max(currentYear+1,selectedYear)-Math.min(firstYear,currentYear)+1},(_,i)=>Math.min(firstYear,currentYear)+i)}
        onYearChange={year=>{setSelectedYear(year);setExpandedWeek(null);setWarningTarget(null);}}
        expandAll={expandAll}
        onToggleExpand={() => setExpandAll(!expandAll)}
        onAddCustom={() => setModalOpen(true)}
        onAddInactive={() => setInactiveModalOpen(true)}
        onAddVacaciones={() => setVacacionesModalOpen(true)}
        onOvertime={()=>setOvertimeOpen(true)}
        overtimeCount={overtime.filter(e=>!e.reportedAt).length}
        onConfig={() => setConfigModalOpen(true)}
      />

      <ScheduleManagement open={overtimeOpen} onClose={()=>setOvertimeOpen(false)} employees={[...new Set([...(turnoEmployee || []), ...(extraEmployees || [])])]} entries={overtime} error={overtimeError} names={configurations?.employeeNames || {}} />
      <Box sx={{px:2,pb:1,display:"flex",gap:2,flexWrap:"wrap",fontSize:12}}><span><span style={{display:"inline-block",width:16,height:10,background:VACATION_COLOR,marginRight:5}}/>Vacaciones</span><span style={{borderBottom:"3px solid "+EXTRA_COLOR}}>Extras / cobertura pendiente</span></Box>
      <VacationWarnings warnings={warnings} names={configurations?.employeeNames} onNavigate={date=>{setSelectedYear(Number(date.slice(0,4)));setWarningTarget(date);}}/>
      {/* ── Modales existentes ───────────────────────── */}
      <StaffSettings open={configModalOpen} onClose={()=>setConfigModalOpen(false)} configurations={configurations} setConfigurations={setConfigurations} operators={turnoEmployee||[]} admins={extraEmployees||[]} startDate={startDate}/>
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
        configurations={configurations}
        turnoEmployee={turnoEmployee}
        extraEmployees={extraEmployees}
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
          vacationStatus={vacationStatus}
          warningTargetIndex={expandedWeek}
          overtime={overtime}
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
                              ✈ {displayName(v.nombre)} ({v.desde} – {v.hasta})
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
                    id={"schedule-week-"+index}
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
                      const bg = vacationStatus(week.days[0],hour)==="vacation" ? VACATION_COLOR : emp ? getEmpColor(emp) : "#0d0d1e";
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
                          {displayName(emp) || ""}
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
                                  : displayName(day.shifts[hour]) || "";

                                const status = vacationStatus(day,hour);
                                const extra = overtimeAt(dateStr, hour);
                                const hasContent = content || customSchedule || extra.length;

                                return (
                                  <TableCell
                                    key={hour}
                                    className="schedule-cell"
                                    title={[status==="vacation"?"Vacaciones":status==="coverage"?"Vacaciones: sábado por cubrir":"",...extra.map(e => `${e.employee}: extra ${e.reportedAt ? "reportada" : "pendiente"}`)].filter(Boolean).join(", ")}
                                    onDoubleClick={() =>
                                      handleCellDoubleClick(day, hour, day.shifts[hour])
                                    }
                                    sx={{
                                      background: status==="vacation" ? VACATION_COLOR : backgroundColor,
                                      boxShadow: extra.length || status==="coverage" ? "inset 0 -4px "+EXTRA_COLOR : "none",
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
                                      content || extra.map(e => e.employee).join("/")
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
