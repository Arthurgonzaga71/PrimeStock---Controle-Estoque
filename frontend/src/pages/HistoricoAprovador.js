// No seu App.jsx ou Router.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Proteção de rota por perfil
const PrivateRoute = ({ children, requiredProfiles = [] }) => {
    const { user, loading } = useAuth();
    
    if (loading) return <div>Carregando...</div>;
    
    if (!user) return <Navigate to="/login" />;
    
    if (requiredProfiles.length > 0 && !requiredProfiles.includes(user.perfil)) {
        return <Navigate to="/unauthorized" />;
    }
    
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Histórico Técnico */}
                <Route path="/historico/tecnico" element={
                    <PrivateRoute requiredProfiles={['tecnico', 'tecnico_manutencao']}>
                        <HistoricoTecnico />
                    </PrivateRoute>
                } />
                
                {/* Histórico Aprovador */}
                <Route path="/historico/aprovacoes" element={
                    <PrivateRoute requiredProfiles={['coordenador', 'gerente', 'admin', 'admin_estoque']}>
                        <HistoricoAprovador />
                    </PrivateRoute>
                } />
                
                {/* Histórico Admin */}
                <Route path="/historico/admin" element={
                    <PrivateRoute requiredProfiles={['admin', 'admin_estoque']}>
                        <HistoricoAdmin />
                    </PrivateRoute>
                } />
            </Routes>
        </Router>
    );
}