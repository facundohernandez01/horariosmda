import React from 'react';
import { AppBar, Toolbar, Typography, Box, Container } from '@mui/material';
import { useIsAuthenticated } from '@azure/msal-react';
import { SignInButton } from './SignInButton';
import { SignOutButton } from './SignOutButton';

export const PageLayout = ({ children }) => {
    const isAuthenticated = useIsAuthenticated();

    return (
        <>
            <AppBar position="static" color="primary">
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" component="a" href="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
                        Turnos MDA
                    </Typography>
                    <Box>
                        {isAuthenticated ? <SignOutButton /> : <SignInButton />}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Podés poner un subtítulo o eliminar esto */}
            <Box mt={2} mb={2}>
                <Typography align="center" variant="subtitle1">
                    Bienvenido a la app de horarios
                </Typography>
            </Box>

            {/* Contenido principal */}
            <Container maxWidth="lg">
                {children}
            </Container>
        </>
    );
};
