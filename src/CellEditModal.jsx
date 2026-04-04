import React, { useState, useEffect } from "react";
import { Modal, Box, Button, TextField, MenuItem, Select, FormControl, InputLabel, Typography, Chip } from "@mui/material";

/**
 * CellEditModal — se abre con doble clic sobre una celda del horario.
 * Permite: ver qué empleado está asignado, cambiar el empleado, o añadir una nota
 * para ese día/hora específico (guarda como customSchedule).
 */
const CellEditModal = ({
  open,
  onClose,
  cellInfo,       // { date: Date, hour: number, currentEmployee: string, dayLabel: string }
  configurations, // { colors, extraColors, turnoEmployee, extraEmployees }
  onSave,         // (customSchedule) => void  — mismo contrato que handleSaveCustomSchedule
}) => {
  const [mode, setMode] = useState("view"); // "view" | "edit" | "note"
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [endHour, setEndHour] = useState(1);
  const [color, setColor] = useState("#3b82f6");
  const [noteName, setNoteName] = useState("");

  useEffect(() => {
    if (open && cellInfo) {
      setSelectedEmployee(cellInfo.currentEmployee || "");
      setEndHour(Math.min((cellInfo.hour || 0) + 1, 23));
      setColor("#3b82f6");
      setNoteName("");
      setMode("view");
    }
  }, [open, cellInfo]);

  if (!cellInfo) return null;

  const dateStr = cellInfo.date instanceof Date
    ? cellInfo.date.toISOString().split("T")[0]
    : cellInfo.date;

  const allEmployees = [
    ...(configurations?.turnoEmployee || []),
    ...(configurations?.extraEmployees || []),
  ];

  const employeeColor = configurations?.colors?.[cellInfo.currentEmployee]
    || configurations?.extraColors?.[cellInfo.currentEmployee]
    || "#555";

  const handleSave = () => {
    if (!selectedEmployee && !noteName) return;
    const customSchedule = {
      dates: [dateStr],
      startHour: cellInfo.hour,
      endHour: Math.max(endHour, cellInfo.hour + 1),
      name: mode === "note" ? noteName : selectedEmployee,
      color: mode === "note" ? color : (configurations?.colors?.[selectedEmployee] || configurations?.extraColors?.[selectedEmployee] || color),
    };
    onSave(customSchedule);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        {/* Header */}
        <Box sx={headerStyle}>
          <Box>
            <Typography sx={{ fontSize: "11px", color: "#aab4c8", textTransform: "uppercase", letterSpacing: "1px" }}>
              {cellInfo.dayLabel} — {dateStr}
            </Typography>
            <Typography sx={{ fontSize: "20px", fontWeight: "700", color: "#e0e0ff", fontFamily: "'DM Sans', sans-serif" }}>
              Hora {cellInfo.hour}:00
            </Typography>
          </Box>
          {cellInfo.currentEmployee && (
            <Chip
              label={cellInfo.currentEmployee}
              sx={{
                background: employeeColor,
                color: "#fff",
                fontWeight: "700",
                fontSize: "14px",
                height: "32px",
              }}
            />
          )}
        </Box>

        {/* Mode tabs */}
        <Box sx={{ display: "flex", gap: "8px", mb: 3 }}>
          {["view", "edit", "note"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: "6px 16px",
                borderRadius: "20px",
                border: mode === m ? "none" : "1px solid #ffffff22",
                background: mode === m ? "linear-gradient(135deg, #00d4ff, #0099cc)" : "transparent",
                color: mode === m ? "#000" : "#aab4c8",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {m === "view" ? "Ver" : m === "edit" ? "Cambiar empleado" : "Añadir nota"}
            </button>
          ))}
        </Box>

        {/* View mode */}
        {mode === "view" && (
          <Box sx={{ color: "#aab4c8", fontSize: "14px", py: 1 }}>
            {cellInfo.currentEmployee ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Box sx={infoRow}>
                  <span style={{ color: "#666" }}>Empleado</span>
                  <span style={{ color: "#e0e0ff", fontWeight: "600" }}>{cellInfo.currentEmployee}</span>
                </Box>
                <Box sx={infoRow}>
                  <span style={{ color: "#666" }}>Fecha</span>
                  <span style={{ color: "#e0e0ff" }}>{dateStr}</span>
                </Box>
                <Box sx={infoRow}>
                  <span style={{ color: "#666" }}>Hora</span>
                  <span style={{ color: "#e0e0ff" }}>{cellInfo.hour}:00 – {cellInfo.hour + 1}:00</span>
                </Box>
              </Box>
            ) : (
              <Typography sx={{ color: "#555", fontStyle: "italic" }}>Celda vacía — usá "Cambiar empleado" o "Añadir nota".</Typography>
            )}
          </Box>
        )}

        {/* Edit mode — cambiar empleado */}
        {mode === "edit" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: "#aab4c8" }}>Empleado</InputLabel>
              <Select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                label="Empleado"
                sx={selectStyle}
              >
                {allEmployees.map((emp) => (
                  <MenuItem key={emp} value={emp}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Box sx={{
                        width: 12, height: 12, borderRadius: "50%",
                        background: configurations?.colors?.[emp] || configurations?.extraColors?.[emp] || "#555"
                      }} />
                      {emp}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", gap: "12px" }}>
              <TextField
                label="Hora inicio"
                type="number"
                value={cellInfo.hour}
                disabled
                size="small"
                sx={{ flex: 1, ...inputStyle }}
              />
              <TextField
                label="Hora fin"
                type="number"
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
                inputProps={{ min: cellInfo.hour + 1, max: 23 }}
                size="small"
                sx={{ flex: 1, ...inputStyle }}
              />
            </Box>

            <Button onClick={handleSave} variant="contained" sx={saveBtnStyle} fullWidth>
              Guardar cambio
            </Button>
          </Box>
        )}

        {/* Note mode */}
        {mode === "note" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <TextField
              label="Nombre / nota"
              value={noteName}
              onChange={(e) => setNoteName(e.target.value)}
              size="small"
              fullWidth
              sx={inputStyle}
            />
            <Box sx={{ display: "flex", gap: "12px" }}>
              <TextField
                label="Hora inicio"
                type="number"
                value={cellInfo.hour}
                disabled
                size="small"
                sx={{ flex: 1, ...inputStyle }}
              />
              <TextField
                label="Hora fin"
                type="number"
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
                inputProps={{ min: cellInfo.hour + 1, max: 23 }}
                size="small"
                sx={{ flex: 1, ...inputStyle }}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Typography sx={{ color: "#aab4c8", fontSize: "13px" }}>Color:</Typography>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 40, height: 32, border: "none", borderRadius: "6px", cursor: "pointer", background: "transparent" }}
              />
              <Box sx={{ width: 32, height: 32, borderRadius: "6px", background: color }} />
            </Box>
            <Button onClick={handleSave} variant="contained" sx={saveBtnStyle} fullWidth>
              Guardar nota
            </Button>
          </Box>
        )}

        <Button onClick={onClose} sx={{ mt: 2, color: "#555", fontSize: "12px" }} fullWidth>
          Cerrar
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
  width: { xs: "90vw", sm: 420 },
  background: "linear-gradient(145deg, #0f0f1a, #1a1a2e)",
  border: "1px solid #00d4ff33",
  borderRadius: "16px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
  p: 3,
  outline: "none",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  mb: 3,
  pb: 2,
  borderBottom: "1px solid #ffffff11",
};

const infoRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 12px",
  background: "#ffffff08",
  borderRadius: "8px",
  fontSize: "13px",
};

const selectStyle = {
  color: "#e0e0ff",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ffffff22" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#00d4ff55" },
  "& .MuiSvgIcon-root": { color: "#aab4c8" },
};

const inputStyle = {
  "& .MuiInputLabel-root": { color: "#aab4c8" },
  "& .MuiOutlinedInput-root": {
    color: "#e0e0ff",
    "& fieldset": { borderColor: "#ffffff22" },
    "&:hover fieldset": { borderColor: "#00d4ff55" },
  },
  "& .Mui-disabled": {
    color: "#555 !important",
    WebkitTextFillColor: "#555 !important",
  },
};

const saveBtnStyle = {
  background: "linear-gradient(135deg, #00d4ff, #0099cc)",
  color: "#000",
  fontWeight: "700",
  borderRadius: "8px",
  textTransform: "none",
  "&:hover": { background: "linear-gradient(135deg, #00eeff, #00aadd)" },
};

export default CellEditModal;
