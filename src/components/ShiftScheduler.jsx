import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Modal, Box } from "@mui/material";
import CustomScheduleForm from "./CustomScheduleForm";
import InactiveScheduleForm from "./InactiveScheduleForm";
import VacacionesForm from "./VacacionesForm";
import { fetchData, saveData } from "../firebase/firebaseFunctions";

const ShiftScheduler = () => {
  const [holidays, setHolidays] = useState([]);
  const [customSchedules, setCustomSchedules] = useState([]);
  const [inactiveSchedules, setInactiveSchedules] = useState([]);
  const [vacaciones, setVacaciones] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [inactiveModalOpen, setInactiveModalOpen] = useState(false);
  const [vacacionesModalOpen, setVacacionesModalOpen] = useState(false);

  useEffect(() => {
    fetchHolidays();
    fetchData("customSchedules", setCustomSchedules);
    fetchData("inactiveSchedules", setInactiveSchedules);
    fetchData("vacaciones", setVacaciones);
  }, []);

  const fetchHolidays = async () => {
    try {
      const year = new Date().getFullYear();
      const response = await axios.get(`https://api.argentinadatos.com/v1/feriados/${year}`);
      setHolidays(response.data.map(holiday => holiday.fecha));
    } catch (error) {
      console.error("Error fetching holidays", error);
    }
  };

  return (
    <div>
      <Button onClick={() => setModalOpen(true)}>Agregar Horario Personalizado</Button>
      <Button onClick={() => setInactiveModalOpen(true)}>Agregar Inactivo</Button>
      <Button onClick={() => setVacacionesModalOpen(true)}>Agregar Vacaciones</Button>

      <CustomScheduleForm open={modalOpen} onClose={() => setModalOpen(false)} onSave={(data) => saveData("customSchedules", data, setCustomSchedules, setModalOpen)} />
      <InactiveScheduleForm open={inactiveModalOpen} onClose={() => setInactiveModalOpen(false)} onSave={(data) => saveData("inactiveSchedules", data, setInactiveSchedules, setInactiveModalOpen)} />
      <VacacionesForm open={vacacionesModalOpen} onClose={() => setVacacionesModalOpen(false)} onSave={(data) => saveData("vacaciones", data, setVacaciones, setVacacionesModalOpen)} />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Turno</TableCell>
              <TableCell>Empleado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customSchedules.map((schedule, index) => (
              <TableRow key={index}>
                <TableCell>{schedule.date}</TableCell>
                <TableCell>{schedule.shift}</TableCell>
                <TableCell>{schedule.employee}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ShiftScheduler;
