import React, { useState, useEffect } from "react";
import { TextField, Button, Box, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchVacacionesByMonth, deleteVacacion } from "./firebase/firebaseFunctions";

const VacacionesForm = ({ onSave }) => {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [nombre, setNombre] = useState("");
  const [vacaciones, setVacaciones] = useState([]);

  useEffect(() => {
    if (desde) {
      const month = new Date(desde).getMonth() + 1;
      const year = new Date(desde).getFullYear();
      fetchVacacionesByMonth(month, year, setVacaciones);
    }
  }, [desde]);

  const handleSave = () => {
    onSave({ desde, hasta, nombre });
  };

  const handleDelete = async (id) => {
    await deleteVacacion(id);
    setVacaciones(vacaciones.filter(v => v.id !== id));
  };

  return (
    <Box p={2}>
      <h3>Vacaciones Form</h3>
      <TextField
        label="Desde"
        type="date"
        value={desde}
        onChange={(e) => setDesde(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Hasta"
        type="date"
        value={hasta}
        onChange={(e) => setHasta(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button onClick={handleSave} variant="contained" color="primary">
        Guardar
      </Button>
      <h4>Vacaciones en el mes seleccionado</h4>
      <List>
        {vacaciones.map((vacacion) => (
          <ListItem key={vacacion.id}>
            <ListItemText primary={`${vacacion.nombre} (${vacacion.desde} - ${vacacion.hasta})`} />
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(vacacion.id)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default VacacionesForm;