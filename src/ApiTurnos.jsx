import generateSchedule from "./components/GenerateSchedule";
import { useState, useEffect } from "react";
import axios from "axios";
import { fetchVacaciones } from "./firebase/firebaseFunctions";
// ==============================
// Helpers
// ==============================

const formatDate = (date) => date.toISOString().split("T")[0];

// ------------------------------
// 1. SÁBADO PRÓXIMO
// ------------------------------
const getNextSaturday = (schedule) => {
  const today = new Date();
  const day = today.getDay();

  const daysUntilSaturday = (6 - day + 7) % 7 || 7;

  const nextSaturday = new Date();
  nextSaturday.setDate(today.getDate() + daysUntilSaturday);

  const targetDate = formatDate(nextSaturday);

  let empleados = [];

  schedule.forEach((week) => {
    week.days.forEach((day) => {
      const d = formatDate(day.date);

      if (d === targetDate && day.date.getDay() === 6) {
        for (let h = 10; h < 14; h++) {
          const emp = day.shifts[h];
          if (emp) empleados.push(emp);
        }
      }
    });
  });

  return {
    fecha: targetDate,
    empleados: [...new Set(empleados)],
  };
};

// ------------------------------
// 2. SEMANA PRÓXIMA
// ------------------------------
const getNextWeekShifts = (schedule) => {
  const today = new Date();

  // calcular próximo lunes
  const day = today.getDay();
  const daysUntilMonday = (8 - day) % 7 || 7;

  const nextMonday = new Date();
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);

  const targetDate = nextMonday.toISOString().split("T")[0];

  let weekFound = null;

  // encontrar la semana correcta
  schedule.forEach((week) => {
    if (week.date === targetDate) {
      weekFound = week;
    }
  });

  if (!weekFound) return null;

  const s = weekFound.summary;

  // 🔁 ROTACIÓN HACIA ATRÁS (la clave)
    return {
      desde: targetDate,
      mañana: s["6-14"],
      tarde:  s["14-22"],
      noche:  s["22-6"],
    };
};
// ------------------------------
// 3. TURNO PARA UNA FECHA
// ------------------------------
const getShiftForDate = (schedule, targetDate) => {
  let result = null;

  schedule.forEach((week) => {
    week.days.forEach((day) => {
      const d = formatDate(day.date);

      if (d === targetDate) {
        result = {
          mañana: day.shifts[6],
          tarde: day.shifts[14],
          noche: day.shifts[22],
        };
      }
    });
  });

  return result;
};

// ------------------------------
// 4. FERIADOS (config simple)
// ------------------------------


// (opcional) custom overrides
const CUSTOM_HOLIDAYS = {
  // ejemplo:
  // "2026-03-24": { "LL": "22 a 10" }
};

const getNextHoliday = (schedule, holidays) => {
  const today = new Date();

  const nextHoliday = holidays
    .sort()
    .find((h) => new Date(h + "T00:00:00") > today); // T00:00:00 evita desfase timezone

  if (!nextHoliday) return null;

  if (CUSTOM_HOLIDAYS[nextHoliday]) {
    return {
      fecha: nextHoliday,
      tipo: "custom",
      detalle: CUSTOM_HOLIDAYS[nextHoliday],
    };
  }

  return {
    fecha: nextHoliday,
    tipo: "normal",
    turnos: getShiftForDate(schedule, nextHoliday),
  };
};
// ==============================
//  VACACIONES
// ==============================
const getProximaVacacion = (vacaciones) => {
  const today = new Date();

  const proxima = vacaciones
    .filter((v) => new Date(v.hasta + "T00:00:00") >= today) // no mostrar las ya terminadas
    .sort((a, b) => new Date(a.desde) - new Date(b.desde))   // ordenar por fecha
    .find((v) => new Date(v.desde + "T00:00:00") >= today);  // la próxima que no empezó

  if (!proxima) return null;

  return {
    nombre: proxima.nombre,
    desde: proxima.desde,
    hasta: proxima.hasta,
  };
};
// ==============================
// COMPONENTE PRINCIPAL
// ==============================
const ApiTurnos = ({ startDate, turnoEmployee, extraEmployees }) => {
  const [holidays, setHolidays] = useState([]);
  const currentYear = new Date().getFullYear();
  const [vacaciones, setVacaciones] = useState([]);
  useEffect(() => {
    fetchVacaciones(setVacaciones);
  }, []);
  const schedule = generateSchedule(startDate, 54, turnoEmployee, extraEmployees);
  useEffect(() => {
    const year = new Date().getFullYear();
    axios.get(`https://api.argentinadatos.com/v1/feriados/${year}`)
      .then((res) => setHolidays(res.data.map((h) => h.fecha)))
      .catch((err) => console.error("Error fetching holidays", err));
  }, []);
  // 🔍 DEBUG - sacalo después de resolver
  console.log("startDate recibido:", startDate);
  console.log("Primeras 3 semanas generadas:");
  schedule.slice(0, 3).forEach((week, i) => {
    console.log(`Semana ${i + 1} (week%3=${i%3}):`, week.date, week.summary);
  });
  const sabado_proximo = getNextSaturday(schedule);
  const semana_proxima = getNextWeekShifts(schedule);
  const proximo_feriado = getNextHoliday(schedule, holidays);
  const vacacion = getProximaVacacion(vacaciones); // ✅ nuevo

  const result = {
    sabado_proximo,
    semana_proxima,
    proximo_feriado,
    proxima_vacacion: vacacion
  };

  return (
    <pre style={{ fontSize: "14px" }}>
      {JSON.stringify(result, null, 2)}
    </pre>
  );
};

export default ApiTurnos;