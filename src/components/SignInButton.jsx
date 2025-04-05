import React, { useState } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';

export const SignInButton = () => {
  const { instance } = useMsal();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogin = (type) => {
    if (type === 'popup') {
      instance.loginPopup(loginRequest).catch(console.error);
    } else if (type === 'redirect') {
      instance.loginRedirect(loginRequest).catch(console.error);
    }
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        Iniciar sesión
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleLogin('popup')}>Iniciar con Popup</MenuItem>
        <MenuItem onClick={() => handleLogin('redirect')}>Iniciar con Redirect</MenuItem>
      </Menu>
    </>
  );
};
