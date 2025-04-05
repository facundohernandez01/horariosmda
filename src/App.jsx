import React from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { Typography, Box } from '@mui/material';
import ShiftScheduler from './components/ShiftScheduler';

const UserNameDisplay = () => {
    const { accounts } = useMsal();
    return (
        <Typography variant="h6" sx={{ mb: 2 }}>
            Bienvenido, {accounts[0]?.name}
        </Typography>
    );
};

const MainContent = () => {
    return (
        <Box sx={{ p: 3 }}>
            <AuthenticatedTemplate>
                <UserNameDisplay />
                <ShiftScheduler />
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
                <Typography variant="h6" align="center" mt={4}>
                    Inicia sesión para ver el sistema de turnos.
                </Typography>
            </UnauthenticatedTemplate>
        </Box>
    );
};

export default function App() {
    return <MainContent />;
}
