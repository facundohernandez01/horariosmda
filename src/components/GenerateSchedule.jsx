const employees = ["BF", "JG", "LL"];
const shifts = ["6-14", "14-22", "22-6"];
const shiftHours = { "6-14": [6, 14], "14-22": [14, 22], "22-6": [22, 6] };
const extraEmployees = ["Gabi", "Facu", "Extras", "Leo"];

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
    const currentShifts = shiftRotation[week % 3];
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
  }
  return schedule;
};

export default generateSchedule;