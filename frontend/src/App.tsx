import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './store/authStore';

import Dashboard from './pages/Dashboard';

import ClientsPage from './pages/ClientsPage';

import SessionsPage from './pages/SessionsPage';
import ProtocolsPage from './pages/ProtocolsPage';
import NurturingPage from './pages/NurturingPage';
import PaymentsPage from './pages/PaymentsPage';

function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <LoginPage /> : <Navigate to="/" />} />
        
        <Route element={token ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/protocols" element={<ProtocolsPage />} />
          <Route path="/nurturing" element={<NurturingPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
