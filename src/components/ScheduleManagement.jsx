import React, { useState, useEffect, useRef } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack, Typography, Alert, Chip, Checkbox, FormControlLabel } from "@mui/material";
import { collection, doc, onSnapshot, addDoc, updateDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export function periodFor(date) {
  const [y,m,d] = date.split("-").map(Number);
  return new Date(Date.UTC(y,m-1+(d>21?1:0),1)).toISOString().slice(0,7);
}
export function nextDate(date) {
  const d = new Date(date+"T00:00:00Z");
  d.setUTCDate(d.getUTCDate()+1);
  return d.toISOString().slice(0,10);
}
export function normalizedEnd(start,end) {
  return end < start ? end+24 : end;
}
export function overtimeSegments(e) {
  const end=normalizedEnd(e.start,e.end);
  return [{date:e.date,start:e.start,end:Math.min(end,24)}, ...(end>24?[{date:nextDate(e.date),start:0,end:end-24}]:[])];
}
export function overtimeHours(e) { return normalizedEnd(e.start,e.end)-e.start; }
export function overtimeOnDate(e,date) { return overtimeSegments(e).filter(s=>s.date===date); }
const hourLabel = h => String(h%24).padStart(2,"0")+":00";
const rangeLabel = e => hourLabel(e.start)+"–"+hourLabel(e.end);
const escapeHtml = value => String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function exportHtml(entries,period,names) {
  const rows=[...entries].sort((a,b)=>(names[a.employee]||a.employee).localeCompare(names[b.employee]||b.employee,"es")||a.date.localeCompare(b.date)||a.start-b.start);
  const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Horas extras '+escapeHtml(period)+'</title><style>body{font:14px Arial,sans-serif;margin:24px}table{border-collapse:collapse}th,td{border:1px solid #aaa;padding:8px 12px;text-align:left}th{background:#eee}</style></head><body><table><thead><tr><th>Quien</th><th>Horas</th><th>Fecha</th><th>Comentario</th></tr></thead><tbody>'+rows.map(e=>'<tr><td>'+escapeHtml(names[e.employee]||e.employee)+'</td><td>'+overtimeHours(e)+'</td><td>'+e.date.slice(8,10)+'/'+e.date.slice(5,7)+'</td><td>'+escapeHtml(e.note||("Extras "+rangeLabel(e)))+'</td></tr>').join("")+'</tbody></table></body></html>';
  const url=URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download="horas-extras-"+period+".html";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function useOvertime() {
  const [entries,setEntries]=useState([]);
  const [error,setError]=useState("");
  useEffect(()=>onSnapshot(collection(db,"overtime"),snap=>{setEntries(snap.docs.map(d=>({...d.data(),id:d.id})));setError("");},e=>setError(e.message)),[]);
  return {entries,error};
}
export default function ScheduleManagement({employees,entries,error,names={}}) {
  const today=new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Argentina/Buenos_Aires"}).format(new Date());
  const [open,setOpen]=useState(false), [period,setPeriod]=useState(periodFor(today));
  const [date,setDate]=useState(today), [employee,setEmployee]=useState(""), [start,setStart]=useState(14), [end,setEnd]=useState(22);
  const [note,setNote]=useState(""), [failure,setFailure]=useState(""), [busy,setBusy]=useState(false);
  const [checked,setChecked]=useState([]);
  const dateRef=useRef(null);
  const selected=entries.filter(e=>periodFor(e.date)===period).sort((a,b)=>a.date.localeCompare(b.date)||a.start-b.start);
  const pending=selected.filter(e=>!e.reportedAt);
  const eligible=pending.filter(e=>overtimeSegments(e).every(s=>s.date<=today));
  const marked=eligible.filter(e=>checked.includes(e.id));
  const exportRows=marked.length?marked:pending;
  async function act(fn){setBusy(true);setFailure("");try{await fn();}catch(e){setFailure(e.message);}finally{setBusy(false);}}
  const valid=employees.includes(employee)&&date&&Number.isInteger(+start)&&Number.isInteger(+end)&&+start>=0&&+start<24&&+end>=0&&+end<=24&&+start!==+end&&normalizedEnd(+start,+end)>+start;
  async function report(rows){
    if(!rows.length)return;
    if(!window.confirm("¿Confirmar que se informaron "+rows.length+" registros?"))return;
    await act(async()=>{for(let i=0;i<rows.length;i+=450){const batch=writeBatch(db);for(const e of rows.slice(i,i+450))batch.update(doc(db,"overtime",e.id),{reportedAt:serverTimestamp()});await batch.commit();}setChecked([]);});
  }
  return <Box sx={{px:2,py:1,display:"flex",gap:2,alignItems:"center",flexWrap:"wrap"}}>
    <Button variant="outlined" onClick={()=>setOpen(true)}>Horas extras · {entries.filter(e=>!e.reportedAt).length} pendientes</Button>
    {error&&<Alert severity="error">{error}</Alert>}
    <Dialog open={open} onClose={()=>!busy&&setOpen(false)} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle>Gestión de horas extras</DialogTitle>
      <DialogContent dividers><Stack spacing={2} sx={{pt:1}}>
        <Typography color="text.secondary">Período del 22 del mes anterior al 21 inclusive, según fecha de inicio. Confirmar el reporte no envía información externamente.</Typography>
        <TextField label="Período de cierre" type="month" value={period} onChange={e=>{setPeriod(e.target.value);setChecked([]);}} slotProps={{inputLabel:{shrink:true}}}/>
        <Box sx={{display:"flex",gap:1,flexWrap:"wrap"}}><Chip label={pending.reduce((s,e)=>s+overtimeHours(e),0)+" h pendientes"} color="warning"/><Chip label={selected.filter(e=>e.reportedAt).length+" registros informados"} color="success"/></Box>
        {(failure||error)&&<Alert severity="error">{failure||error}</Alert>}
        <Typography variant="h6">Registrar horas</Typography>
        <Stack direction={{xs:"column",sm:"row"}} spacing={1}>
          <TextField fullWidth type="date" label="Fecha" inputRef={dateRef} value={date} onChange={e=>setDate(e.target.value)} slotProps={{inputLabel:{shrink:true},htmlInput:{style:{colorScheme:"light"}}}}/>
          <Button onClick={()=>{try{if(dateRef.current?.showPicker)dateRef.current.showPicker();else dateRef.current?.focus();}catch{dateRef.current?.focus();}}}>Calendario</Button>
          <TextField fullWidth select label="Persona" value={employee} onChange={e=>setEmployee(e.target.value)}>{employees.map(e=><MenuItem key={e} value={e}>{names[e]||e}</MenuItem>)}</TextField>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap">{[[6,14],[14,22],[22,6],[22,0]].map(([a,b])=><Button key={a+"-"+b} size="small" variant={+start===a&&+end===b?"contained":"outlined"} onClick={()=>{setStart(a);setEnd(b);}}>{hourLabel(a)}–{hourLabel(b)}</Button>)}</Stack>
        <Stack direction="row" spacing={1}>
          <TextField fullWidth select label="Desde" value={start} onChange={e=>setStart(+e.target.value)}>{Array.from({length:24},(_,i)=><MenuItem key={i} value={i}>{hourLabel(i)}</MenuItem>)}</TextField>
          <TextField fullWidth select label="Hasta" value={end} onChange={e=>setEnd(+e.target.value)}>{Array.from({length:24},(_,i)=><MenuItem key={i} value={i}>{hourLabel(i)}</MenuItem>)}</TextField>
        </Stack>
        {valid&&<Alert severity="info">{normalizedEnd(+start,+end)-start} horas {normalizedEnd(+start,+end)>24?"· termina al día siguiente":""}</Alert>}
        <TextField label="Motivo / observación" value={note} onChange={e=>setNote(e.target.value)}/>
        <Button disabled={!valid||busy||!!error} variant="contained" onClick={()=>act(async()=>{const candidate={date,employee,start:+start,end:normalizedEnd(+start,+end),note:note.trim(),reportedAt:null};if(entries.some(e=>e.employee===employee&&overtimeSegments(e).some(a=>overtimeSegments(candidate).some(b=>a.date===b.date&&a.start<b.end&&a.end>b.start))))throw Error("Ya existe un registro superpuesto");await addDoc(collection(db,"overtime"),{...candidate,createdAt:serverTimestamp()});setPeriod(periodFor(date));setChecked([]);setNote("");})}>Agregar horas extras</Button>
        <Stack direction={{xs:"column",sm:"row"}} spacing={1} alignItems={{sm:"center"}}>
          <FormControlLabel control={<Checkbox checked={eligible.length>0&&marked.length===eligible.length} indeterminate={marked.length>0&&marked.length<eligible.length} disabled={!eligible.length||busy||!!error} onChange={e=>setChecked(e.target.checked?eligible.map(x=>x.id):[])}/>} label="Seleccionar todas las pendientes"/>
          <Button variant="outlined" disabled={!exportRows.length||busy||!!error} onClick={()=>exportHtml(exportRows,period,names)}>Exportar HTML ({exportRows.length})</Button>
          <Button variant="contained" color="success" disabled={!marked.length||busy||!!error} onClick={()=>report(marked)}>Marcar reportadas ({marked.length})</Button>
        </Stack>
        {selected.map(e=><Box key={e.id} sx={{border:1,borderColor:"divider",borderRadius:2,p:2,display:"flex",gap:1,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}><Stack direction="row" alignItems="center"><Checkbox checked={checked.includes(e.id)&&!e.reportedAt} disabled={busy||!!error||!eligible.some(x=>x.id===e.id)} onChange={ev=>setChecked(prev=>ev.target.checked?[...prev,e.id]:prev.filter(id=>id!==e.id))}/><Box><Typography fontWeight={600}>{names[e.employee]||e.employee} · {e.date} · {rangeLabel(e)} ({overtimeHours(e)} h)</Typography><Typography variant="body2">{e.note}</Typography></Box></Stack>{e.reportedAt?<Chip color="success" label={"Reportado "+(e.reportedAt.toDate?.().toLocaleDateString("es-AR",{timeZone:"America/Argentina/Buenos_Aires"})||"")} />:<Button disabled={busy||!!error||!eligible.some(x=>x.id===e.id)} onClick={()=>report([e])}>Marcar reportado</Button>}</Box>)}
        {!selected.length&&<Typography color="text.secondary">Sin registros en este período.</Typography>}
      </Stack></DialogContent><DialogActions><Button disabled={busy} onClick={()=>setOpen(false)}>Cerrar</Button></DialogActions>
    </Dialog>
  </Box>;
}
