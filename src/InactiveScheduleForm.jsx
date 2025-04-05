import React, { useState } from "react";
import { TextField, Button, Box, MenuItem } from "@mui/material";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const InactiveScheduleForm = ({ onSave }) => {
  const [day, setDay] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");

  const handleSave = () => {
    onSave({ day, startHour, endHour });
  };

  return (
    <Box p={1}>
                            
      <h3 style={{ color: "#000", fontWeight: "bold" }}> Desactivar dias/HS en serie</h3>
      <TextField
        select
        label="Día"
        value={day}
        onChange={(e) => setDay(e.target.value)}
        fullWidth
        margin="normal"
      >
        {daysOfWeek.map((day, index) => (
          <MenuItem key={index} value={day}>
            {day}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="HS Desde"
        type="number"
        value={startHour}
        onChange={(e) => setStartHour(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="HS Hasta"
        type="number"
        value={endHour}
        onChange={(e) => setEndHour(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button onClick={handleSave} variant="contained" color="primary">
        Aplicar
      </Button>
    </Box>
  );
};

export default InactiveScheduleForm;