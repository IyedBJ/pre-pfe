import { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
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
  CheckCircle2,
  Receipt,
  Download,
  Filter,
  Users
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import InvoiceDetailsModal from "../components/InvoiceDetailsModal";

export default function Facturation() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("Tous les clients");
  const [statusFilter, setStatusFilter] = useState("Tous les statuts");
  const [yearFilter, setYearFilter] = useState("Toutes les années");
  const [monthFilter, setMonthFilter] = useState("Tous les mois");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, cliRes] = await Promise.all([
        fetch("http://localhost:7000/api/invoices"),
        fetch("http://localhost:7000/api/clients")
      ]);
      
      const invData = await invRes.json();
      const cliData = await cliRes.json();
      
      if (Array.isArray(invData)) setInvoices(invData);
      if (Array.isArray(cliData)) setClients(cliData);
      
    } catch (error) {
      toast.error("Erreur de connexion au serveur");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, clientFilter, statusFilter, yearFilter, monthFilter]);

  const filtered = invoices
    .sort((a, b) => new Date(b.date * 1000) - new Date(a.date * 1000))
    .filter((inv) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      inv.ref?.toLowerCase().includes(searchLower) ||
      inv.client_name?.toLowerCase().includes(searchLower) ||
      inv.client_code?.toLowerCase().includes(searchLower);
    
    const matchesClient = clientFilter === "Tous les clients" || inv.client_name === clientFilter;
    
    const isPaid = inv.remaintopay <= 0;
    const statusText = isPaid ? "Payé" : "Non payé";
    const matchesStatus = statusFilter === "Tous les statuts" || statusText === statusFilter;

    const invDate = new Date(inv.date * 1000);
    const matchesYear = yearFilter === "Toutes les années" || invDate.getFullYear().toString() === yearFilter;
    
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const matchesMonth = monthFilter === "Tous les mois" || monthNames[invDate.getMonth()] === monthFilter;

    return matchesSearch && matchesClient && matchesStatus && matchesYear && matchesMonth;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  const totalHT = filtered.reduce((acc, inv) => acc + (inv.total_ht || 0), 0);
  const totalPaid = filtered.reduce((acc, inv) => acc + (inv.total_ttc - inv.remaintopay), 0);
  const totalOutstanding = filtered.reduce((acc, inv) => acc + (inv.remaintopay || 0), 0);

  const formatCurrency = (val) => new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR', 
    maximumFractionDigits: 0 
  }).format(val);

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleDateString('fr-FR');
  };

  const getClientInfo = (clientId) => {
    return clients.find(c => c.id === clientId) || {};
  };

  const handleOpenDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  return (
    <div className="text-slate-900 antialiased font-sans p-4 md:p-8">
      <Toaster position="top-right" />

      <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-8">
        
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 text-3xl font-black leading-tight tracking-tight">
            Gestion Facturation
          </h1>
          <p className="text-slate-500 text-base">
            Pilotage financier et suivi des encaissements en temps réel (Dolibarr).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Facturé</span>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{formatCurrency(totalHT)}</span>
              <span className="text-slate-400 text-xs font-medium">HT</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Certificat d'Encaissement</span>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{formatCurrency(totalPaid)}</span>
              <span className="text-emerald-500 text-xs font-bold font-mono">TTC</span>
            </div>
          </div>

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

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Factures</span>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <ListFilter className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{filtered.length}</span>
              <span className="text-slate-400 text-xs font-medium">documents</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full lg:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une facture ou client..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7ED957] text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7ED957]"
            >
              <option>Tous les clients</option>
              {[...new Set(invoices.map(i => i.client_name))].map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7ED957]"
            >
              <option>Tous les statuts</option>
              <option>Payé</option>
              <option>Non payé</option>
            </select>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7ED957]"
            >
              <option>Toutes les années</option>
              {[...new Set(invoices.map(i => new Date(i.date * 1000).getFullYear()))].sort((a,b) => b-a).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7ED957]"
            >
              <option>Tous les mois</option>
              {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Facture</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Montant HT</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Solde</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentItems.map((inv) => {
                  const client = getClientInfo(inv.client_id);
                  const isOutstanding = inv.remaintopay > 0;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900">{inv.ref}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg border border-slate-100 bg-white flex items-center justify-center overflow-hidden">
                            <img 
                              src={client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(inv.client_name)}&background=random&color=fff`} 
                              alt=""
                              className="w-10 h-10 object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(inv.client_name)}&background=random&color=fff`;
                              }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{inv.client_name}</span>
                            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit mt-1">
                              {inv.client_code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500 font-medium">{formatDate(inv.date)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(inv.total_ht)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isOutstanding ? (
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-rose-600">-{formatCurrency(inv.remaintopay)}</span>
                            <span className="text-[10px] text-rose-400 font-medium">À régulariser</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 text-emerald-600">
                            <CheckCircle2 size={14} />
                            <span className="text-sm font-bold">Payée</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <button 
                            onClick={() => handleOpenDetails(inv)}
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
                        <p className="text-sm">Aucun document ne correspond à votre recherche.</p>
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

          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Affichage de <span className="text-slate-900">{filtered.length === 0 ? 0 : indexOfFirstItem + 1}</span> à <span className="text-slate-900">{Math.min(indexOfLastItem, filtered.length)}</span> sur <span className="text-slate-900">{filtered.length}</span> documents
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

      <InvoiceDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        invoice={selectedInvoice} 
      />
    </div>
  );
}

