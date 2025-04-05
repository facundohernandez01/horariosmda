import React, { useState, useEffect } from "react";
import { TextField, Button, Box } from "@mui/material";
import { fetchCustomSchedulesByDate, updateCustomSchedule, deleteCustomSchedule } from "./firebase/firebaseFunctions";

const SearchScheduleForm = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [existingSchedules, setExistingSchedules] = useState([]);

  useEffect(() => {
    if (selectedDate) {
      fetchCustomSchedulesByDate(selectedDate, setExistingSchedules);
    }
  }, [selectedDate]);

  const handleUpdate = async (id, updatedSchedule) => {
    await updateCustomSchedule(id, updatedSchedule);
    fetchCustomSchedulesByDate(selectedDate, setExistingSchedules);
  };

  const handleDelete = async (id) => {
    await deleteCustomSchedule(id);
    fetchCustomSchedulesByDate(selectedDate, setExistingSchedules);
  };

  return (
    <Box container spacing={2}>
      <Box item xs={6}>
        <TextField
          label="Select Date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          fullWidth
          margin="normal"
        />
        {existingSchedules.map((schedule, index) => (
          <Box key={index} p={2} xs={12} sm={6} md={4} lg={3}>
            <TextField
              label="Name"
              value={schedule.name}
              onChange={(e) => handleUpdate(schedule.id, { ...schedule, name: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Start Hour"
              type="number"
              value={schedule.startHour}
              onChange={(e) => handleUpdate(schedule.id, { ...schedule, startHour: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="End Hour"
              type="number"
              value={schedule.endHour}
              onChange={(e) => handleUpdate(schedule.id, { ...schedule, endHour: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Color"
              type="color"
              value={schedule.color}
              onChange={(e) => handleUpdate(schedule.id, { ...schedule, color: e.target.value })}
              fullWidth
              margin="normal"
            />
            <Button onClick={() => handleDelete(schedule.id)} variant="contained" color="secondary">
              Eliminar
            </Button>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SearchScheduleForm;