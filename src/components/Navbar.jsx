import React from "react";
import { AppBar, Toolbar, Button } from "@mui/material";

const Navbar = ({
  onOpenCustom,
  onOpenInactive,
  onOpenVacaciones,
  onOpenConfig,
  onOpenRotation,
}) => {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Button color="inherit" onClick={onOpenCustom}>
          Add Custom
        </Button>
        <Button color="inherit" onClick={onOpenInactive}>
          Add Inactive
        </Button>
        <Button color="inherit" onClick={onOpenVacaciones}>
          Vacaciones
        </Button>
        <Button color="inherit" onClick={onOpenConfig}>
          Configuración
        </Button>
        <Button color="inherit" onClick={onOpenRotation}>
          Rotación General
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
