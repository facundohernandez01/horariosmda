import React, { useState, useEffect } from "react";
import { Modal, Box, TextField, Button, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase/firebaseConfig";

const ConfigModal = ({ open, onClose }) => {
  const [configurations, setConfigurations] = useState({});
  const [selectedColor, setSelectedColor] = useState({ key: "", value: "" });
  const [selectedExtraColor, setSelectedExtraColor] = useState({ key: "", value: "" });
  const [selectedExtraEmployee, setSelectedExtraEmployee] = useState("");

  useEffect(() => {
    const fetchConfigurations = async () => {
      const docRef = doc(db, "configuraciones", "initialConfig");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfigurations(docSnap.data());
      }
    };

    fetchConfigurations();
  }, []);

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
            onChange={(e) => setSelectedColor({ key: e.target.value, value: configurations.colors[e.target.value] })}
          >
            {Object.keys(configurations.colors || {}).map((key) => (
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
              setSelectedExtraColor({ key, value: configurations.extraColors[key] });
              setSelectedExtraEmployee(key);
            }}
          >
            {Object.keys(configurations.extraColors || {}).map((key) => (
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

export default ConfigModal;