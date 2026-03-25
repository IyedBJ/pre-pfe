import { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  Users,
  CreditCard,
  ChevronDown,
  CalendarDays,
  ListFilter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Globe,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import ClientDetailsModal from "../components/ClientDetailsModal";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous les statuts");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // State for Modal
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:7000/api/clients");
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setClients(data);
      } else {
        console.error("Format de données invalide:", data);
        setClients([]);
      }
    } catch (error) {
      toast.error("Erreur de connexion au serveur");
      console.error(error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const handleOpenDetails = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const filtered = clients.filter((c) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      c.name?.toLowerCase().includes(searchLower) ||
      c.code_client?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower);
    
    // Status filter logic (e.g., Payé vs Outstanding)
    const isPaid = (c.outstanding_amount || 0) <= 0;
    const currentStatus = isPaid ? "Payé" : "Impayé";
    const matchesStatus = statusFilter === "Tous les statuts" || currentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  // Financial aggregates
  const totalCA = clients.reduce((acc, c) => acc + (c.total_ca_ht || 0), 0);
  const totalOutstanding = clients.reduce((acc, c) => acc + (c.outstanding_amount || 0), 0);
  
  // Unique countries/regions (using the country_code field from backend)
  const uniqueRegions = [...new Set(clients.map(c => c.country_code).filter(Boolean))].length;

  const formatCurrency = (val) => new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR', 
    maximumFractionDigits: 0 
  }).format(val);

  return (
    <div className="text-slate-900 antialiased font-sans p-4 md:p-8">
      <Toaster position="top-right" />

      <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 text-3xl font-black leading-tight tracking-tight">
            Gestion Clients
          </h1>
          <p className="text-slate-500 text-base">
            Pilotage financier et suivi des encours clients en temps réel (Dolibarr).
          </p>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card: Total Clients */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Clients</span>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{clients.length}</span>
              <span className="text-slate-400 text-xs font-medium">comptes</span>
            </div>
          </div>

          {/* Card: Chiffre d'Affaires */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Chiffre d'Affaires</span>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{formatCurrency(totalCA)}</span>
              <span className="text-emerald-500 text-xs font-bold font-mono">HT</span>
            </div>
          </div>

          {/* Card: Impayés */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Impayés</span>
              <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-rose-600">-{formatCurrency(totalOutstanding)}</span>
            </div>
          </div>

          {/* Card: Pays / Régions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Régions</span>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <Globe className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{uniqueRegions}</span>
              <span className="text-slate-400 text-xs font-medium">zones</span>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full lg:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un client ou email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7ED957] text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7ED957]"
            >
              <option>Tous les statuts</option>
              <option>Payé</option>
              <option>Impayé</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Factures</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">CA Total (HT)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Solde</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentItems.map((client) => {
                  const isOutstanding = (client.outstanding_amount || 0) > 0;
                  return (
                    <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg border border-slate-100 bg-white flex items-center justify-center overflow-hidden">
                            <img 
                              src={client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=random&color=fff`} 
                              alt=""
                              className="w-10 h-10 object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=random&color=fff`;
                              }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{client.name}</span>
                            <span className="text-[11px] text-slate-400 truncate max-w-[150px]">{client.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-slate-600">{client.invoice_count || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(client.total_ca_ht)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isOutstanding ? (
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-rose-600">-{formatCurrency(client.outstanding_amount)}</span>
                            <span className="text-[10px] text-rose-400 font-medium">À régulariser</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 text-emerald-600">
                            <CheckCircle2 size={14} />
                            <span className="text-sm font-bold">Payé</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button 
                            onClick={() => handleOpenDetails(client)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            title="Voir les détails"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {currentItems.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <AlertCircle size={40} strokeWidth={1.5} />
                        <p className="text-sm">Aucun client ne correspond à votre recherche.</p>
                      </div>
                    </td>
                  </tr>
                )}
                
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex justify-center items-center gap-2 text-slate-500">
                         <div className="w-5 h-5 border-2 border-[#7ED957] border-t-transparent rounded-full animate-spin"></div>
                         <span className="text-sm font-medium">Chargement des données...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Affichage de <span className="text-slate-900">{filtered.length === 0 ? 0 : indexOfFirstItem + 1}</span> à <span className="text-slate-900">{Math.min(indexOfLastItem, filtered.length)}</span> sur <span className="text-slate-900">{filtered.length}</span> clients
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading || filtered.length === 0}
                className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <ClientDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        client={selectedClient} 
      />
    </div>
  );
}
