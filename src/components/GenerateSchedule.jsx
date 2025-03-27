import { fechaInicioRotacion, fechaInicioRotacionAlt, turnoEmployee } from "../config";

const shifts = ["22-6", "14-22", "6-14"];
const shiftHours = { "22-6": [22, 6], "14-22": [14, 22], "6-14": [6, 14] };

const getMonday = (date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // ajustar cuando el día es domingo
  date.setDate(diff);
  return new Date(date.setHours(0, 0, 0, 0)); // asegurarse de que la hora sea 00:00:00
};

const generateSchedule = (startDate, numWeeks, rotationConfig = [], extraEmployees = []) => {
  let schedule = [];
  let date = getMonday(new Date(startDate));
  let currentRotation = ["22-6", "14-22", "6-14"];
  let rotationIndex = 0;
  let currentExtraIndex = 0;
  let employees = turnoEmployee;

  console.log("employees:", employees); // Log para verificar

  if (!Array.isArray(employees) || employees.length === 0) {
    console.error("Employees array is not defined or empty.");
    return schedule;
  }

  for (let week = 0; week < numWeeks; week++) {
    // Verificar si hay una nueva rotación a partir de esta semana
    const newRotation = rotationConfig.find(
      (config) => new Date(config.startDate) <= date
    );
    if (newRotation) {
      currentRotation = newRotation.rotation;
    }

    // Verificar si hay una fecha de inicio de rotación alternativa
    const altRotationStart = fechaInicioRotacionAlt.find(
      (altDate) => new Date(altDate) <= date
    );
    if (altRotationStart) {
      rotationIndex = Math.floor((date - new Date(altRotationStart)) / (7 * 24 * 60 * 60 * 1000));
    } else {
      rotationIndex = Math.floor((date - new Date(fechaInicioRotacion)) / (7 * 24 * 60 * 60 * 1000));
    }

    const currentShifts = currentRotation.slice(rotationIndex % currentRotation.length).concat(currentRotation.slice(0, rotationIndex % currentRotation.length));
    let weekData = { date: date.toISOString().split("T")[0], days: [], summary: {} };
    employees.forEach((employee, i) => {
      weekData.summary[currentShifts[i]] = employee;
    });

    let extendedForThisWeek = [];

    for (let d = 0; d < 7; d++) {
      let dayData = { date: new Date(date), shifts: Array(24).fill(null) };
      const dayOfWeek = dayData.date.getDay(); // 0=Dom, 1= Lun, …, 5=Vie, 6=Sáb

      employees.forEach((employee, i) => {
        const turno = currentShifts[i]; // por ejemplo "22-6"
        if (!shiftHours[turno]) {
          // Si el turno no está en shiftHours, asumimos que es un turno personalizado
          console.warn(`Turno ${turno} no es un turno estándar, se asume que es un turno personalizado.`);
          return;
        }
        let [start, end] = shiftHours[turno]; // ej: [22,6]

        if (dayOfWeek === 5 && turno === "22-6") {
          for (let h = 22; h < 24; h++) {
            dayData.shifts[h] = employee;
          }
          if (!extendedForThisWeek.includes(i)) {
            extendedForThisWeek.push(i);
          }
        } else if (turno === "22-6") {
          for (let h = 22; h < 24; h++) {
            dayData.shifts[h] = employee;
          }
          for (let h = 0; h < 6; h++) {
            dayData.shifts[h] = employee;
          }
        }
        if (dayOfWeek === 4 && turno === "22-6") {
          for (let h = 0; h < 6; h++) {
            dayData.shifts[h] = employee;
          }
        } else {
          if (start < end) {
            for (let h = start; h < end; h++) {
              dayData.shifts[h] = employee;
            }
          } else {
            for (let h = start; h < 24; h++) {
              dayData.shifts[h] = employee;
            }
            for (let h = 0; h < end; h++) {
              dayData.shifts[h] = employee;
            }
          }
        }
      });

      if (dayOfWeek === 6) {
        extendedForThisWeek.forEach((empIndex) => {
          const employee = employees[empIndex];
          for (let h = 0; h < 10; h++) {
            dayData.shifts[h] = employee;
          }
        });

        employees.forEach((employee, i) => {
          const turno = currentShifts[i];
          if (turno === "6-14") {
            for (let h = 6; h < 14; h++) {
              if (dayData.shifts[h] === null) {
                dayData.shifts[h] = employee;
              }
            }
          }
        });

        for (let h = 10; h < 14; h++) {
          dayData.shifts[h] = extraEmployees[currentExtraIndex];
        }
        currentExtraIndex = (currentExtraIndex + 1) % extraEmployees.length;
      }

      weekData.days.push(dayData);
      date.setDate(date.getDate() + 1);
    }

    schedule.push(weekData);
    rotationIndex++;
  }
  return schedule;
};

export default generateSchedule;