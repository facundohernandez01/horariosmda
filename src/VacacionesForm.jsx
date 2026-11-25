import React, { useState } from "react";
import { TextField, Button, Stack, Typography, Paper, Alert, MenuItem, Divider, Box } from "@mui/material";

export default function VacacionesForm({onSave, configurations, vacaciones = [], onDelete}) {
  const [desde,setDesde]=useState(""), [hasta,setHasta]=useState(""), [nombre,setNombre]=useState("");
  const [busy,setBusy]=useState(false), [error,setError]=useState("");
  const employees=[...new Set([...(configurations?.turnoEmployee||[]),...(configurations?.extraEmployees||[])])];
  const valid=employees.includes(nombre)&&desde&&hasta&&desde<=hasta;
  const days=valid?Math.round((Date.parse(hasta)-Date.parse(desde))/86400000)+1:0;
  const overlap=valid&&vacaciones.some(v=>v.nombre===nombre&&v.desde<=hasta&&v.hasta>=desde);
  async function run(fn){setBusy(true);setError("");try{await fn();}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <Stack spacing={2}>
    <Typography variant="subtitle1" fontWeight={700}>Nuevo período de vacaciones</Typography>
    <Typography color="text.secondary">Seleccioná una persona y el período de ausencia.</Typography>
    <TextField select required disabled={!employees.length||busy} label="Persona" value={nombre} onChange={e=>setNombre(e.target.value)} fullWidth helperText={!employees.length?"No se pudo cargar el personal configurado.":""} slotProps={{select:{MenuProps:{PaperProps:{sx:{maxHeight:280}}}}}}>{employees.map(e=><MenuItem key={e} value={e}>{e}</MenuItem>)}</TextField>
    <Stack direction={{xs:"column",sm:"row"}} spacing={1}><TextField fullWidth type="date" label="Desde" value={desde} onChange={e=>{setDesde(e.target.value);if(hasta&&hasta<e.target.value)setHasta("");}} slotProps={{inputLabel:{shrink:true}}}/><TextField fullWidth type="date" label="Hasta" value={hasta} onChange={e=>setHasta(e.target.value)} slotProps={{inputLabel:{shrink:true},htmlInput:{min:desde||undefined}}}/></Stack>
    {valid&&<Alert severity={overlap?"warning":"info"}>{overlap?"Ya existe una ausencia superpuesta.":days+" días corridos de vacaciones"}</Alert>}
    {error&&<Alert severity="error">{error}</Alert>}
    <Button variant="contained" disabled={!valid||overlap||busy} onClick={()=>run(()=>onSave({nombre,desde,hasta}))}>Registrar vacaciones</Button>
    <Divider/><Typography fontWeight={600}>Historial de ausencias ({vacaciones.length})</Typography><Box sx={{maxHeight:260,overflowY:"auto",display:"flex",flexDirection:"column",gap:1,pr:1}}>
    {[...vacaciones].sort((a,b)=>b.desde.localeCompare(a.desde)).map(v=><Paper key={v.id||v.nombre+v.desde} variant="outlined" sx={{p:2}}><Typography fontWeight={600}>{v.nombre}</Typography><Typography variant="body2">{v.desde} — {v.hasta}</Typography>{v.id&&<Button color="error" disabled={busy} onClick={()=>{if(window.confirm("¿Eliminar estas vacaciones?"))run(()=>onDelete(v.id));}}>Eliminar</Button>}</Paper>)}
    {!vacaciones.length&&<Typography color="text.secondary">Sin vacaciones registradas.</Typography>}</Box>
  </Stack>;
}
