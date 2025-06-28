import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Sidebar.module.css";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  LogOut,
  Menu,
} from "lucide-react";
import { AuthContext } from "../App";
import { supabase } from "../supabaseClient";

export default function Sidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useContext(AuthContext);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Erro ao sair: " + error.message);
    } else {
      setIsAuthenticated(false);
      navigate("/");
    }
  };

  const getNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.link} ${styles.active}` : styles.link;
  };

  return (
    <div
      className={styles.sidebar}
      style={{ width: collapsed ? "80px" : "220px" }}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={styles.toggleButton}
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        {!collapsed && <span>Recolher</span>}
      </button>

      <h3 className={styles.menuHeader}>
        <Menu size={20} />
        {!collapsed && <span className={styles.menuText}>Menu</span>}
      </h3>

      <nav className={styles.nav}>
        <NavLink to="/dashboard" className={getNavLinkClass}>
          <LayoutDashboard size={20} />
          {!collapsed && <span className={styles.menuText}>Dashboard</span>}
        </NavLink>
        <NavLink to="/clientes" className={getNavLinkClass}>
          <Users size={20} />
          {!collapsed && <span className={styles.menuText}>Clientes</span>}
        </NavLink>
        <NavLink to="/produtos" className={getNavLinkClass}>
          <Package size={20} />
          {!collapsed && <span className={styles.menuText}>Produtos</span>}
        </NavLink>
        <NavLink to="/pedidos" className={getNavLinkClass}>
          <ShoppingCart size={20} />
          {!collapsed && <span className={styles.menuText}>Pedidos</span>}
        </NavLink>
      </nav>

      <button onClick={handleLogout} className={styles.logoutButton}>
        <LogOut size={20} />
        {!collapsed && <span className={styles.menuText}>Sair</span>}
      </button>
    </div>
  );
}
