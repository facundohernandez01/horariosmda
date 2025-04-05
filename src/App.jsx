import React, { useState } from 'react';
import { PageLayout } from './components/PageLayout';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import Button from 'react-bootstrap/Button';
import { loginRequest } from './authConfig';
import { callMsGraph } from './graph';
import { ProfileData } from './components/ProfileData';

// 👉 Importa tu componente renombrado
import ShiftScheduler from './components/ShiftScheduler'; // ajusta el path según tu estructura

const ProfileContent = () => {
    const { instance, accounts } = useMsal();
    const [graphData, setGraphData] = useState(null);

    function RequestProfileData() {
        instance
            .acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            })
            .then((response) => {
                callMsGraph(response.accessToken).then((response) => setGraphData(response));
            });
    }

    return (
        <>
            <h5>Bienvenido, {accounts[0].name}</h5>
            {graphData ? (
                <ProfileData graphData={graphData} />
            ) : (
                <Button onClick={RequestProfileData}>
                    Obtener perfil de Microsoft
                </Button>
            )}
        </>
    );
};

const MainContent = () => {
    return (
        <div>
            <AuthenticatedTemplate>
                {/* 👇 Aquí renderizas directamente tu app */}
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
            <ShiftScheduler />

                <h5 className="card-title">Inicia sesión para ver el sistema de turnos.</h5>
            </UnauthenticatedTemplate>
        </div>
    );
};

export default function App() {
    return (
        <PageLayout>
            <MainContent />
        </PageLayout>
    );
}
