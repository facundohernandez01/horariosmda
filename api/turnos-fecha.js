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
// GENERATE SCHEDULE
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
// HELPER: semana para una fecha dada
// ==============================
const getWeekShiftsForDate = (schedule, targetDate) => {
  // Obtener el lunes de la semana que contiene targetDate
  const target = new Date(targetDate + "T00:00:00");
  const monday = getMonday(new Date(target));
  const mondayStr = monday.toISOString().split("T")[0];

  const weekFound = schedule.find((w) => w.date === mondayStr);
  if (!weekFound) return null;

  const s = weekFound.summary;
  return {
    semana_desde: mondayStr,
    fecha_consultada: targetDate,
    mañana: s["6-14"],
    tarde: s["14-22"],
    noche: s["22-6"],
  };
};

// ==============================
// HANDLER PRINCIPAL
// ==============================
export default async function handler(req) {
  try {
    // Leer query param ?fecha=2026-04-09
    const url = new URL(req.url);
    const fecha = url.searchParams.get("fecha");

    if (!fecha) {
      return new Response(
        JSON.stringify({ error: "Parámetro 'fecha' requerido. Ejemplo: ?fecha=2026-04-09" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Validar formato YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return new Response(
        JSON.stringify({ error: "Formato de fecha inválido. Usá YYYY-MM-DD. Ejemplo: ?fecha=2026-04-09" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Leer configuraciones de Firestore
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
      return new Response(
        JSON.stringify({ error: "Config incompleta en Firestore" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    // Generar schedule con suficientes semanas para cubrir la fecha pedida
    // Calculamos cuántas semanas desde startDate hasta fecha + margen
    const target = new Date(fecha + "T00:00:00");
    const diffMs = target - startDate;
    const diffWeeks = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)) + 4;
    const numWeeks = Math.max(54, diffWeeks);

    const schedule = generateSchedule(startDate, numWeeks, turnoEmployee, extraEmployees);

    const result = getWeekShiftsForDate(schedule, fecha);

    if (!result) {
      return new Response(
        JSON.stringify({ error: `No se encontró la semana para la fecha ${fecha}. Puede estar fuera del rango del schedule.` }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

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
