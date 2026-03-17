import generateSchedule from "../src/components/GenerateSchedule.js";

export default function handler(req, res) {

  const currentYear = new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1);

  const schedule = generateSchedule(startDate, 54);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const targetDate = tomorrow.toISOString().split("T")[0];

  const empleados = [];

  schedule.forEach(week => {
    week.days.forEach(day => {
      const d = day.date.toISOString().split("T")[0];

      if (d === targetDate && day.date.getDay() === 6) {
        day.shifts.forEach(emp => {
          if (emp) empleados.push(emp);
        });
      }
    });
  });

  res.status(200).json({
    fecha: targetDate,
    empleados: [...new Set(empleados)]
  });

}