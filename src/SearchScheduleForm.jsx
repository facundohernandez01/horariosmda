import React, { useState, useEffect } from "react";
import { TextField, Button, Box, Alert, Stack } from "@mui/material";
import { fetchCustomSchedulesByDate, updateCustomSchedule, deleteCustomSchedule } from "./firebase/firebaseFunctions";

const SearchScheduleForm = ({onChanged}) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [existingSchedules, setExistingSchedules] = useState([]);

  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  const draft=(id,fields)=>setExistingSchedules(prev=>prev.map(s=>s.id===id?{...s,...fields}:s));
  useEffect(() => {
    if (selectedDate) {
      fetchCustomSchedulesByDate(selectedDate, setExistingSchedules);
    }
  }, [selectedDate]);

  const handleUpdate = async (id, updatedSchedule) => {
    setBusy(true);setError("");try{const {id:ignored,...fields}=updatedSchedule;await updateCustomSchedule(id,{...fields,startHour:Number(fields.startHour),endHour:Number(fields.endHour)});await fetchCustomSchedulesByDate(selectedDate,setExistingSchedules);await onChanged?.();}catch(e){setError(e.message);}finally{setBusy(false);}
  };

  const handleDelete = async (id) => {
    if(!window.confirm("¿Eliminar este horario personalizado?"))return;setBusy(true);setError("");try{await deleteCustomSchedule(id);await fetchCustomSchedulesByDate(selectedDate,setExistingSchedules);await onChanged?.();}catch(e){setError(e.message);}finally{setBusy(false);}
  };

  return (
    <Box container spacing={2}>
      <Box item xs={6}>
        <TextField
          label="Fecha"
          slotProps={{inputLabel:{shrink:true}}}
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          fullWidth
          margin="normal"
        />
        {error&&<Alert severity="error">{error}</Alert>}
        {existingSchedules.map((schedule) => (
          <Box key={schedule.id} p={2} xs={12} sm={6} md={4} lg={3}>
            <TextField
              label="Nombre"
              value={schedule.name}
              onChange={(e) => draft(schedule.id, { name: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Desde"
              type="number"
              value={schedule.startHour}
              onChange={(e) => draft(schedule.id, { startHour: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Hasta"
              type="number"
              value={schedule.endHour}
              onChange={(e) => draft(schedule.id, { endHour: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Color"
              type="color"
              value={schedule.color}
              onChange={(e) => draft(schedule.id, { color: e.target.value })}
              fullWidth
              margin="normal"
            />
            <Stack direction="row" spacing={1}><Button variant="contained" disabled={busy||!schedule.name?.trim()||schedule.startHour===""||schedule.endHour===""||!Number.isInteger(+schedule.startHour)||!Number.isInteger(+schedule.endHour)||+schedule.startHour<0||+schedule.endHour>24||+schedule.endHour<=+schedule.startHour} onClick={()=>handleUpdate(schedule.id,schedule)}>Aplicar</Button><Button disabled={busy} onClick={() => handleDelete(schedule.id)} color="error">
              Eliminar
            </Button></Stack>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SearchScheduleForm;