import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

const isEndOfMonth = (date) => {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  return nextDay.getDate() === 1;
};

const ScheduleTable = ({
  schedule,
  hours,
  holidays,
  customSchedules,
  inactiveSchedules,
  expandAll,
  expandedWeek,
  setExpandedWeek,
  getMonthName,
  getVacacionesForMonth,
  isHolidayInWeek,
  dayInitials,
  colors,
  extraColors,
  extraEmployees,
  daysOfWeek,
  turnoEmployee,
}) => {
  return (
    <TableContainer component={Paper} style={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Semana</TableCell>
            {hours.map((hour) => (
              <TableCell key={hour} style={{ minWidth: 1 }}>
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
                  {!expandAll && (
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
                            <div key={v.nombre}>{`${v.nombre} (${v.desde} - ${v.hasta})`}</div>
                          ))}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ fontWeight: "bold" }}>Horario</TableCell>
                        {hours.map((hour) => (
                          <TableCell key={hour} style={{ fontWeight: "bold" }}>
                            {hour}
                          </TableCell>
                        ))}
                      </TableRow>
                    </>
                  )}
                </>
              ) : null}
              <TableRow
                style={{
                  backgroundColor: isHolidayInWeek(week) ? "#FFC0CB" : "#e0e0e0",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onClick={() => setExpandedWeek(expandedWeek === index ? null : index)}
              >
                <TableCell>
                  {week.date} {expandedWeek === index ? "➖" : "➕"}
                </TableCell>
                {hours.map((hour) => (
                  <TableCell
                    key={hour}
                    style={{
                      border: `1px solid ${
                        week.days[0].shifts[hour] ? colors[week.days[0].shifts[hour]] : "#000"
                      }`,
                      backgroundColor: week.days[0].shifts[hour]
                        ? colors[week.days[0].shifts[hour]]
                        : "#f0f0f0",
                      minWidth: 1,
                    }}
                  >
                    {week.days[0].shifts[hour] || ""}
                  </TableCell>
                ))}
              </TableRow>

              {(expandAll || expandedWeek === index) && (
                <>
                  {expandAll && (
                    <TableRow>
                      <TableCell style={{ fontWeight: "bold" }}>Horario</TableCell>
                      {hours.map((hour) => (
                        <TableCell key={hour} style={{ fontWeight: "bold" }}>
                          {hour}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}

                  {week.days.map((day, dIndex) => (
                    <React.Fragment key={dIndex}>
                      {day.date.getDay() === 6 ? (
                        <TableRow>
                          <TableCell
                            colSpan={25}
                            style={{
                              color: "#000",
                              fontWeight: "bold",
                              textAlign: "center",
                              height: "20px",
                            }}
                          >
                            --- Fin de semana ---
                          </TableCell>
                        </TableRow>
                      ) : null}

                      <TableRow
                        sx={{
                          backgroundColor: holidays.includes(day.date.toISOString().split("T")[0])
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
                            color: holidays.includes(day.date.toISOString().split("T")[0])
                              ? "white"
                              : "#000",
                          }}
                        >
                          <span>{day.date.toISOString().split("T")[0]}</span>
                          <span style={{ fontWeight: "bold" }}>{dayInitials[day.date.getDay()]}</span>
                        </TableCell>

                        {hours.map((hour) => {
                          const customSchedule = customSchedules.find(
                            (cs) =>
                              cs.dates &&
                              cs.dates.includes(day.date.toISOString().split("T")[0]) &&
                              hour >= cs.startHour &&
                              hour < cs.endHour
                          );
                          const inactiveSchedule = inactiveSchedules.find(
                            (is) =>
                              is.day === daysOfWeek[day.date.getDay()] &&
                              hour >= is.startHour &&
                              hour < is.endHour
                          );
                          const isExtraShift = day.date.getDay() === 6 && hour >= 10 && hour < 14;
                          const backgroundColor = customSchedule
                            ? customSchedule.color
                            : isExtraShift
                            ? extraColors[extraEmployees[index % extraEmployees.length]]
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
                          );
                        })}
                      </TableRow>
                      {day.date.getDay() === 0 && (
                        <TableRow>
                          <TableCell colSpan={25} style={{ height: "45px" }}></TableCell>
                        </TableRow>
                      )}
                      {/* Verificar si es el último día del mes y el siguiente día es el 01 */}
                      {isEndOfMonth(day.date) && (
                        <TableRow>
                          <TableCell
                            colSpan={25}
                            style={{
                              color: "#fff",
                              fontWeight: "bold",
                              textAlign: "center",
                              height: "40px",
                              backgroundColor: "#000",
                            }}
                          >
{`${getMonthName(new Date(day.date.getFullYear(), day.date.getMonth() + 1, 1))} ${new Date(day.date.getFullYear(), day.date.getMonth() + 1, 1).getFullYear()}`}
</TableCell>
                        </TableRow>
                      )}
                      {/* Verificar si el día es 01 y es lunes 
                      {day.date.getDate() === 1 && day.date.getDay() === 1 && (
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
                              height: "20px",
                            }}
                          >
                            {getMonthName(day.date)} XXX
                          </TableCell>
                        </TableRow>
                      )}*/}
                    </React.Fragment>
                  ))}
                </>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ScheduleTable;