import React, {useState} from "react";
import {Box, Button, Paper, Typography, Collapse, Stack, Chip} from "@mui/material";

export const VACATION_COLOR="#303038";
export const EXTRA_COLOR="#ef4444";
export const isOnVacation=(vacations,employee,date)=>!!employee&&vacations.some(v=>v.nombre===employee&&v.desde<=date&&v.hasta>=date);
export function cellVacation(day,hour,vacations,operators,admins,customSchedules,inactiveSchedules,dayNames){
  const date=day.date.toISOString().slice(0,10);
  const employee=day.shifts[hour];
  if(!isOnVacation(vacations,employee,date))return null;
  const custom=customSchedules.some(c=>c.dates?.includes(date)&&hour>=c.startHour&&hour<c.endHour);
  if(custom)return null;
  const saturday=day.date.getDay()===6&&hour>=10&&hour<14;
  if(saturday&&admins.includes(employee))return "coverage";
  if(inactiveSchedules.some(s=>s.day===dayNames[day.date.getDay()]&&hour>=s.startHour&&hour<s.endHour))return null;
  return operators.includes(employee)?"vacation":null;
}
export function coverageWarnings(schedule,vacations,operators,admins,holidays,customSchedules,inactiveSchedules,dayNames,today){
  const warnings=[];
  for(const week of schedule)for(const day of week.days){
    const date=day.date.toISOString().slice(0,10);
    if(date<today)continue;
    const missing=new Map();
    for(let h=0;h<24;h++){
      const status=cellVacation(day,h,vacations,operators,admins,customSchedules,inactiveSchedules,dayNames);
      if(status==="coverage"||(status==="vacation"&&holidays.includes(date))){
        const emp=day.shifts[h];const key=status+"-"+emp;
        const previous=missing.get(key)||{date,employee:emp,type:status==="coverage"?"saturday":"holiday",hours:[]};
        previous.hours.push(h);missing.set(key,previous);
      }
    }
    warnings.push(...missing.values());
    // A holiday within an operator's vacation remains relevant even if custom coverage exists.
    if(holidays.includes(date))for(const emp of operators){
      if(isOnVacation(vacations,emp,date)&&!warnings.some(w=>w.date===date&&w.employee===emp&&w.type==="holiday")){
        warnings.push({date,employee:emp,type:"holiday",hours:[]});
      }
    }
  }
  return warnings.sort((a,b)=>a.date.localeCompare(b.date)||a.employee.localeCompare(b.employee));
}
const hh=h=>String(h%24).padStart(2,"0")+":00";
function ranges(hours){
  const groups=[];
  for(const h of hours){const last=groups[groups.length-1];if(last&&last[1]===h)last[1]=h+1;else groups.push([h,h+1]);}
  return groups.map(([a,b])=>hh(a)+"–"+hh(b)).join(", ");
}
export default function VacationWarnings({warnings,names={},onNavigate}){
  const [open,setOpen]=useState(false);
  if(!warnings.length)return null;
  return <Paper elevation={8} sx={{position:"fixed",bottom:16,right:16,zIndex:1050,width:{xs:"calc(100% - 32px)",sm:370},maxWidth:370,bgcolor:"#191921",color:"#f5f5f5",border:"1px solid #ef444477",borderRadius:3,overflow:"hidden"}}>
    <Button fullWidth onClick={()=>setOpen(v=>!v)} aria-expanded={open} sx={{justifyContent:"space-between",color:"#ff8585",p:1.5,textTransform:"none"}}>
      <span>⚠ Vacaciones por cubrir · {warnings.length}</span><span>{open?"▾":"▴"}</span>
    </Button>
    <Collapse in={open}><Stack spacing={1} sx={{p:1.5,maxHeight:"min(50dvh, 400px)",overflowY:"auto"}}>
      {warnings.map(w=><Box key={w.date+w.employee+w.type} sx={{p:1.5,bgcolor:"#25252f",borderRadius:2}}>
        <Chip size="small" label={w.type==="saturday"?"Sábado por cubrir":"Feriado en vacaciones"} sx={{color:"#ff8585",bgcolor:"#ef444422"}}/>
        <Typography fontWeight={700} sx={{mt:1}}>{names[w.employee]||w.employee} · {w.date.split("-").reverse().join("/")}</Typography>
        <Typography variant="body2" sx={{color:"#c5c5ce"}}>{w.hours.length?ranges(w.hours)+" · "+w.hours.length+" h por cubrir":"Revisar cobertura del feriado"}</Typography>
        <Button size="small" sx={{color:"#8acaff"}} onClick={()=>onNavigate(w.date)}>Ver semana</Button>
      </Box>)}
    </Stack></Collapse>
  </Paper>;
}
