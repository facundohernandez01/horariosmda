import React,{useState} from "react";
import {Stack,Box,Button,TextField,MenuItem,Typography,Alert,Paper,Chip,Divider} from "@mui/material";
import {collection,doc,addDoc,updateDoc,deleteDoc} from "firebase/firestore";
import {db} from "./firebase/firebaseConfig";
import {DAY_KEYS,DAY_LABELS,dayIndex} from "./components/inactiveRules";
const today=()=>new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Argentina/Buenos_Aires"}).format(new Date());
const blank=()=>({day:"Saturday",startHour:14,endHour:24,enabled:true,from:"",to:""});
const hh=h=>String(Number(h)).padStart(2,"0")+":00";
export default function InactiveScheduleForm({rules=[],onChanged,configuredDays=[]}){
 const [draft,setDraft]=useState(blank),[editing,setEditing]=useState(null),[pauseId,setPauseId]=useState(null),[pauseFrom,setPauseFrom]=useState(today),[pauseTo,setPauseTo]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
 const change=(k,v)=>setDraft(p=>({...p,[k]:v}));
 const reset=()=>{setDraft(blank());setEditing(null);};
 const valid=dayIndex(draft.day,configuredDays)>=0&&draft.startHour!==""&&draft.endHour!==""&&Number.isInteger(+draft.startHour)&&Number.isInteger(+draft.endHour)&&+draft.startHour>=0&&+draft.endHour<=24&&+draft.startHour<+draft.endHour&&(!draft.to||!draft.from||draft.to>=draft.from);
 async function act(fn,msg){setBusy(true);setError("");setSuccess("");try{await fn();await onChanged?.();setSuccess(msg);}catch(e){setError(e.message);}finally{setBusy(false);}}
 function save(){if(!valid)return;const fields={...draft,startHour:+draft.startHour,endHour:+draft.endHour};act(async()=>{if(editing)await updateDoc(doc(db,"inactiveSchedules",editing),fields);else await addDoc(collection(db,"inactiveSchedules"),fields);reset();},"Regla aplicada.");}
 function patch(r,fields,msg){act(()=>updateDoc(doc(db,"inactiveSchedules",r.id),fields),msg);}
 const dateFields=(a,b,sa,sb)=><Stack direction={{xs:"column",sm:"row"}} spacing={1}><TextField fullWidth type="date" label="Desde fecha" value={a} onChange={e=>sa(e.target.value)} slotProps={{inputLabel:{shrink:true}}}/><TextField fullWidth type="date" label="Hasta fecha (opcional)" value={b} onChange={e=>sb(e.target.value)} slotProps={{inputLabel:{shrink:true},htmlInput:{min:a||undefined}}}/></Stack>;
 return <Stack spacing={2}>
 <Typography color="text.secondary">Administrá los cierres semanales. Reactivar un tramo recupera la asignación de la rotación vigente, sin crear horas extras automáticamente.</Typography>
 {error&&<Alert severity="error">{error}</Alert>}{success&&<Alert severity="success">{success}</Alert>}
 <Typography fontWeight={700}>Series existentes ({rules.length})</Typography>
 {!rules.length&&<Typography color="text.secondary">No hay reglas de inactividad registradas.</Typography>}
 {rules.map(r=><Paper key={r.id} variant="outlined" sx={{p:1.5}}><Stack spacing={1}><Box sx={{display:"flex",justifyContent:"space-between",gap:1,flexWrap:"wrap"}}><Typography fontWeight={700}>{DAY_LABELS[dayIndex(r.day,configuredDays)]||r.day} · {hh(r.startHour)}–{hh(r.endHour)}</Typography><Chip size="small" color={r.enabled===false?"default":"warning"} label={r.enabled===false?"Deshabilitada":"Cierre habilitado"}/></Box><Typography variant="body2" color="text.secondary">{r.from||"Desde el inicio"} — {r.to||"Sin vencimiento"}</Typography>
 {(r.pauses||[]).map((p,i)=><Box key={i} sx={{display:"flex",alignItems:"center",gap:1,flexWrap:"wrap"}}><Chip size="small" color="success" label={"Reactivación: "+p.from+" — "+(p.to||"En adelante")}/><Button size="small" disabled={busy} onClick={()=>patch(r,{pauses:r.pauses.filter((_,j)=>j!==i)},"Reactivación eliminada.")}>Quitar</Button></Box>)}
 <Stack direction="row" flexWrap="wrap" gap={0.5}><Button size="small" disabled={busy} onClick={()=>{setEditing(r.id);setDraft({day:DAY_KEYS[dayIndex(r.day,configuredDays)]||r.day,startHour:r.startHour,endHour:r.endHour,enabled:r.enabled!==false,from:r.from||"",to:r.to||""});}}>Editar</Button><Button size="small" disabled={busy} onClick={()=>{setPauseId(r.id);setPauseFrom(today());setPauseTo("");}}>Reactivar por fechas</Button><Button size="small" disabled={busy} onClick={()=>{if(window.confirm("Este cambio afecta todo el período de la regla. ¿Continuar?"))patch(r,{enabled:r.enabled===false},"Estado actualizado.");}}>{r.enabled===false?"Habilitar cierre":"Deshabilitar cierre"}</Button><Button size="small" color="error" disabled={busy} onClick={()=>{if(window.confirm("¿Eliminar esta regla de cierre? Afectará todo su período."))act(async()=>{await deleteDoc(doc(db,"inactiveSchedules",r.id));if(editing===r.id)reset();},"Regla eliminada.");}}>Eliminar</Button></Stack>
 {pauseId===r.id&&<Box sx={{p:1,border:1,borderColor:"divider",borderRadius:2}}><Stack spacing={1}><Typography variant="body2">Reactivar temporalmente o desde una fecha en adelante</Typography>{dateFields(pauseFrom,pauseTo,setPauseFrom,setPauseTo)}<Stack direction="row"><Button variant="contained" disabled={busy||!pauseFrom||!!pauseTo&&pauseTo<pauseFrom} onClick={()=>act(async()=>{await updateDoc(doc(db,"inactiveSchedules",r.id),{pauses:[...(r.pauses||[]),{from:pauseFrom,to:pauseTo||null}]});setPauseId(null);},"Reactivación aplicada.")}>Aplicar</Button><Button onClick={()=>setPauseId(null)}>Cancelar</Button></Stack></Stack></Box>}
 </Stack></Paper>)}
 <Divider/><Typography fontWeight={700}>{editing?"Editar serie":"Nueva serie de inactividad"}</Typography>
 <TextField select label="Día de la semana" value={draft.day} onChange={e=>change("day",e.target.value)}>{DAY_KEYS.map((d,i)=><MenuItem key={d} value={d}>{DAY_LABELS[i]}</MenuItem>)}</TextField>
 <Stack direction="row" spacing={1}><TextField fullWidth select label="Desde" value={draft.startHour} onChange={e=>change("startHour",+e.target.value)}>{Array.from({length:24},(_,i)=><MenuItem key={i} value={i}>{hh(i)}</MenuItem>)}</TextField><TextField fullWidth select label="Hasta" value={draft.endHour} onChange={e=>change("endHour",+e.target.value)}>{Array.from({length:24},(_,i)=>i+1).map(i=><MenuItem key={i} value={i}>{hh(i)}</MenuItem>)}</TextField></Stack>
 {dateFields(draft.from,draft.to,v=>change("from",v),v=>change("to",v))}
 <Typography variant="caption">Sin fechas, la regla aplica a toda la serie. Para cruzar medianoche, creá dos reglas.</Typography>
 <Stack direction="row"><Button variant="contained" disabled={busy||!valid} onClick={save}>Aplicar</Button>{editing&&<Button onClick={reset}>Cancelar edición</Button>}</Stack>
 </Stack>;
}
