import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { Button, Menu, MenuItem } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

export const SignOutButton = () => {
    const { instance } = useMsal();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = (type) => {
        handleClose();
        if (type === 'popup') {
            instance.logoutPopup({
                postLogoutRedirectUri: '/',
                mainWindowRedirectUri: '/',
            });
        } else if (type === 'redirect') {
            instance.logoutRedirect({
                postLogoutRedirectUri: '/',
            });
        }
    };

    return (
        <>
            <Button
                variant="outlined"
                color="inherit"
                onClick={handleClick}
                startIcon={<LogoutIcon />}
            >
                Cerrar sesión
            </Button>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <MenuItem onClick={() => handleLogout('popup')}>Cerrar sesión (Popup)</MenuItem>
                <MenuItem onClick={() => handleLogout('redirect')}>Cerrar sesión (Redirect)</MenuItem>
            </Menu>
        </>
    );
};
