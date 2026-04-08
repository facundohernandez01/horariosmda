export const config = { runtime: "edge" };

// ==============================
// CONFIG FIREBASE
// ==============================
const PROJECT_ID = "horario-sdesk";
const API_KEY = "AIzaSyD2HjF3Bkn0q-fS76CfuOkVll6-tGlFX0g";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ==============================
// FIRESTORE REST HELPERS
// ==============================
const firestoreGet = async (collection) => {
  const res = await fetch(`${FIRESTORE_BASE}/${collection}?key=${API_KEY}`);
  if (!res.ok) throw new Error(`Firestore error: ${res.status}`);
  return res.json();
};

const parseFirestoreValue = (val) => {
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue);
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.arrayValue !== undefined)
    return (val.arrayValue.values || []).map(parseFirestoreValue);
  if (val.mapValue !== undefined) {
    const obj = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      obj[k] = parseFirestoreValue(v);
    }
    return obj;
  }
  return null;
};

const parseDoc = (doc) => {
  const out = {};
  for (const [k, v] of Object.entries(doc.fields || {})) {
    out[k] = parseFirestoreValue(v);
  }
  return out;
};

// ==============================
// GENERATE SCHEDULE (igual que GenerateSchedule.jsx)
// ==============================
const shiftHours = { "6-14": [6, 14], "14-22": [14, 22], "22-6": [22, 6] };

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return new Date(d.setHours(0, 0, 0, 0));
};

const generateSchedule = (startDate, numWeeks, employees = ["BF", "JG", "LL"], extraEmployees = ["LC", "GG", "FH", "EX"]) => {
  let schedule = [];
  let date = getMonday(new Date(startDate));
  const shiftRotation = [
    ["22-6", "6-14", "14-22"],
    ["14-22", "22-6", "6-14"],
    ["6-14", "14-22", "22-6"],
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
      const dayOfWeek = dayData.date.getDay();

      employees.forEach((employee, i) => {
        const turno = currentShifts[i];
        let [start, end] = shiftHours[turno];

        if (dayOfWeek === 5 && turno === "22-6") {
          for (let h = 22; h < 24; h++) dayData.shifts[h] = employee;
          if (!extendedForThisWeek.includes(i)) extendedForThisWeek.push(i);
        } else if (turno === "22-6") {
          for (let h = 22; h < 24; h++) dayData.shifts[h] = employee;
          for (let h = 0; h < 6; h++) dayData.shifts[h] = employee;
        }
        if (dayOfWeek === 4 && turno === "22-6") {
          for (let h = 0; h < 6; h++) dayData.shifts[h] = employee;
        } else {
          if (start < end) {
            for (let h = start; h < end; h++) dayData.shifts[h] = employee;
          } else {
            for (let h = start; h < 24; h++) dayData.shifts[h] = employee;
            for (let h = 0; h < end; h++) dayData.shifts[h] = employee;
          }
        }
      });

      if (dayOfWeek === 6) {
        extendedForThisWeek.forEach((empIndex) => {
          const employee = employees[empIndex];
          for (let h = 0; h < 10; h++) dayData.shifts[h] = employee;
        });
        employees.forEach((employee, i) => {
          const turno = currentShifts[i];
          if (turno === "6-14") {
            for (let h = 6; h < 14; h++) {
              if (dayData.shifts[h] === null) dayData.shifts[h] = employee;
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

// ==============================
// HELPERS DE CÁLCULO
// ==============================
const formatDate = (date) => new Date(date).toISOString().split("T")[0];

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
      if (d === targetDate && new Date(day.date).getDay() === 6) {
        for (let h = 10; h < 14; h++) {
          const emp = day.shifts[h];
          if (emp) empleados.push(emp);
        }
      }
    });
  });
  return { fecha: targetDate, empleados: [...new Set(empleados)] };
};

const getNextWeekShifts = (schedule) => {
  const today = new Date();
  const day = today.getDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  const nextMonday = new Date();
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  const targetDate = nextMonday.toISOString().split("T")[0];
  const weekFound = schedule.find((w) => w.date === targetDate);
  if (!weekFound) return null;
  const s = weekFound.summary;
  return { desde: targetDate, mañana: s["6-14"], tarde: s["14-22"], noche: s["22-6"] };
};

const getShiftForDate = (schedule, targetDate) => {
  let result = null;
  schedule.forEach((week) => {
    week.days.forEach((day) => {
      if (formatDate(day.date) === targetDate) {
        result = { mañana: day.shifts[6], tarde: day.shifts[14], noche: day.shifts[22] };
      }
    });
  });
  return result;
};

const getNextHoliday = (schedule, holidays) => {
  const today = new Date();
  const nextHoliday = [...holidays].sort().find((h) => new Date(h + "T00:00:00") > today);
  if (!nextHoliday) return null;
  return { fecha: nextHoliday, tipo: "normal", turnos: getShiftForDate(schedule, nextHoliday) };
};

const getProximaVacacion = (vacaciones) => {
  const today = new Date();
  const proxima = vacaciones
    .filter((v) => new Date(v.hasta + "T00:00:00") >= today)
    .sort((a, b) => new Date(a.desde) - new Date(b.desde))
    .find((v) => new Date(v.desde + "T00:00:00") >= today);
  if (!proxima) return null;
  return { nombre: proxima.nombre, desde: proxima.desde, hasta: proxima.hasta };
};

// ==============================
// HANDLER PRINCIPAL
// ==============================
export default async function handler(req) {
  try {
    // 1. Leer configuraciones de Firestore
    const configSnap = await firestoreGet("configuraciones");
    let startDate = null, turnoEmployee = null, extraEmployees = null;

    for (const doc of configSnap.documents || []) {
      const data = parseDoc(doc);
      if (data.turnoEmployee) turnoEmployee = data.turnoEmployee;
      if (data.extraEmployees) extraEmployees = data.extraEmployees;
      if (data.fechaInicioRotacion?.[0]) {
        const [year, month, day] = data.fechaInicioRotacion[0].split("-").map(Number);
        startDate = new Date(year, month - 1, day);
      }
    }

    if (!startDate || !turnoEmployee || !extraEmployees) {
      return new Response(JSON.stringify({ error: "Config incompleta en Firestore" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // 2. Leer vacaciones de Firestore
    const vacSnap = await firestoreGet("vacaciones");
    const vacaciones = (vacSnap.documents || []).map(parseDoc);

    // 3. Fetch feriados argentinos
    const year = new Date().getFullYear();
    const feriadosRes = await fetch(`https://api.argentinadatos.com/v1/feriados/${year}`);
    const feriadosData = await feriadosRes.json();
    const holidays = feriadosData.map((h) => h.fecha);

    // 4. Generar schedule y calcular resultados
    const schedule = generateSchedule(startDate, 54, turnoEmployee, extraEmployees);

    const result = {
      sabado_proximo: getNextSaturday(schedule),
      semana_proxima: getNextWeekShifts(schedule),
      proximo_feriado: getNextHoliday(schedule, holidays),
      proxima_vacacion: getProximaVacacion(vacaciones),
    };

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}