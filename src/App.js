import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { supabase } from "./supabaseClient";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Produtos from "./pages/Produtos";
import Pedidos from "./pages/Pedidos";
import Sidebar from "./components/Sidebar";

export const AuthContext = createContext(null);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// O Layout agora é um componente separado, o que melhora a performance e a animação.
// Ele recebe o estado 'collapsed' para ajustar o layout do conteúdo principal.
const Layout = ({ collapsed }) => {
  return (
    <div style={{ display: "flex" }}>
      {/* A Sidebar é renderizada aqui, mas o seu estado é controlado pelo App */}
      <div
        style={{
          flexGrow: 1,
          // A margem e a transição são aplicadas aqui, garantindo o movimento suave
          marginLeft: collapsed ? "80px" : "220px",
          transition: "margin-left 0.3s ease",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    async function checkUserSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setLoading(false);
    }
    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      <Router>
        {/* A Sidebar é renderizada fora das rotas para ser persistente */}
        {isAuthenticated && (
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        )}

        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <Layout collapsed={collapsed} />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="pedidos" element={<Pedidos />} />
          </Route>
          <Route path="*" element={<h1>404: Página Não Encontrada</h1>} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
