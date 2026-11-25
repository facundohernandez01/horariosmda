import React from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import CustomScheduleForm from "../CustomScheduleForm";
import InactiveScheduleForm from "../InactiveScheduleForm";
import VacacionesForm from "../VacacionesForm";
import { handleSaveCustomSchedule, handleSaveInactiveSchedule, handleSaveVacaciones, deleteVacacion, fetchCustomSchedules, fetchInactiveSchedules } from "../firebase/firebaseFunctions";


const Modales = ({
  modalOpen,
  setModalOpen,
  inactiveModalOpen,
  setInactiveModalOpen,
  vacacionesModalOpen,
  setVacacionesModalOpen,
  setCustomSchedules,
  customSchedules,
  setInactiveSchedules,
  inactiveSchedules,
  setVacaciones,
  vacaciones,
  configurations,
  turnoEmployee,
  extraEmployees,
}) => {
  return (
    <div>

      <Dialog open={modalOpen} onClose={()=>setModalOpen(false)} fullWidth maxWidth="sm" scroll="paper" slotProps={{paper:{sx:{maxHeight:"calc(100dvh - 32px)",m:2,borderRadius:3,color:"text.primary"}}}}>
        <DialogTitle>Horarios personalizados</DialogTitle>
        <DialogContent dividers><CustomScheduleForm onSave={customSchedule=>handleSaveCustomSchedule(customSchedule,setCustomSchedules,customSchedules,setModalOpen)} configurations={configurations} onChanged={()=>fetchCustomSchedules(setCustomSchedules)}/></DialogContent>
        <DialogActions><Button onClick={()=>setModalOpen(false)}>Cerrar</Button></DialogActions>
      </Dialog>
      <Dialog open={inactiveModalOpen} onClose={()=>setInactiveModalOpen(false)} fullWidth maxWidth="sm" scroll="paper" slotProps={{paper:{sx:{maxHeight:"calc(100dvh - 32px)",m:2,borderRadius:3,color:"text.primary"}}}}>
        <DialogTitle>Horarios inactivos</DialogTitle>
        <DialogContent dividers><InactiveScheduleForm rules={inactiveSchedules} configuredDays={configurations?.daysOfWeek} onChanged={()=>fetchInactiveSchedules(setInactiveSchedules)}/></DialogContent>
        <DialogActions><Button onClick={()=>setInactiveModalOpen(false)}>Cerrar</Button></DialogActions>
      </Dialog>
      <Dialog open={vacacionesModalOpen} onClose={() => setVacacionesModalOpen(false)}
        fullWidth maxWidth="sm" scroll="paper" aria-labelledby="vacaciones-title"
        slotProps={{paper:{sx:{maxHeight:"calc(100dvh - 32px)",m:2,width:"calc(100% - 32px)",borderRadius:3,color:"text.primary"}}}}>
        <DialogTitle id="vacaciones-title">Gestionar vacaciones</DialogTitle>
        <DialogContent dividers sx={{minHeight:0,overflowY:"auto",overscrollBehavior:"contain"}}>
          <VacacionesForm configurations={{...configurations, turnoEmployee: turnoEmployee || configurations?.turnoEmployee, extraEmployees: extraEmployees || configurations?.extraEmployees}} vacaciones={vacaciones}
            onDelete={async id=>{await deleteVacacion(id);setVacaciones(prev=>prev.filter(v=>v.id!==id));}}
            onSave={(vacacion) => handleSaveVacaciones(vacacion, setVacaciones, vacaciones, setVacacionesModalOpen)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setVacacionesModalOpen(false)}>Cerrar</Button></DialogActions>
      </Dialog>

    </div>
  );
};

export default Modales;