import React, { useState } from "react";
import { Modal, Box, Button, TextField, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import CustomScheduleForm from "../CustomScheduleForm";
import InactiveScheduleForm from "../InactiveScheduleForm";
import VacacionesForm from "../VacacionesForm";
import { handleSaveCustomSchedule, handleSaveInactiveSchedule, handleSaveVacaciones } from "../firebase/firebaseFunctions";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const ConfigModal = ({ open, onClose, configurations, setConfigurations }) => {
  const [selectedColor, setSelectedColor] = useState({ key: "", value: "" });
  const [selectedExtraColor, setSelectedExtraColor] = useState({ key: "", value: "" });
  const [selectedExtraEmployee, setSelectedExtraEmployee] = useState("");

  const handleUpdateConfig = async () => {
    const updatedConfigurations = { ...configurations };

    if (selectedColor.key) {
      updatedConfigurations.colors[selectedColor.key] = selectedColor.value;
    }

    if (selectedExtraColor.key) {
      updatedConfigurations.extraColors[selectedExtraColor.key] = selectedExtraColor.value;
    }

    if (selectedExtraEmployee) {
      const index = updatedConfigurations.extraEmployees.indexOf(selectedExtraEmployee);
      if (index !== -1) {
        updatedConfigurations.extraEmployees[index] = selectedExtraColor.key;
      }
    }

    await updateDoc(doc(db, "configuraciones", "initialConfig"), updatedConfigurations);
    setConfigurations(updatedConfigurations);
    setSelectedColor({ key: "", value: "" });
    setSelectedExtraColor({ key: "", value: "" });
    setSelectedExtraEmployee("");
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box p={3} bgcolor="white" style={{ maxWidth: "500px", margin: "auto", marginTop: "10%" }}>
        <h3>Configuración</h3>
        <FormControl fullWidth margin="normal">
          <InputLabel>Colors</InputLabel>
          <Select
            value={selectedColor.key}
            onChange={(e) => setSelectedColor({ key: e.target.value, value: configurations?.colors?.[e.target.value] || "" })}
          >
            {Object.keys(configurations?.colors || {}).map((key) => (
              <MenuItem key={key} value={key}>
                {key}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {selectedColor.key && (
          <>
            <TextField
              label="Color Key"
              value={selectedColor.key}
              onChange={(e) => setSelectedColor({ ...selectedColor, key: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Color Value"
              type="color"
              value={selectedColor.value}
              onChange={(e) => setSelectedColor({ ...selectedColor, value: e.target.value })}
              fullWidth
              margin="normal"
            />
          </>
        )}
        <FormControl fullWidth margin="normal">
          <InputLabel>Extra Colors</InputLabel>
          <Select
            value={selectedExtraColor.key}
            onChange={(e) => {
              const key = e.target.value;
              setSelectedExtraColor({ key, value: configurations?.extraColors?.[key] || "" });
              setSelectedExtraEmployee(key);
            }}
          >
            {Object.keys(configurations?.extraColors || {}).map((key) => (
              <MenuItem key={key} value={key}>
                {key}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {selectedExtraColor.key && (
          <>
            <TextField
              label="Extra Color Key"
              value={selectedExtraColor.key}
              onChange={(e) => setSelectedExtraColor({ ...selectedExtraColor, key: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Extra Color Value"
              type="color"
              value={selectedExtraColor.value}
              onChange={(e) => setSelectedExtraColor({ ...selectedExtraColor, value: e.target.value })}
              fullWidth
              margin="normal"
            />
          </>
        )}
        <Button onClick={handleUpdateConfig} variant="contained" color="primary">
          Actualizar
        </Button>
      </Box>
    </Modal>
  );
};

const RotationModal = ({ open, onClose, onSave }) => {
  const [startDate, setStartDate] = useState("");
  const [rotation, setRotation] = useState(["BF", "JG", "LL"]);

  const handleSave = () => {
    onSave({ startDate, rotation });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ ...modalStyle, width: 400 }}>
        <h2>Definir Rotación General</h2>
        <TextField
          label="Fecha de Inicio"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        {rotation.map((shift, index) => (
          <TextField
            key={index}
            select
            label={`Turno ${index + 1}`}
            value={shift}
            onChange={(e) => {
              const newRotation = [...rotation];
              newRotation[index] = e.target.value;
              setRotation(newRotation);
            }}
            fullWidth
            margin="normal"
          >
            {["BF", "JG", "LL"].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        ))}
        <Button onClick={handleSave} variant="contained" color="primary">
          Guardar
        </Button>
      </Box>
    </Modal>
  );
};

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

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
  configModalOpen,
  setConfigModalOpen,
  configurations,
  setConfigurations,
  rotationModalOpen,
  setRotationModalOpen,
  handleSaveRotation,
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
      <Button variant="contained" color="primary" onClick={() => setConfigModalOpen(true)}>
        Configuración
      </Button>
      <Button variant="contained" color="primary" onClick={() => setRotationModalOpen(true)}>
        Definir Rotación General
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

      <ConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        configurations={configurations}
        setConfigurations={setConfigurations}
      />

      <RotationModal
        open={rotationModalOpen}
        onClose={() => setRotationModalOpen(false)}
        onSave={handleSaveRotation}
      />
    </div>
  );
};

export default Modales;