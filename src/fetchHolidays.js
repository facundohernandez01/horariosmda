import axios from "axios";
export const fetchHolidays = async (setHolidays, years=[new Date().getFullYear()]) => {
  const results=await Promise.allSettled([...new Set(years)].map(year=>axios.get("https://api.argentinadatos.com/v1/feriados/"+year)));
  const dates=results.flatMap(r=>r.status==="fulfilled"&&Array.isArray(r.value.data)?r.value.data.map(h=>h.fecha):[]);
  results.filter(r=>r.status==="rejected").forEach(r=>console.error("Error fetching holidays",r.reason));
  setHolidays([...new Set(dates)]);
};