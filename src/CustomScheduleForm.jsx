import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import AddScheduleForm from "./AddScheduleForm";
import SearchScheduleForm from "./SearchScheduleForm";

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
};

const CustomScheduleForm = ({ onSave }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <>
    <Box p={1} style={{ backgroundColor: "#eee", overflowY: "auto", maxHeight: "60vh" }}>
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="custom schedule tabs">
        <Tab label="Insertar Datos" />
        <Tab label="Buscar por Fecha" />
      </Tabs>
      <TabPanel value={tabValue} index={0}>
        <AddScheduleForm onSave={onSave} />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <SearchScheduleForm />
      </TabPanel>
    </Box>
    </>
  );
};

export default CustomScheduleForm;