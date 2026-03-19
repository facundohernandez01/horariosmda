import React, { useState } from "react";
import { TextField, Button, Box, Tooltip } from "@mui/material";

const AddScheduleForm = ({ onSave, configurations }) => {
  const [dates, setDates] = useState([]);
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [color, setColor] = useState("#f60000");
  const [name, setName] = useState("");
  const [rangeStartDate, setRangeStartDate] = useState("");
  const [rangeEndDate, setRangeEndDate] = useState("");

  const allColors = {
    ...(configurations?.colors || {}),
    ...(configurations?.extraColors || {}),
  };

  const handleAddDate = () => {
    setDates([...dates, ""]);
  };

  const handleDateChange = (index, value) => {
    const newDates = [...dates];
    newDates[index] = value;
    setDates(newDates);
  };

  const handleSave = () => {
    const allDates = [...dates];

    if (rangeStartDate && rangeEndDate) {
      let currentDate = new Date(rangeStartDate);
      const endDate = new Date(rangeEndDate);

      while (currentDate <= endDate) {
        allDates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    onSave({ dates: allDates, startHour, endHour, color, name });
  };

  return (
    <Box container spacing={2}>
      <Box item xs={6}>
        {dates.map((date, index) => (
          <TextField
            key={index}
            type="date"
            value={date}
            onChange={(e) => handleDateChange(index, e.target.value)}
            fullWidth
            margin="normal"
          />
        ))}
        <Button onClick={handleAddDate} variant="contained" color="primary">
          Agregar fecha
        </Button>
        <TextField
          label="Range Start Date"
          type="date"
          value={rangeStartDate}
          onChange={(e) => setRangeStartDate(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Range End Date"
          type="date"
          value={rangeEndDate}
          onChange={(e) => setRangeEndDate(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Start Hour"
          type="number"
          value={startHour}
          onChange={(e) => setStartHour(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="End Hour"
          type="number"
          value={endHour}
          onChange={(e) => setEndHour(e.target.value)}
          fullWidth
          margin="normal"
        />
         <Box sx={{ mt: 1, mb: 1 }}>
          <label style={{ fontSize: 12, color: "#666" }}>Colores predefinidos:</label>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
            {Object.entries(allColors).map(([key, hex]) => (
              <Tooltip key={key} title={key} arrow>
                <Box
                  onClick={() => setColor(hex)}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: hex,
                    cursor: "pointer",
                    border: color === hex ? "3px solid #000" : "2px solid #ccc",
                    transition: "border 0.15s",
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </Box>
        <TextField
          label="Color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button onClick={handleSave} variant="contained" color="primary">
          Aplicar
        </Button>
      </Box>
    </Box>
  );
};

export default AddScheduleForm;