import React from "react";
import { Modal, Box, Button } from "@mui/material";
import CustomScheduleForm from "../CustomScheduleForm";
import InactiveScheduleForm from "../InactiveScheduleForm";
import VacacionesForm from "../VacacionesForm";
import { handleSaveCustomSchedule, handleSaveInactiveSchedule, handleSaveVacaciones } from "../firebase/firebaseFunctions";

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
  vacaciones
}) => {
  return (
    <div>
      <Button variant="contained" color="primary" onClick={() => setModalOpen(true)}>
        Add Custom Schedule
      </Button>
      <Button variant="contained" color="secondary" onClick={() => setInactiveModalOpen(true)}>
        Add Inactive Schedule
      </Button>
      <Button variant="contained" color="secondary" onClick={() => setVacacionesModalOpen(true)}>
        Add Vacaciones
      </Button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
          <CustomScheduleForm onSave={(customSchedule) => handleSaveCustomSchedule(customSchedule, setCustomSchedules, customSchedules, setModalOpen)} />
        </Box>
      </Modal>

      <Modal open={inactiveModalOpen} onClose={() => setInactiveModalOpen(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
          <InactiveScheduleForm onSave={(inactiveSchedule) => handleSaveInactiveSchedule(inactiveSchedule, setInactiveSchedules, inactiveSchedules, setInactiveModalOpen)} />
        </Box>
      </Modal>

      <Modal open={vacacionesModalOpen} onClose={() => setVacacionesModalOpen(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
          <VacacionesForm onSave={(vacacion) => handleSaveVacaciones(vacacion, setVacaciones, vacaciones, setVacacionesModalOpen)} />
        </Box>
      </Modal>
    </div>
  );
};

export default Modales;