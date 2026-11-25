export const DAY_KEYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
export const DAY_LABELS=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const normalize=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
export function dayIndex(value,configured=[]){
  const key=normalize(value);
  return DAY_KEYS.findIndex((d,i)=>[d,DAY_LABELS[i],configured?.[i]].some(v=>v!=null&&normalize(v)===key));
}
export function isInactive(rules,day,hour,configured=[]){
  const date=day.date.toISOString().slice(0,10);
  return (rules||[]).some(r=>{
    if(r.enabled===false||r.from&&date<r.from||r.to&&date>r.to)return false;
    if((r.pauses||[]).some(p=>p.from<=date&&(!p.to||date<=p.to)))return false;
    return dayIndex(r.day,configured)===day.date.getDay()&&hour>=Number(r.startHour)&&hour<Number(r.endHour);
  });
}
export function applyInactiveRules(schedule,rules,configured=[]){
  for(const week of schedule)for(const day of week.days){
    day.inactiveHours=Array.from({length:24},(_,h)=>isInactive(rules,day,h,configured));
  }
  return schedule;
}
