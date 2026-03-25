import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  FileArchive, 
  Upload, 
  CheckCircle2, 
  Loader2,
  X,
  Save,
  Users,
  Database,
  Receipt,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const SaisieSalarieUnique = () => {
  const { employees } = useData();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  const [zipFiles, setZipFiles] = useState({
    expenses: null,
    mileage: null,
    payslips: null
  });

  const [extractionStatus, setExtractionStatus] = useState({
    isExtracting: false,
    results: []
  });

  // Fetch invoices for selection
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch("http://localhost:7000/api/invoices");
        const data = await res.json();
        if (Array.isArray(data)) {
          setInvoices(data);
          setFilteredInvoices(data); // Initially show all invoices
        }
      } catch (error) {
        console.error("Erreur invoices:", error);
      }
    };
    fetchInvoices();
  }, []);

  // Filter invoices based on selected date range
  useEffect(() => {
    if (!startDate && !endDate) {
      setFilteredInvoices(invoices);
      return;
    }

    const filtered = invoices.filter(inv => {
      if (!inv.date) return false;
      
      const invDate = typeof inv.date === 'number' ? new Date(inv.date * 1000) : new Date(inv.date);
      if (isNaN(invDate.getTime())) return false;

      if (startDate && invDate < startDate) return false;
      if (endDate && invDate > endDate) return false;
      
      return true;
    });

    setFilteredInvoices(filtered);
    // Reset selected invoices if they are not in the filtered list
    setSelectedInvoiceIds(prev => prev.filter(id => filtered.some(inv => inv.id === id || inv.id === parseInt(id))));
  }, [startDate, endDate, invoices]);

  const handleFileChange = (type, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast.error('Veuillez uploader un fichier ZIP');
      return;
    }

    setZipFiles(prev => ({ ...prev, [type]: file }));
    toast.success(`${file.name} ajouté avec succès`);
  };

  const startExtraction = async () => {
    if (!selectedEmployeeId) {
      toast.error('Veuillez sélectionner un salarié');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Veuillez sélectionner une période (Date début et fin)');
      return;
    }

    if (!zipFiles.expenses && !zipFiles.mileage && !zipFiles.payslips && selectedInvoiceIds.length === 0) {
      toast.error('Veuillez uploader au moins un ZIP ou sélectionner des factures');
      return;
    }

    const employee = employees.find(e => e.id === selectedEmployeeId || e._id === selectedEmployeeId);
    const employeeName = employee?.name || "Inconnu";

    setExtractionStatus(prev => ({ ...prev, isExtracting: true }));
    const toastId = toast.loading('Traitement des données en cours...');

    try {
      const allResults = [];

      // Process ZIPs
      for (const type of ['expenses', 'mileage', 'payslips']) {
        if (zipFiles[type]) {
          const formData = new FormData();
          formData.append('file', zipFiles[type]);
          formData.append('employeeName', employeeName);
          formData.append('fileType', type);

          const res = await fetch("http://localhost:7000/api/upload-zip", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              allResults.push(...data.map(item => ({ ...item, type })));
            }
          } else {
            const error = await res.json();
            console.error(`Error ZIP ${type}:`, error);
            toast.error(`Erreur lors du traitement du ZIP (${type}): ${error.error || "Erreur inconnue"}`);
          }
        }
      }

      // Process Invoices — each invoice goes to its own month using Dolibarr date
      if (selectedInvoiceIds.length > 0) {
        for (const invId of selectedInvoiceIds) {
          const inv = invoices.find(i => i.id === invId || i.id === parseInt(invId));
          if (inv) {
            // Parse invoice date from Dolibarr
            // Dolibarr field 'date' is a Unix timestamp (int seconds since epoch)
            let invMonth = "Unknown";
            if (inv.date) {
              let d;
              if (typeof inv.date === 'number') {
                // Unix timestamp (seconds)
                d = new Date(inv.date * 1000);
              } else if (typeof inv.date === 'string') {
                // ISO string or "YYYY-MM-DD"
                d = new Date(inv.date);
              }
              if (d && !isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                invMonth = `${year}-${month}`;
              }
            }

            const totalHT = parseFloat(inv.total_ht || 0);
            const days = inv.lines?.reduce((s, l) => s + parseFloat(l.qty || 0), 0) || 0;
            const tjm = inv.lines?.[0]?.subprice || 0;

            allResults.push({
              type: 'invoice',
              total: totalHT,
              tjm,
              days,
              date_group: invMonth,
              filename: inv.ref,
              client: inv.client_name,
              details: inv.ref
            });
          }
        }
      }

      setExtractionStatus({
        isExtracting: false,
        results: allResults
      });
      toast.success('Traitement terminé !', { id: toastId });
    } catch (error) {
      console.error("Extraction error:", error);
      toast.error('Échec du traitement', { id: toastId });
      setExtractionStatus(prev => ({ ...prev, isExtracting: false }));
    }
  };

  const resetAll = () => {
    setSelectedEmployeeId('');
    setSelectedInvoiceIds([]);
    setStartDate(null);
    setEndDate(null);
    setZipFiles({
      expenses: null,
      mileage: null,
      payslips: null
    });
    setExtractionStatus({
      isExtracting: false,
      results: []
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);
  };

  // Group items by month/date_group
  const getFilteredAndGroupedResults = () => {
    const resultsToGroup = extractionStatus.results;

    return resultsToGroup.reduce((acc, res) => {
      // res.date_group is "YYYY-MM" (e.g., "2020-09")
      let group = "Inconnu";
      if (res.date_group && res.date_group !== "Unknown") {
        const parts = res.date_group.split("-");
        if (parts.length === 2) {
          // just use the month parameter MM to group
          group = parts[1];
        }
      }

      if (!acc[group]) acc[group] = [];
      acc[group].push(res);
      return acc;
    }, {});
  };

  const groupedResults = getFilteredAndGroupedResults();

  const monthNames = {
    "01": "Janvier", "02": "Février", "03": "Mars", "04": "Avril",
    "05": "Mai", "06": "Juin", "07": "Juillet", "08": "Août",
    "09": "Septembre", "10": "Octobre", "11": "Novembre", "12": "Décembre"
  };

  const formatGroupTitle = (group) => {
    if (group === "Inconnu" || group === "Unknown") return "Date non détectée";
    return monthNames[group] || group;
  };

  const getTypeLabel = (type) => {
    if (type === 'invoice') return { label: 'Facture', color: 'bg-green-100 text-green-700' };
    if (type === 'expenses') return { label: 'Notes de frais', color: 'bg-purple-100 text-purple-700' };
    if (type === 'mileage') return { label: 'Kilométrique', color: 'bg-orange-100 text-orange-700' };
    if (type === 'payslips') return { label: 'Fiche de paie', color: 'bg-blue-100 text-blue-700' };
    return { label: type, color: 'bg-gray-100 text-gray-600' };
  };

  // Compute totals for each month
  const getMonthSummary = (items) => {
    const totals = { invoice: 0, expenses: 0, mileage: 0, payslips: 0 };
    items.forEach(item => {
      const amount = item.total ?? item.net_paye ?? 0;
      if (item.type === 'invoice') totals.invoice += amount;
      else if (item.type === 'expenses') totals.expenses += amount;
      else if (item.type === 'mileage') totals.mileage += amount;
      else if (item.type === 'payslips') totals.payslips += amount;
    });
    return totals;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black flex items-center gap-3">
          <Users size={32} className="text-[#7ED957]" />
          Saisie individuelle par salarié
        </h1>
        <p className="text-gray-600 mt-1">
          Extraction automatisée par mois via ZIP pour un salarié précis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sélection Salarié & Période */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Users size={18} className="text-[#7ED957]" />
                Choisir le salarié
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
              >
                <option value="">Sélectionner un salarié</option>
                {employees.map((emp) => (
                  <option key={emp.id || emp._id} value={emp.id || emp._id}>
                    {emp.name} — {emp.role}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar size={18} className="text-[#7ED957]" />
                  Date début
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                  placeholderText="Début"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar size={18} className="text-[#7ED957]" />
                  Date fin
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                  placeholderText="Fin"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sélection Factures Dolibarr */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <Receipt size={18} className="text-[#7ED957]" />
            Factures Dolibarr associées
          </label>
          <select
            multiple
            value={selectedInvoiceIds}
            onChange={(e) => setSelectedInvoiceIds(Array.from(e.target.selectedOptions, option => option.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7ED957] focus:border-transparent min-h-[100px]"
          >
            {filteredInvoices.map((inv) => {
              let dateLabel = "";
              if (inv.date) {
                const d = typeof inv.date === 'number' ? new Date(inv.date * 1000) : new Date(inv.date);
                if (!isNaN(d.getTime())) {
                  dateLabel = ` — ${d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`;
                }
              }
              return (
                <option key={inv.id} value={inv.id}>
                  {inv.ref}{dateLabel}
                </option>
              );
            })}
          </select>
          <p className="text-[10px] text-gray-400 mt-2">Maintenez Ctrl/Cmd pour sélectionner plusieurs factures</p>
        </div>
      </div>

      {/* Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UploadCard 
          title="Fiches de paie (ZIP)" 
          description="Contient vos bulletins de salaire PDF"
          file={zipFiles.payslips}
          onFileSelect={(e) => handleFileChange('payslips', e)}
          id="zip-payslips"
          icon={<FileText size={32} />}
        />

        <UploadCard 
          title="Notes de frais (ZIP)" 
          description="Contient vos justificatifs Excel/PDF"
          file={zipFiles.expenses}
          onFileSelect={(e) => handleFileChange('expenses', e)}
          id="zip-expenses"
          icon={<FileArchive size={32} />}
        />

        <UploadCard 
          title="Frais kilométriques (ZIP)" 
          description="Contient vos relevés Excel"
          file={zipFiles.mileage}
          onFileSelect={(e) => handleFileChange('mileage', e)}
          id="zip-mileage"
          icon={<Database size={32} />}
        />
      </div>

      <div className="flex gap-4 justify-center mb-12">
        <button
          onClick={resetAll}
          className="flex items-center gap-2 px-8 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
          disabled={extractionStatus.isExtracting}
        >
          <X size={20} />
          Tout réinitialiser
        </button>
        <button
          onClick={startExtraction}
          className={`flex items-center gap-2 px-10 py-3 bg-[#7ED957] text-black font-bold rounded-xl transition-all shadow-lg hover:bg-[#6FC847] hover:scale-105 active:scale-95 ${extractionStatus.isExtracting ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={extractionStatus.isExtracting}
        >
          {extractionStatus.isExtracting ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <Upload size={22} />
          )}
          {extractionStatus.isExtracting ? 'Extraction en cours...' : 'Lancer l\'analyse Salarié'}
        </button>
      </div>

      {/* Results Grouped by Month */}
      {Object.keys(groupedResults).length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedResults).sort().map(([group, results]) => (
            <MonthlyEditableBlock
              key={group}
              group={group}
              results={results}
              formatCurrency={formatCurrency}
              employeeId={selectedEmployeeId}
              monthNames={monthNames}
              formatGroupTitle={formatGroupTitle}
              getTypeLabel={getTypeLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MonthlyEditableBlock = ({ group, results, formatCurrency, employeeId, monthNames, formatGroupTitle, getTypeLabel }) => {
  const { addMonthlyData } = useData();

  // Initial aggregate extraction logic based on the results array
  const initTjm = Math.max(...results.filter(r => r.type === 'invoice').map(r => r.tjm || 0), 0);
  const initDays = results.filter(r => r.type === 'invoice').reduce((s, r) => s + (r.days || 0), 0);
  
  // Fiche de paie fields
  const payslip = results.find(r => r.type === 'payslip') || {};
  const initSalaireBrut = payslip.salaire_brut || 0;
  const initNetApresPAS = payslip.net_paye || 0;
  const initNetAvantPAS = payslip.net_avant_impot || 0;
  // Fallback for hors repas
  const initNetHorsRepas = payslip.repas_restaurant ? Math.max(0, initNetApresPAS - payslip.repas_restaurant) : initNetApresPAS;
  const initFraisRepas = payslip.repas_restaurant || 0;
  const initChargesPatronales = payslip.total_charges_patronales || 0;
  const initChargesSalariales = payslip.total_cotisations_salariales || 0;

  // Autres frais and mileage
  const initAutresFrais = results.filter(r => r.type === 'expenses').reduce((s, r) => s + (r.total || 0), 0);
  const initKilometriques = results.filter(r => r.type === 'mileage').reduce((s, r) => s + (r.total || 0), 0);

  // States
  const [tjm, setTjm] = useState(initTjm);
  const [daysWorked, setDaysWorked] = useState(initDays);
  const [invoicePaid, setInvoicePaid] = useState(false);
  const [salaireBrut, setSalaireBrut] = useState(initSalaireBrut);
  const [salaireNetApresPAS, setSalaireNetApresPAS] = useState(initNetApresPAS);
  const [salaireNetAvantPAS, setSalaireNetAvantPAS] = useState(initNetAvantPAS);
  const [salaireNetHorsRepas, setSalaireNetHorsRepas] = useState(initNetHorsRepas);
  const [fraisRepas, setFraisRepas] = useState(initFraisRepas);
  const [fraisKilometriques, setFraisKilometriques] = useState(initKilometriques);
  const [autresFrais, setAutresFrais] = useState(initAutresFrais);
  const [chargesPatronales, setChargesPatronales] = useState(initChargesPatronales);
  const [chargesSalariales, setChargesSalariales] = useState(initChargesSalariales);
  const [expandedSection, setExpandedSection] = useState(null);

  const invoiceAmount = tjm * daysWorked;
  const totalPercu = invoiceAmount;
  const totalFrais = fraisRepas + fraisKilometriques + autresFrais;
  const totalCharges = chargesPatronales + chargesSalariales;
  const coutTotal = salaireBrut + totalFrais + totalCharges;
  const rentabilite = totalPercu - coutTotal;
  const pourcentageRentabilite = totalPercu > 0 ? (rentabilite / totalPercu) * 100 : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!employeeId) {
      toast.error('Veuillez sélectionner un salarié en haut de la page');
      return;
    }
    
    // We assume the first found date_group is representative (e.g. 2020-09) to use as the ID and saving construct.
    // If not we fallback to just standardising it to current year + group.
    let dateGroup = results.find(r => r.date_group && r.date_group !== "Unknown")?.date_group;
    if (!dateGroup) {
      const currentYear = new Date().getFullYear();
      dateGroup = `${currentYear}-${group}`;
    }

    const monthlyData = {
      id: `${employeeId}-${dateGroup}`,
      employeeId: employeeId,
      month: dateGroup, 
      tjm,
      daysWorked,
      invoiceAmount,
      invoicePaid,
      salaireBrut,
      salaireNetApresPAS,
      salaireNetAvantPAS,
      salaireNetHorsRepas,
      fraisRepas,
      fraisKilometriques,
      autresFrais,
      chargesPatronales,
      chargesSalariales,
      totalPercu,
      coutTotal,
      rentabilite,
      pourcentageRentabilite,
    };

    addMonthlyData(monthlyData);
    toast.success('Données consolidées enregistrées !');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
      <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
        <h2 className="text-xl font-bold text-black flex items-center gap-2">
          <Calendar size={24} className="text-[#7ED957]" />
          {formatGroupTitle(group)}
        </h2>
        <span className="px-3 py-1 bg-[#7ED957]/10 text-[#7ED957] rounded-full text-sm font-bold">
          Total Marge : {formatCurrency(rentabilite)}
        </span>
      </div>

      <div className="p-6 bg-gray-50/50">
        <form onSubmit={handleSubmit}>
          {/* Lignes récapitulatives avec icône d'édition */}
          <div className="space-y-4 mb-8">
            {/* Row Facturation */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedSection(expandedSection === 'facture' ? null : 'facture')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-10 bg-[#7ED957] rounded-full"></div>
                  <div>
                    <h3 className="font-bold text-gray-900">Factures</h3>
                    <p className="text-xs text-gray-500">{formatCurrency(invoiceAmount)} (TJM: {formatCurrency(tjm)} / {daysWorked}j)</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg text-[#7ED957]">{formatCurrency(invoiceAmount)}</span>
                  <button type="button" className="p-2 text-gray-400 hover:text-[#7ED957] hover:bg-green-50 rounded-lg transition-colors">
                    {expandedSection === 'facture' ? <TrendingUp size={20} className="rotate-180" /> : <TrendingDown size={20} />}
                  </button>
                </div>
              </div>
              
              {/* Expansion Facture */}
              {expandedSection === 'facture' && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">TJM (€)</label>
                      <input type="number" value={tjm} onChange={(e) => setTjm(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white" min="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jours travaillés</label>
                      <input type="number" value={daysWorked} onChange={(e) => setDaysWorked(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white" min="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payée ?</label>
                      <div className="flex items-center h-10">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={invoicePaid} onChange={(e) => setInvoicePaid(e.target.checked)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#7ED957] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7ED957]"></div>
                        </label>
                        <span className="ml-3 text-sm font-medium text-gray-700">{invoicePaid ? 'Oui' : 'Non'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Row Fiche de paie */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedSection(expandedSection === 'salaire' ? null : 'salaire')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-10 bg-blue-500 rounded-full"></div>
                  <div>
                    <h3 className="font-bold text-gray-900">Salaires et Charges (Paie)</h3>
                    <p className="text-xs text-gray-500">Net payé: {formatCurrency(salaireNetApresPAS)} / Charges: {formatCurrency(totalCharges)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg text-blue-600">{formatCurrency(salaireNetApresPAS)}</span>
                  <button type="button" className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                    {expandedSection === 'salaire' ? <TrendingUp size={20} className="rotate-180" /> : <TrendingDown size={20} />}
                  </button>
                </div>
              </div>
              
              {/* Expansion Salaire */}
              {expandedSection === 'salaire' && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Salaire brut (€)</label>
                      <input type="number" value={salaireBrut} onChange={(e) => setSalaireBrut(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" min="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Net après PAS (€)</label>
                      <input type="number" value={salaireNetApresPAS} onChange={(e) => setSalaireNetApresPAS(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" min="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Net avant PAS (€)</label>
                      <input type="number" value={salaireNetAvantPAS} onChange={(e) => setSalaireNetAvantPAS(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" min="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Net hors repas (€)</label>
                      <input type="number" value={salaireNetHorsRepas} onChange={(e) => setSalaireNetHorsRepas(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" min="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Charges patronales URSSAF (€)</label>
                      <input type="number" value={chargesPatronales} onChange={(e) => setChargesPatronales(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" min="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Charges salariales (€)</label>
                      <input type="number" value={chargesSalariales} onChange={(e) => setChargesSalariales(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" min="0" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Row Notes de frais */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedSection(expandedSection === 'frais' ? null : 'frais')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-10 bg-purple-500 rounded-full"></div>
                  <div>
                    <h3 className="font-bold text-gray-900">Notes de frais</h3>
                    <p className="text-xs text-gray-500">Repas: {formatCurrency(fraisRepas)} / Autres: {formatCurrency(autresFrais)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg text-purple-600">{formatCurrency(fraisRepas + autresFrais)}</span>
                  <button type="button" className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors">
                    {expandedSection === 'frais' ? <TrendingUp size={20} className="rotate-180" /> : <TrendingDown size={20} />}
                  </button>
                </div>
              </div>
              
              {/* Expansion Frais */}
              {expandedSection === 'frais' && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Frais repas (€)</label>
                      <input type="number" value={fraisRepas} onChange={(e) => setFraisRepas(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white" min="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Autres frais (€)</label>
                      <input type="number" value={autresFrais} onChange={(e) => setAutresFrais(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white" min="0" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Row Kilométrique */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedSection(expandedSection === 'kms' ? null : 'kms')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-10 bg-orange-500 rounded-full"></div>
                  <div>
                    <h3 className="font-bold text-gray-900">Frais Kilométriques</h3>
                    <p className="text-xs text-gray-500">Total KM: {formatCurrency(fraisKilometriques)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg text-orange-600">{formatCurrency(fraisKilometriques)}</span>
                  <button type="button" className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                    {expandedSection === 'kms' ? <TrendingUp size={20} className="rotate-180" /> : <TrendingDown size={20} />}
                  </button>
                </div>
              </div>
              
              {/* Expansion KMS */}
              {expandedSection === 'kms' && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total KM (€)</label>
                    <input type="number" value={fraisKilometriques} onChange={(e) => setFraisKilometriques(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white max-w-sm" min="0" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Automatique & Actions en bas */}
          <div className="bg-gradient-to-br from-[#7ED957]/10 to-[#7ED957]/5 rounded-xl shadow-sm p-6 border border-[#7ED957]/30 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8 w-full md:w-auto">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total perçu</p>
                <p className="text-xl font-bold text-black">{formatCurrency(totalPercu)}</p>
              </div>
              <div className="w-px h-10 bg-gray-300"></div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Coût total</p>
                <p className="text-xl font-bold text-black">{formatCurrency(coutTotal)}</p>
              </div>
              <div className="w-px h-10 bg-gray-300"></div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Rentabilité</p>
                <p className={`text-xl font-bold ${rentabilite >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(rentabilite)} <span className="text-sm ml-1">({pourcentageRentabilite.toFixed(1)}%)</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-[#7ED957] text-black font-semibold rounded-lg hover:bg-[#6FC847] transition-colors shadow-sm"
            >
              <Save size={20} />
              Enregistrer pour {formatGroupTitle(group)}
            </button>
          </div>
        </form>

        {/* Détail Sources Table */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Sources Extraites ({results.length})</h3>
          <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Fichier / Source</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Validation brute</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((res, idx) => {
                  const { label, color } = getTypeLabel(res.type);
                  const amount = res.type === 'invoice' ? res.total : (res.net_paye ?? res.total ?? 0);
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-800 truncate max-w-[200px]">
                        {res.filename || res.details || "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${color}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-bold text-gray-900">
                        {formatCurrency(amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const UploadCard = ({ title, description, file, onFileSelect, id, icon }) => (
  <div className={`relative bg-white p-6 rounded-2xl border-2 border-dashed transition-all duration-300 group
    ${file ? 'border-[#7ED957] bg-green-50/30' : 'border-gray-200 hover:border-[#7ED957]'}`}>
    <div className="flex flex-col items-center text-center gap-4">
      <div className={`p-4 rounded-full transition-transform duration-500 
        ${file ? 'bg-[#7ED957] text-white scale-110 shadow-lg' : 'bg-gray-100 text-gray-400 group-hover:scale-110'}`}>
        {file ? <CheckCircle2 size={32} /> : icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-black mb-1">{title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
      </div>
      
      {file ? (
        <div className="w-full">
          <p className="text-xs font-medium text-[#7ED957] bg-[#7ED957]/10 py-2 px-3 rounded-lg truncate">
            {file.name}
          </p>
        </div>
      ) : (
        <div className="w-full">
          <input
            type="file"
            accept=".zip"
            onChange={onFileSelect}
            className="hidden"
            id={id}
          />
          <label
            htmlFor={id}
            className="cursor-pointer block w-full py-2 px-4 bg-gray-50 text-black text-sm font-semibold rounded-lg border border-gray-200 hover:bg-white hover:shadow-md transition-all text-center"
          >
            Sélectionner ZIP
          </label>
        </div>
      )}
    </div>
  </div>
);

export default SaisieSalarieUnique;
