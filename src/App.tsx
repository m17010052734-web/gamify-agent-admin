import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Games from './pages/Games';
import Credits from './pages/Credits';

function App() {
  const isAuthenticated = !!localStorage.getItem('admin_token');

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="games" element={<Games />} />
        <Route path="credits" element={<Credits />} />
      </Route>
    </Routes>
  );
}

export default App;
