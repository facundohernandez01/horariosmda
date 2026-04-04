import React, { useState } from "react";
import { Box, Typography, Chip, Collapse, IconButton } from "@mui/material";

/**
 * MobileScheduleView — Vista mobile optimizada.
 * Muestra semanas como cards colapsables, con cada día en una vista de bloques de turnos.
 */
const MobileScheduleView = ({
  schedule,
  holidays,
  customSchedules,
  vacaciones,
  configurations,
  expandAll,
  onCellDoubleClick,
}) => {
  const [expandedWeek, setExpandedWeek] = useState(null);
  const colors = configurations?.colors || {};
  const extraColors = configurations?.extraColors || {};

  const getColor = (emp) => colors[emp] || extraColors[emp] || "#555";

  const getMonthName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-AR", { month: "long", year: "numeric" });
  };

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Group shifts into contiguous blocks for compact display
  const getShiftBlocks = (shifts) => {
    const blocks = [];
    let i = 0;
    while (i < 24) {
      if (shifts[i]) {
        const emp = shifts[i];
        const start = i;
        while (i < 24 && shifts[i] === emp) i++;
        blocks.push({ emp, start, end: i });
      } else {
        i++;
      }
    }
    return blocks;
  };

  let lastMonth = null;

  return (
    <Box sx={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", pb: 4 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .week-card { transition: all 0.25s ease; }
        .week-card:active { transform: scale(0.99); }
        .day-row { transition: background 0.15s; }
        .shift-block { transition: transform 0.1s; }
        .shift-block:active { transform: scale(0.97); }
      `}</style>

      {schedule.map((week, index) => {
        const weekDate = new Date(week.date);
        const monthKey = `${weekDate.getFullYear()}-${weekDate.getMonth()}`;
        const showMonthHeader = monthKey !== lastMonth;
        if (showMonthHeader) lastMonth = monthKey;

        const isHolidayWeek = week.days.some((d) =>
          holidays.includes(d.date.toISOString().split("T")[0])
        );

        const isExpanded = expandAll || expandedWeek === index;

        const weekVacaciones = vacaciones.filter((v) => {
          const desde = new Date(v.desde);
          const hasta = new Date(v.hasta);
          return week.days.some((d) => d.date >= desde && d.date <= hasta);
        });

        return (
          <React.Fragment key={index}>
            {showMonthHeader && (
              <Box sx={monthHeaderStyle}>
                <Typography sx={{ fontSize: "13px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", color: "#00d4ff" }}>
                  {getMonthName(week.date)}
                </Typography>
                {weekVacaciones.map((v) => (
                  <Chip
                    key={v.nombre}
                    label={`✈ ${v.nombre}`}
                    size="small"
                    sx={{ background: "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b44", fontSize: "11px" }}
                  />
                ))}
              </Box>
            )}

            {/* Week card */}
            <Box
              className="week-card"
              sx={{
                mx: 1,
                mb: 1,
                borderRadius: "12px",
                overflow: "hidden",
                border: isHolidayWeek ? "1px solid #ff4d4d44" : "1px solid #ffffff11",
                background: "#0f0f1a",
              }}
            >
              {/* Week header — tap to expand */}
              <Box
                onClick={() => setExpandedWeek(isExpanded && !expandAll ? null : index)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: isHolidayWeek
                    ? "linear-gradient(135deg, #2d0a0a, #1a0505)"
                    : "linear-gradient(135deg, #1a1a2e, #16213e)",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: "13px", fontWeight: "700", color: "#e0e0ff" }}>
                    Semana del {week.date}
                  </Typography>
                  {/* Quick shift summary */}
                  <Box sx={{ display: "flex", gap: "6px", mt: "4px", flexWrap: "wrap" }}>
                    {Object.entries(week.summary || {}).map(([turno, emp]) => (
                      <Chip
                        key={turno}
                        label={`${emp} ${turno}`}
                        size="small"
                        sx={{
                          background: getColor(emp) + "33",
                          color: getColor(emp),
                          border: `1px solid ${getColor(emp)}55`,
                          fontSize: "10px",
                          height: "20px",
                        }}
                      />
                    ))}
                  </Box>
                </Box>
                <Typography sx={{ color: "#aab4c8", fontSize: "18px" }}>
                  {isExpanded ? "▲" : "▼"}
                </Typography>
              </Box>

              {/* Days */}
              <Collapse in={isExpanded}>
                <Box>
                  {week.days.map((day, dIndex) => {
                    const dateStr = day.date.toISOString().split("T")[0];
                    const isHoliday = holidays.includes(dateStr);
                    const dayName = dayNames[day.date.getDay()];
                    const isSaturday = day.date.getDay() === 6;
                    const isSunday = day.date.getDay() === 0;
                    const shiftBlocks = getShiftBlocks(day.shifts);

                    const dayCustom = customSchedules.filter(
                      (cs) => cs.dates?.includes(dateStr)
                    );

                    return (
                      <React.Fragment key={dIndex}>
                        {(isSaturday || isSunday) && (
                          <Box sx={{ height: "6px", background: "#ffffff05" }} />
                        )}
                        <Box
                          className="day-row"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            padding: "8px 14px",
                            borderTop: "1px solid #ffffff08",
                            background: isHoliday
                              ? "linear-gradient(135deg, #2d0a0a88, #1a050588)"
                              : isSaturday
                              ? "#ffffff05"
                              : "transparent",
                          }}
                        >
                          {/* Date label */}
                          <Box sx={{ minWidth: "64px" }}>
                            <Typography sx={{ fontSize: "11px", fontWeight: "700", color: isHoliday ? "#ff6b6b" : isSaturday ? "#f59e0b" : "#aab4c8" }}>
                              {dayName}
                            </Typography>
                            <Typography sx={{ fontSize: "11px", color: "#555" }}>
                              {dateStr.slice(5)} {/* MM-DD */}
                            </Typography>
                          </Box>

                          {/* Shift blocks */}
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px", flex: 1 }}>
                            {shiftBlocks.map((block, bi) => (
                              <Box
                                key={bi}
                                className="shift-block"
                                onDoubleClick={() =>
                                  onCellDoubleClick?.({
                                    date: day.date,
                                    hour: block.start,
                                    currentEmployee: block.emp,
                                    dayLabel: `${dayName} ${dateStr}`,
                                  })
                                }
                                sx={{
                                  background: getColor(block.emp) + "33",
                                  border: `1px solid ${getColor(block.emp)}66`,
                                  borderRadius: "6px",
                                  padding: "2px 8px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  color: getColor(block.emp),
                                  cursor: "pointer",
                                  userSelect: "none",
                                }}
                              >
                                {block.emp} {block.start}–{block.end}
                              </Box>
                            ))}

                            {dayCustom.map((cs, ci) => (
                              <Box
                                key={`cs-${ci}`}
                                sx={{
                                  background: cs.color + "33",
                                  border: `1px solid ${cs.color}66`,
                                  borderRadius: "6px",
                                  padding: "2px 8px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  color: cs.color,
                                }}
                              >
                                ● {cs.name} {cs.startHour}–{cs.endHour}
                              </Box>
                            ))}

                            {shiftBlocks.length === 0 && dayCustom.length === 0 && (
                              <Typography sx={{ fontSize: "11px", color: "#333", fontStyle: "italic" }}>
                                Sin asignación
                              </Typography>
                            )}
                          </Box>

                          {isHoliday && (
                            <Typography sx={{ fontSize: "10px", color: "#ff6b6b", fontWeight: "700", ml: 1 }}>
                              FERIADO
                            </Typography>
                          )}
                        </Box>
                      </React.Fragment>
                    );
                  })}
                </Box>
              </Collapse>
            </Box>
          </React.Fragment>
        );
      })}
    </Box>
  );
};

const monthHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
  padding: "16px 16px 8px",
  borderBottom: "1px solid #00d4ff22",
  mb: 1,
};

export default MobileScheduleView;
