import React, { useState } from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { Typography, Box } from '@mui/material';
import ShiftScheduler from './components/ShiftSchedu';
import { SignInButton } from './components/SignInButton';
import Navbar from "./components/Navbar"; // crearás este componente

const UserNameDisplay = () => {
  const { accounts } = useMsal();
  return (
    <Typography variant="h6" sx={{ mb: 2 }}>
      Bienvenido, {accounts[0]?.name}
    </Typography>
  );
};

const MainContent = () => {

    const [modalOpen, setModalOpen] = useState(false);
    const [inactiveModalOpen, setInactiveModalOpen] = useState(false);
    const [vacacionesModalOpen, setVacacionesModalOpen] = useState(false);
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [rotationModalOpen, setRotationModalOpen] = useState(false);

  return (
    
    <Box sx={{ p: 3 }}>
    <Navbar
        onOpenCustom={() => setModalOpen(true)}
        onOpenInactive={() => setInactiveModalOpen(true)}
        onOpenVacaciones={() => setVacacionesModalOpen(true)}
        onOpenConfig={() => setConfigModalOpen(true)}
        onOpenRotation={() => setRotationModalOpen(true)}
      />
      <AuthenticatedTemplate>
        <UserNameDisplay />
        <ShiftScheduler 
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            inactiveModalOpen={inactiveModalOpen}
            setInactiveModalOpen={setInactiveModalOpen}
            vacacionesModalOpen={vacacionesModalOpen}
            setVacacionesModalOpen={setVacacionesModalOpen}
            configModalOpen={configModalOpen}
            setConfigModalOpen={setConfigModalOpen}
            rotationModalOpen={rotationModalOpen}
            setRotationModalOpen={setRotationModalOpen}
        />
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Inicia sesión para ver horarios.
          </Typography>
          <SignInButton />
        </Box>
      </UnauthenticatedTemplate>
    </Box>
  );
};

export default function App() {
  return <MainContent />;
}
