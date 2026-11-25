import React, { useState, useEffect } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack, Typography, Alert, Chip } from "@mui/material";
import { collection, doc, onSnapshot, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export function periodFor(date) {
  const [y,m,d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y,m-1+(d>21?1:0),1));
  return next.toISOString().slice(0,7);
}
export function useOvertime() {
  const [entries,setEntries]=useState([]);
  const [error,setError]=useState("");
  useEffect(()=>onSnapshot(collection(db,"overtime"),snap=>{setEntries(snap.docs.map(d=>({...d.data(),id:d.id})));setError("");},e=>setError(e.message)),[]);
  return {entries,error};
}
export default function ScheduleManagement({employees,entries,error}) {
  const today=new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Argentina/Buenos_Aires"}).format(new Date());
  const [open,setOpen]=useState(false), [period,setPeriod]=useState(periodFor(today));
  const [date,setDate]=useState(today), [employee,setEmployee]=useState(""), [start,setStart]=useState(14), [end,setEnd]=useState(18);
  const [note,setNote]=useState(""), [failure,setFailure]=useState(""), [busy,setBusy]=useState(false);
  const selected=entries.filter(e=>periodFor(e.date)===period).sort((a,b)=>a.date.localeCompare(b.date));
  const pending=selected.filter(e=>!e.reportedAt);
  async function act(fn){setBusy(true);setFailure("");try{await fn();}catch(e){setFailure(e.message);}finally{setBusy(false);}}
  const valid=employee&&date&&Number.isInteger(+start)&&Number.isInteger(+end)&&+start>=0&&+end<=24&&+end>+start;
  return <Box sx={{px:2,py:1,display:"flex",gap:2,alignItems:"center",flexWrap:"wrap"}}>
    <Button variant="outlined" onClick={()=>setOpen(true)}>Horas extras · {entries.filter(e=>!e.reportedAt).length} pendientes</Button>
    {error&&<Alert severity="error">{error}</Alert>}
    <Dialog open={open} onClose={()=>!busy&&setOpen(false)} fullWidth maxWidth="md">
      <DialogTitle>Gestión de horas extras</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{pt:1}}>
        <Typography color="text.secondary">Período del 22 del mes anterior al 21 inclusive. El reporte registra la fecha real de confirmación; no envía información externamente.</Typography>
        <TextField label="Período de cierre" type="month" value={period} onChange={e=>setPeriod(e.target.value)} slotProps={{inputLabel:{shrink:true}}}/>
        <Box sx={{display:"flex",gap:1,flexWrap:"wrap"}}><Chip label={pending.reduce((s,e)=>s+e.end-e.start,0)+" h pendientes"} color="warning"/><Chip label={selected.filter(e=>e.reportedAt).length+" registros informados"} color="success"/></Box>
        {(failure||error)&&<Alert severity="error">{failure||error}</Alert>}
        <Typography variant="h6">Registrar horas</Typography>
        <Stack direction={{xs:"column",sm:"row"}} spacing={1}>
          <TextField fullWidth type="date" label="Fecha" value={date} onChange={e=>setDate(e.target.value)} slotProps={{inputLabel:{shrink:true}}}/>
          <TextField fullWidth select label="Persona" value={employee} onChange={e=>setEmployee(e.target.value)}>{employees.map(e=><MenuItem key={e} value={e}>{e}</MenuItem>)}</TextField>
          <TextField type="number" label="Desde" value={start} onChange={e=>setStart(e.target.value)}/>
          <TextField type="number" label="Hasta" value={end} onChange={e=>setEnd(e.target.value)}/>
        </Stack>
        <TextField label="Motivo / observación" value={note} onChange={e=>setNote(e.target.value)}/>
        <Button disabled={!valid||busy||!!error} variant="contained" onClick={()=>act(async()=>{if(entries.some(e=>e.employee===employee&&e.date===date&&e.start<+end&&e.end>+start))throw Error("Ya existe un registro superpuesto");await addDoc(collection(db,"overtime"),{date,employee,start:+start,end:+end,note,reportedAt:null,createdAt:serverTimestamp()});setPeriod(periodFor(date));setNote("");})}>Agregar horas extras</Button>
        {selected.map(e=><Box key={e.id} sx={{border:1,borderColor:"divider",borderRadius:2,p:2,display:"flex",gap:1,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}><Box><Typography fontWeight={600}>{e.employee} · {e.date} · {e.start}:00–{e.end}:00 ({e.end-e.start} h)</Typography><Typography variant="body2">{e.note}</Typography></Box>{e.reportedAt?<Chip color="success" label={"Reportado "+(e.reportedAt.toDate?.().toLocaleDateString("es-AR",{timeZone:"America/Argentina/Buenos_Aires"})||"")} />:<Button disabled={busy||!!error||e.date>today} onClick={()=>act(()=>updateDoc(doc(db,"overtime",e.id),{reportedAt:serverTimestamp()}))}>Marcar reportado</Button>}</Box>)}
        {!selected.length&&<Typography color="text.secondary">Sin registros en este período.</Typography>}
      </Stack></DialogContent><DialogActions><Button disabled={busy} onClick={()=>setOpen(false)}>Cerrar</Button></DialogActions>
    </Dialog>
  </Box>;
}
