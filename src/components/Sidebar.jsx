import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Smartphone,
  LayoutDashboard,
  Send,
  History,
  User,
  AlertTriangle,
  FileSpreadsheet,
  ShieldCheck,
  Building2
} from 'lucide-react';

const Sidebar = ({ alertCount = 0 }) => {
  const { user, isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to={isAdmin ? '/admin' : '/dashboard'} className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Smartphone size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#ffffff', fontWeight: 800 }}>GPay</span>
              <span style={{ fontSize: '0.72rem', background: '#34a853', color: 'white', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                Shield
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>
              Real-Time UPI Security
            </div>
          </div>
        </NavLink>
      </div>

      <ul className="sidebar-menu">
        {isAdmin ? (
          <>
            <div className="sidebar-label">Admin Control Center</div>
            <li>
              <NavLink to="/admin" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={18} />
                <span>Admin Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/transactions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <FileSpreadsheet size={18} />
                <span>All Transactions</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/alerts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <AlertTriangle size={18} />
                <span>Fraud Alerts</span>
                {alertCount > 0 && <span className="sidebar-badge">{alertCount}</span>}
              </NavLink>
            </li>
          </>
        ) : (
          <>
            <div className="sidebar-label">UPI Services</div>
            <li>
              <NavLink to="/dashboard" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={18} />
                <span>GPay Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/create-transaction" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Send size={18} />
                <span>Pay Anyone (UPI)</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/bank-transfer" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Building2 size={18} />
                <span>Bank Transfer</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/transactions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <History size={18} />
                <span>Transaction History</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <User size={18} />
                <span>UPI ID & Profile</span>
              </NavLink>
            </li>
          </>
        )}
      </ul>

      <div className="sidebar-footer">
        <div className="user-badge-mini">
          <div className="avatar-initial">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info-text">
            <div className="user-name-text">{user?.name || 'User'}</div>
            <div className="user-role-text">
              {user?.role === 'admin' ? 'Compliance Admin' : `${user?.name ? user.name.toLowerCase().replace(/\s+/g, '') : 'user'}@okhdfc`}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
