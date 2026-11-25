import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
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
        <Box py={2}>
          {children}
        </Box>
      )}
    </div>
  );
};

const CustomScheduleForm = ({ onSave, configurations, onChanged }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <>
    <Box>
      <Tabs variant="fullWidth" value={tabValue} onChange={handleTabChange} aria-label="custom schedule tabs">
        <Tab label="Nuevo" />
        <Tab label="Editar por fecha" />
      </Tabs>
      <TabPanel value={tabValue} index={0}>
          <AddScheduleForm onSave={onSave} configurations={configurations} />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <SearchScheduleForm onChanged={onChanged} />
      </TabPanel>
    </Box>
    </>
  );
};

export default CustomScheduleForm;