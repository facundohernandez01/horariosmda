import React,{useEffect,useState} from "react";
import {Dialog,DialogTitle,DialogContent,DialogActions,Stack,Box,Button,TextField,MenuItem,Typography,Alert,Paper,Tabs,Tab} from "@mui/material";
import {doc,updateDoc} from "firebase/firestore";
import {db} from "../firebase/firebaseConfig";
import generateSchedule from "./GenerateSchedule";
import {makeMapping,applyRotationRules} from "./rotationRules";
const today=()=>new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Argentina/Buenos_Aires"}).format(new Date());
const dateKey=d=>d.toISOString().slice(0,10);
const shifts=["6-14","14-22","22-6"];
const dialogProps={fullWidth:true,maxWidth:"sm",scroll:"paper",slotProps:{paper:{sx:{maxHeight:"calc(100dvh - 32px)",m:2,borderRadius:3,color:"text.primary"}}}};
export default function StaffSettings({open,onClose,initialTab=0,configurations,operators=[],admins=[],startDate,setConfigurations}){
  const [tab,setTab]=useState(0),[names,setNames]=useState({}),[colors,setColors]=useState({}),[extraColors,setExtraColors]=useState({});
  const [group,setGroup]=useState("operators"),[from,setFrom]=useState(today),[to,setTo]=useState(""),[mode,setMode]=useState("range"),[order,setOrder]=useState([]);
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
  useEffect(()=>{if(open){setTab(initialTab);setError("");setSuccess("");}},[open,initialTab]);
  const rules=configurations?.rotationRules||[];
  const ids=group==="operators"?operators:admins;
  const label=id=>names[id]||id;
  useEffect(()=>{if(open){setNames({...configurations?.employeeNames});setColors({...configurations?.colors});setExtraColors({...configurations?.extraColors});}},[open,configurations]);
  const base=from&&startDate&&from>=dateKey(new Date(startDate))?generateSchedule(new Date(startDate),Math.max(1,Math.ceil((Date.parse(from)-startDate.getTime())/604800000)+Math.max(6,admins.length+2)),operators,admins):[];
  const baseDay=base.flatMap(w=>w.days).find(d=>dateKey(d.date)===from);
  const effective=applyRotationRules(base.map(w=>({...w,summary:{...w.summary},days:w.days.map(d=>({...d,shifts:[...d.shifts]}))})),rules);
  const effectiveDay=effective.flatMap(w=>w.days).find(d=>dateKey(d.date)===from);
  // For Saturdays, use the regular weekday assignment as reference.
  const weekday=base.find(w=>w.days.some(d=>dateKey(d.date)===from))?.summary;
  const originalOperators=weekday?shifts.map(s=>weekday[s]):operators;
  const baseline=group==="operators"?originalOperators:ids;
  useEffect(()=>{if(group==="operators"){const week=effective.find(w=>w.days.some(d=>dateKey(d.date)===from));const day=effectiveDay;const candidate=day?.summary?shifts.map(s=>day.summary[s]):week?shifts.map(s=>week.summary[s]):operators;setOrder(candidate.length===3&&new Set(candidate).size===3?candidate:operators);}else {const upcoming=effective.flatMap(w=>w.days).filter(d=>dateKey(d.date)>=from&&d.date.getDay()===6).map(d=>d.shifts[10]);setOrder([...new Set([...upcoming,...admins])].filter(id=>admins.includes(id)));}},[group,from,open,configurations,operators.join("|"),admins.join("|")]);
  async function save(fields,message){setBusy(true);setError("");setSuccess("");try{await updateDoc(doc(db,"configuraciones","initialConfig"),fields);setConfigurations(prev=>({...prev,...fields}));setSuccess(message);}catch(e){setError(e.message);}finally{setBusy(false);}}
  function apply(){try{if(!from||!baseDay||mode==="range"&&(!to||to<from))throw Error("Seleccioná un rango válido posterior al inicio de la rotación.");if(order.length!==ids.length||new Set(order).size!==ids.length||order.some(id=>!ids.includes(id)))throw Error("Seleccioná cada persona exactamente una vez.");const rule={id:crypto.randomUUID(),group,from,to:mode==="future"?null:to,...(group==="operators"?{mapping:makeMapping(baseline,order)}:{order:[...order]})};save({rotationRules:[...rules,rule]},"Rotación aplicada.");}catch(e){setError(e.message);}}
  const changeOrder=(i,id)=>setOrder(prev=>{const copy=[...prev];const j=copy.indexOf(id);if(j>=0)copy[j]=copy[i];copy[i]=id;return copy;});
  return <Dialog open={open} onClose={()=>!busy&&onClose()} {...dialogProps}>
    <DialogTitle>Personal y rotaciones</DialogTitle>
    <Tabs value={tab} onChange={(_,v)=>{setTab(v);setError("");setSuccess("");}} variant="fullWidth"><Tab label="Personal"/><Tab label="Rotaciones"/></Tabs>
    <DialogContent dividers><Stack spacing={2}>
      {error&&<Alert severity="error">{error}</Alert>}{success&&<Alert severity="success">{success}</Alert>}
      {tab===0?<><Typography color="text.secondary">Editá nombre y color sin cambiar el identificador ni crear otro empleado. Los registros existentes conservan su vínculo.</Typography>
      {[["Tres turnos",operators,colors,setColors],["Administrativos · sábados",admins,extraColors,setExtraColors]].map(([title,list,palette,setPalette])=><Box key={title}><Typography fontWeight={700} sx={{mb:1}}>{title}</Typography><Stack spacing={1}>{list.map(id=><Stack key={id} direction="row" spacing={1} alignItems="center"><Typography sx={{width:40,flexShrink:0}}>{id}</Typography><TextField fullWidth size="small" label="Nombre" value={names[id]??id} onChange={e=>setNames(p=>({...p,[id]:e.target.value}))}/><TextField type="color" label="Color" size="small" value={/^#[0-9a-f]{6}$/i.test(palette[id]||"")?palette[id]:"#555555"} onChange={e=>setPalette(p=>({...p,[id]:e.target.value}))} slotProps={{inputLabel:{shrink:true}}} sx={{width:85,flexShrink:0}}/></Stack>)}</Stack></Box>)}</>:<>
      <TextField select label="Equipo" value={group} onChange={e=>setGroup(e.target.value)}><MenuItem value="operators">Tres turnos</MenuItem><MenuItem value="admins">Administrativos (sábados)</MenuItem></TextField>
      <TextField select label="Alcance" value={mode} onChange={e=>setMode(e.target.value)}><MenuItem value="range">Rango específico</MenuItem><MenuItem value="future">Desde una fecha en adelante</MenuItem></TextField>
      <Stack direction={{xs:"column",sm:"row"}} spacing={1}><TextField fullWidth type="date" label="Desde" value={from} onChange={e=>setFrom(e.target.value)} slotProps={{inputLabel:{shrink:true}}}/>{mode==="range"&&<TextField fullWidth type="date" label="Hasta (inclusive)" value={to} onChange={e=>setTo(e.target.value)} slotProps={{inputLabel:{shrink:true},htmlInput:{min:from}}}/>}</Stack>
      <Stack direction="row" spacing={1}>{[7,30].map(n=><Button key={n} size="small" onClick={()=>{if(!from)return;const d=new Date(from+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+n-1);setTo(dateKey(d));setMode("range");}}>{n===7?"7 días":"30 días"}</Button>)}</Stack>
      <Typography color="text.secondary">{group==="operators"?"Elegí quién ocupa cada turno al inicio. El ciclo de tres semanas continúa con esa permutación.":"Elegí el orden a partir del primer sábado del rango."}</Typography>
      {order.map((id,i)=><TextField key={i} select size="small" label={group==="operators"?["Mañana 06–14","Tarde 14–22","Noche 22–06"][i]:"Sábado "+(i+1)} value={id} onChange={e=>changeOrder(i,e.target.value)}>{ids.map(e=><MenuItem key={e} value={e}>{label(e)}</MenuItem>)}</TextField>)}
      <Alert severity="info">{mode==="range"?"Al finalizar, vuelve la rotación que correspondía sin este cambio.":"El cambio no modifica fechas anteriores."} Si hay reglas superpuestas, prevalece la última aplicada.</Alert>
      <Typography fontWeight={700}>Cambios registrados</Typography>
      {!rules.length&&<Typography color="text.secondary">Sin cambios de rotación.</Typography>}
      {[...rules].reverse().map(r=><Paper key={r.id} variant="outlined" sx={{p:1.5}}><Typography fontWeight={600}>{r.group==="admins"?"Administrativos":"Tres turnos"} · {r.from} — {r.to||"En adelante"}</Typography><Typography variant="body2">{r.order?r.order.map(label).join(" → "):Object.entries(r.mapping||{}).map(([a,b])=>label(a)+" → "+label(b)).join(" · ")}</Typography><Button size="small" color="error" disabled={busy} onClick={()=>{if(window.confirm("¿Quitar esta regla? Se recalculará el calendario de su rango."))save({rotationRules:rules.filter(x=>x.id!==r.id)},"Cambio eliminado.");}}>Quitar</Button></Paper>)}
      </>}
    </Stack></DialogContent>
    <DialogActions><Button disabled={busy} onClick={onClose}>Cerrar</Button><Button variant="contained" disabled={busy||(tab===1&&!ids.length)||(tab===0&&!operators.length&&!admins.length)} onClick={()=>tab===0?save({employeeNames:Object.fromEntries(Object.entries(names).map(([id,n])=>[id,n.trim()||id])),colors,extraColors},"Personal actualizado."):apply()}>Aplicar</Button></DialogActions>
  </Dialog>;
}
