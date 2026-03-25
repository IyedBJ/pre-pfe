import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import SaisieEmployee from '../components/SaisieEmployee';
import SaisieGroupe from './SaisieGroupe';
import SaisieSalarieUnique from './SaisieSalarieUnique';
import logo from "../assets/logoelzei.png";
import { useAuth } from '../context/AuthContext';
import GestionSalarie from './GestionSalarie';
import Clients from './Clients';
import GestionProjets from './GestionProjets';
import Facturation from './Facturation';
import PrevisionIa from './PrevisionIA';
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileArchive,
  Users, 
  Briefcase, 
  UserSquare2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Receipt,
  TrendingUp,
  Calculator
} from 'lucide-react';

const Home = () => {
  const location = useLocation(); 
  const { logout, user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navItems = [
    { name: 'Tableau de bord', path: '/home', icon: LayoutDashboard },
    { name: 'Saisie mensuelle', path: '/saisie', roles: ['admin'], icon: ClipboardList },
    { name: 'Saisie Salarié', path: '/saisie-salarie', roles: ['admin'], icon: Calculator },
    { name: 'Saisie groupe', path: '/saisie-groupe', roles: ['admin'], icon: FileArchive },
    { name: 'Gestion Salariés', path: '/gestion-salaries', roles: ['admin'], icon: Users },
    { name: 'Gestion Projets', path: '/gestion-projets', roles: ['admin'], icon: Briefcase },
    { name: 'Clients', path: '/clients', roles: ['admin'], icon: UserSquare2 },
    { name: 'Facturation', path: '/facturation', roles: ['admin'], icon: Receipt },
    { name: 'Prevision IA', path: '/Prevision-ia', roles: ['admin'], icon: TrendingUp },
  ].filter(item => !item.roles || (user && item.roles.includes(user.role)));


  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen overflow-hidden">


      <aside className={`${isSidebarCollapsed ? '22' : 'w-66'} bg-[#3e3d3d60] text-white flex-shrink-0 flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="flex justify-center items-center mb-8 mt-6">
          <img 
            src={logo} 
            alt="Elzei Logo"
            className={`${isSidebarCollapsed ? 'w-12 h-12' : 'w-24 h-24'} object-contain transition-all duration-300`}
          />
        </div>

        <nav className="flex-1 px-3 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#333] text-white font-medium'
                    : 'text-gray-300 hover:bg-[#2a2a2a] hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title={isSidebarCollapsed ? item.name : ''}
              >
                <Icon size={20} className={`${isSidebarCollapsed ? '' : 'mr-3'}`} />
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 text-xs text-white-500 border-t border-gray-200 text-center ${isSidebarCollapsed ? 'px-0' : ''}`}>
          {isSidebarCollapsed ? '©' : '© 2026 GestioPro'}
        </div>
      </aside>

  
      <main className="flex-1 overflow-y-auto bg-white">

        <div className="w-full flex items-center justify-between p-4">

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="flex items-center gap-2 px-5 py-2 bg-[#1e1e1e] text-white rounded-lg shadow hover:bg-black transition"
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>


          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end text-sm">
              <span className="font-bold text-gray-800">{user?.username}</span>
              <span className="text-gray-500 text-[10px] uppercase font-medium tracking-wider">{user?.role}</span>
            </div>
            <button
              onClick={handleLogout} 
              className="px-5 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
            >
              Se déconnecter
            </button>
          </div>
        </div>


        <div className="p-6">
          {location.pathname === '/saisie' && user?.role === 'admin' ? (
            <SaisieEmployee />
          ) : location.pathname === '/saisie-groupe' && user?.role === 'admin' ? (
            <SaisieGroupe />
          ) : location.pathname === '/saisie-salarie' && user?.role === 'admin' ? (
            <SaisieSalarieUnique />
          ) : location.pathname === '/gestion-salaries' && user?.role === 'admin' ? (
            <GestionSalarie />
          ) : location.pathname === '/gestion-projets' && user?.role === 'admin' ? (
            <GestionProjets />
          ) : location.pathname === '/clients' && user?.role === 'admin' ? (
            <Clients />
          ) : location.pathname === '/facturation' && user?.role === 'admin' ? (
            <Facturation />
          ) : location.pathname === '/Prevision-ia' && user?.role === 'admin' ? (
            <PrevisionIa />
          ) :
           (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <h2 className="text-2xl font-semibold mb-2">Bienvenue, {user?.username}</h2>
              <p>Rôle: {user?.role}</p>
              <p className="mt-4">Sélectionnez une option dans le menu à gauche pour commencer.</p>
            </div>
          )}
        </div>

      </main>

    </div>
  );
};

export default Home;
