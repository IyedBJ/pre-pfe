import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { 
  Save, 
  Upload, 
  CheckCircle2, 
  Database, 
  FileText, 
  Receipt,
  X,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export function SaisieEmployee() {
  const { employees, addMonthlyData } = useData();

  const [selectedDate, setSelectedDate] = useState(null);


  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');

  
  const [dolibarrImported, setDolibarrImported] = useState(false);
  const [payslipImported, setPayslipImported] = useState(false);
  const [expensesImported, setExpensesImported] = useState(false);
  const [kmsImported, setKmsImported] = useState(false);

  const [tjm, setTjm] = useState(0);
  const [daysWorked, setDaysWorked] = useState(0);
  const [invoicePaid, setInvoicePaid] = useState(false);
  const [salaireBrut, setSalaireBrut] = useState(0);
  const [salaireNetApresPAS, setSalaireNetApresPAS] = useState(0);
  const [salaireNetAvantPAS, setSalaireNetAvantPAS] = useState(0);
  const [salaireNetHorsRepas, setSalaireNetHorsRepas] = useState(0);
  const [fraisRepas, setFraisRepas] = useState(0);
  const [fraisKilometriques, setFraisKilometriques] = useState(0);
  const [autresFrais, setAutresFrais] = useState(0);
  const [chargesPatronales, setChargesPatronales] = useState(0);
  const [chargesSalariales, setChargesSalariales] = useState(0);


  const invoiceAmount = tjm * daysWorked;
  const totalPercu = invoiceAmount;
  const totalFrais = fraisRepas + fraisKilometriques + autresFrais;
  const totalCharges = chargesPatronales + chargesSalariales;
  const coutTotal = salaireBrut + totalFrais + totalCharges;
  const rentabilite = totalPercu - coutTotal;
  const pourcentageRentabilite = totalPercu > 0 ? (rentabilite / totalPercu) * 100 : 0;

  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("http://localhost:7000/api/projects");
        const data = await res.json();
        if (Array.isArray(data)) {
          setProjects(data);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des projets:", error);
      }
    };
    fetchProjects();
  }, []);


  useEffect(() => {
    // Reset import states when selection changes
    setDolibarrImported(false);
    setPayslipImported(false);
    setExpensesImported(false);
    setKmsImported(false);
    setTjm(0);
    setDaysWorked(0);
    setInvoicePaid(false);
    setSalaireBrut(0);
    setSalaireNetApresPAS(0);
    setSalaireNetAvantPAS(0);
    setSalaireNetHorsRepas(0);
    setFraisRepas(0);
    setFraisKilometriques(0);
    setAutresFrais(0);
    setChargesPatronales(0);
    setChargesSalariales(0);

    if (selectedEmployeeId && selectedMonth) {
      const employee = employees.find((e) => e.id === selectedEmployeeId);
      if (employee) {
        const existingData = employee.monthlyData.find((d) => d.month === selectedMonth);
        if (existingData) {
          setTjm(existingData.tjm);
          setDaysWorked(existingData.daysWorked);
          setInvoicePaid(existingData.invoicePaid);
          setSalaireBrut(existingData.salaireBrut);
          setSalaireNetApresPAS(existingData.salaireNetApresPAS);
          setSalaireNetAvantPAS(existingData.salaireNetAvantPAS);
          setSalaireNetHorsRepas(existingData.salaireNetHorsRepas);
          setFraisRepas(existingData.fraisRepas);
          setFraisKilometriques(existingData.fraisKilometriques);
          setAutresFrais(existingData.autresFrais);
          setChargesPatronales(existingData.chargesPatronales);
          setChargesSalariales(existingData.chargesSalariales);
          
          if (existingData.tjm > 0) setDolibarrImported(true);
          if (existingData.salaireBrut > 0) setPayslipImported(true);
          if (existingData.autresFrais > 0) setExpensesImported(true);
          if (existingData.fraisKilometriques > 0) setKmsImported(true);
        }
      }
    }
  }, [selectedEmployeeId, selectedMonth, employees]);

 
  const handleDolibarrSync = async () => {
    if (!selectedEmployeeId || !selectedMonth) {
      toast.error('Veuillez sélectionner un salarié et un mois');
      return;
    }

    if (!selectedInvoiceId) {
      toast.error('Veuillez sélectionner une facture');
      return;
    }

    const toastId = toast.loading('Récupération des données depuis Dolibarr...');
    try {
      const res = await fetch(`http://localhost:7000/api/invoices/${selectedInvoiceId}`);
      if (!res.ok) throw new Error('Erreur lors de la récupération de la facture');
      
      const invoiceData = await res.json();
      
      if (invoiceData.lines && invoiceData.lines.length > 0) {
        const primaryLine = invoiceData.lines[0];
        setTjm(parseFloat(primaryLine.subprice || primaryLine.price || 0));
        setDaysWorked(parseFloat(primaryLine.qty || 0));
      }

      setInvoicePaid(invoiceData.paye === "1" || invoiceData.paye === 1 || invoiceData.status === "2");
      setDolibarrImported(true);
      
      toast.success('Données récupérées avec succès depuis Dolibarr', { id: toastId });
    } catch (error) {
      console.error("Sync error:", error);
      toast.error('Échec de la synchronisation Dolibarr', { id: toastId });
    }
  };


  const handlePayslipUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Veuillez uploader un fichier PDF');
      return;
    }

    const toastId = toast.loading('Extraction des données de la fiche de paie...');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch("http://localhost:7000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error('Erreur lors de l\'extraction');
      
      const data = await res.json();
      console.log("Extraction result (Payslip):", data);
      
      if (data.error) {
        toast.error(`Erreur d'extraction : ${data.error}`, { id: toastId });
        return;
      }

      // Map Python snake_case keys to frontend camelCase
      if (data.salaire_brut !== undefined) setSalaireBrut(data.salaire_brut);
      else if (data.salaireBrut !== undefined) setSalaireBrut(data.salaireBrut);

      if (data.net_paye !== undefined) setSalaireNetApresPAS(data.net_paye);
      else if (data.salaireNetApresPAS !== undefined) setSalaireNetApresPAS(data.salaireNetApresPAS);

      if (data.net_avant_impot !== undefined) setSalaireNetAvantPAS(data.net_avant_impot);
      else if (data.salaireNetAvantPAS !== undefined) setSalaireNetAvantPAS(data.salaireNetAvantPAS);

      // Heuristic for Net hors repas if not directly provided
      if (data.net_paye !== undefined && data.repas_restaurant !== undefined) {
        setSalaireNetHorsRepas(data.net_paye - data.repas_restaurant);
      } else if (data.salaireNetHorsRepas !== undefined) {
        setSalaireNetHorsRepas(data.salaireNetHorsRepas);
      }

      if (data.repas_restaurant !== undefined) setFraisRepas(data.repas_restaurant);
      else if (data.fraisRepas !== undefined) setFraisRepas(data.fraisRepas);

      if (data.total_charges_patronales !== undefined) setChargesPatronales(data.total_charges_patronales);
      else if (data.chargesPatronales !== undefined) setChargesPatronales(data.chargesPatronales);

      if (data.total_cotisations_salariales !== undefined) setChargesSalariales(data.total_cotisations_salariales);
      else if (data.chargesSalariales !== undefined) setChargesSalariales(data.chargesSalariales);
      
      setPayslipImported(true);
      toast.success('Données extraites du PDF avec succès', { id: toastId });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error('Échec de l\'extraction des données', { id: toastId });
    }
  };

  const handleExpensesUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Extraction des frais...');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch("http://localhost:7000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error('Erreur lors de l\'extraction');
      
      const data = await res.json();
      console.log("Extraction result (Expenses):", data);
      
      if (data.error) {
        toast.error(`Erreur d'extraction : ${data.error}`, { id: toastId });
        return;
      }

      if (data.autresFrais !== undefined && data.autresFrais > 0) {
        setAutresFrais(data.autresFrais);
        setExpensesImported(true);
        toast.success('Frais détectés automatiquement', { id: toastId });
      } else if (data.total !== undefined && data.total > 0) {
        setAutresFrais(data.total); 
        setExpensesImported(true);
        toast.success('Frais détectés automatiquement', { id: toastId });
      } else {
        toast.error('Aucun montant détecté dans le fichier', { id: toastId });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error('Échec de l\'extraction des frais', { id: toastId });
    }
  };

  const handleKmsUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Extraction des frais kilométriques...');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch("http://localhost:7000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error('Erreur lors de l\'extraction');
      
      const data = await res.json();
      console.log("Extraction result (KMs):", data);
      
      if (data.error) {
        toast.error(`Erreur d'extraction : ${data.error}`, { id: toastId });
        return;
      }

      if (data.fraisKilometriques !== undefined && data.fraisKilometriques > 0) {
        setFraisKilometriques(data.fraisKilometriques);
        setKmsImported(true);
        toast.success('Frais kilométriques détectés automatiquement', { id: toastId });
      } else if (data.total !== undefined && data.total > 0) {
        setFraisKilometriques(data.total); 
        setKmsImported(true);
        toast.success('Frais kilométriques détectés automatiquement', { id: toastId });
      } else {
        toast.error('Aucun montant kilométrique détecté', { id: toastId });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error('Échec de l\'extraction des frais kilométriques', { id: toastId });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedEmployeeId || !selectedMonth) {
      toast.error('Veuillez sélectionner un salarié et un mois');
      return;
    }

    const monthlyData = {
      id: `${selectedEmployeeId}-${selectedMonth}`,
      employeeId: selectedEmployeeId,
      month: selectedMonth,
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
    toast.success('Données enregistrées avec succès !');
  };

  const handleCancelDolibarr = () => {
    setTjm(0);
    setDaysWorked(0);
    setInvoicePaid(false);
    setSelectedInvoiceId('');
    setDolibarrImported(false);
    toast.info('Données Dolibarr réinitialisées');
  };

  const handleCancelPayslip = () => {
    setSalaireBrut(0);
    setSalaireNetApresPAS(0);
    setSalaireNetAvantPAS(0);
    setSalaireNetHorsRepas(0);
    setFraisRepas(0);
    setChargesPatronales(0);
    setChargesSalariales(0);
    setPayslipImported(false);
    toast.info('Données de paie réinitialisées');
  };

  const handleCancelExpenses = () => {
    setAutresFrais(0);
    setExpensesImported(false);
    toast.info('Notes de frais réinitialisées');
  };

  const handleCancelKms = () => {
    setFraisKilometriques(0);
    setKmsImported(false);
    toast.info('Frais kilométriques réinitialisés');
  };

  const handleCancel = () => {
    handleCancelDolibarr();
    handleCancelPayslip();
    handleCancelExpenses();
    handleCancelKms();
    setSelectedProjectId('');
    setSelectedEmployeeId('');
    setSelectedDate(null);
    setSelectedMonth('');
    toast.info('Formulaire entièrement réinitialisé');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">Saisie mensuelle des données salarié</h1>
        <p className="text-gray-600 mt-1">
          Centralisation automatique des données financières mensuelles
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Sélection salarié et mois */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Projet *
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  const pId = e.target.value;
                  setSelectedProjectId(pId);
                  const proj = projects.find(p => p._id === pId);
                  if (proj) {
                    // Set employee ID (handling populated or ID-only employeeId)
                    const empId = proj.employeeId?._id || proj.employeeId || '';
                    setSelectedEmployeeId(empId);
                    // Pre-fill TJM from project
                    setTjm(proj.tjm || 0);
                  } else {
                    setSelectedEmployeeId('');
                    setTjm(0);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
                required
              >
                <option value="">Sélectionner un projet</option>
                {projects.map((proj) => (
                  <option key={proj._id} value={proj._id}>
                    {proj.title} — {proj.clientName}
                  </option>
                ))}
              </select>
            </div>

            {/* Fetch Invoices useEffect */}
            {useEffect(() => {
              const fetchInvoices = async () => {
                try {
                  const res = await fetch("http://localhost:7000/api/invoices");
                  const allInvoices = await res.json();
                  if (Array.isArray(allInvoices)) {
                    setInvoices(allInvoices);
                  }
                } catch (error) {
                  console.error("Erreur invoices:", error);
                }
              };
              fetchInvoices();
            }, [])}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>

              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  setSelectedMonth(date.toISOString().split("T")[0]);
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="Choisir une date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
              />
            </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facture Dolibarr *
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
              >
                <option value="">Sélectionner une facture</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.ref} ({formatCurrency(inv.total_ttc)}) - {inv.client_name} - {new Date(inv.date * 1000).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 1 - IMPORT AUTOMATIQUE */}
        <div className="bg-gradient-to-br from-[#7ED957]/5 to-white rounded-xl shadow-lg p-8 border-2 border-[#7ED957]/20 mb-8">
          <h2 className="text-2xl font-semibold text-black mb-2">
            Import automatique des données
          </h2>
          <p className="text-gray-600 mb-6">
            Récupérez automatiquement vos données depuis vos sources
          </p>

          <div className="space-y-6">
            {/* Bloc 1 - Dolibarr */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#7ED957]/10 rounded-lg">
                  <Database className="text-[#7ED957]" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black mb-2">Connexion Dolibarr</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Récupérer automatiquement facturation et TJM depuis Dolibarr
                  </p>
                  
                  {dolibarrImported ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg flex-1">
                        <CheckCircle2 size={20} />
                        <span className="font-medium">✔ Données récupérées automatiquement</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelDolibarr}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                      >
                        <X size={16} />
                        Annuler cet import
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDolibarrSync}
                      className="flex items-center gap-2 px-6 py-3 bg-[#7ED957] text-black font-semibold rounded-lg hover:bg-[#6FC847] transition-colors"
                    >
                      <Database size={20} />
                      Synchroniser avec Dolibarr
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bloc 2 - Fiche de paie PDF */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#7ED957]/10 rounded-lg">
                  <FileText className="text-[#7ED957]" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black mb-2">Import fiche de paie PDF</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Extraction automatique des données salariales
                  </p>
                  
                  {payslipImported ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg flex-1">
                        <CheckCircle2 size={20} />
                        <span className="font-medium">Données extraites du PDF</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelPayslip}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                      >
                        <X size={16} />
                        Annuler cet import
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#7ED957] transition-colors">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePayslipUpload}
                        className="hidden"
                        id="payslip-upload"
                      />
                      <label
                        htmlFor="payslip-upload"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        <Upload className="text-gray-400" size={32} />
                        <div>
                          <p className="text-gray-700 font-medium">
                            Glisser-déposer fichier PDF
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            ou cliquez pour{' '}
                            <span className="text-[#7ED957] font-medium">
                              importer fiche de paie
                            </span>
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bloc 3 - Notes de frais PDF */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#7ED957]/10 rounded-lg">
                  <Receipt className="text-[#7ED957]" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black mb-2">Import notes de frais (PDF ou Excel)</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Extraction automatique des frais
                  </p>
                  
                  {expensesImported ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg flex-1">
                        <CheckCircle2 size={20} />
                        <span className="font-medium">Frais détectés automatiquement</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelExpenses}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                      >
                        <X size={16} />
                        Annuler cet import
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#7ED957] transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.xlsx,.xls"
                        onChange={handleExpensesUpload}
                        className="hidden"
                        id="expenses-upload"
                      />
                      <label
                        htmlFor="expenses-upload"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        <Upload className="text-gray-400" size={32} />
                        <div>
                          <p className="text-gray-700 font-medium">
                            Glisser-déposer fichier PDF ou Excel
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            ou cliquez pour{' '}
                            <span className="text-[#7ED957] font-medium">
                              importer note de frais
                            </span>
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#7ED957]/10 rounded-lg">
                  <Receipt className="text-[#7ED957]" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black mb-2">Import Frais kilométrique</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Extraction automatique depuis Excel
                  </p>
                  
                  {kmsImported ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg flex-1">
                        <CheckCircle2 size={20} />
                        <span className="font-medium">Frais kilométriques détectés</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelKms}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                      >
                        <X size={16} />
                        Annuler cet import
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#7ED957] transition-colors">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleKmsUpload}
                        className="hidden"
                        id="kms-upload"
                      />
                      <label
                        htmlFor="kms-upload"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        <Upload className="text-gray-400" size={32} />
                        <div>
                          <p className="text-gray-700 font-medium">
                            Glisser-déposer fichier Excel
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            ou cliquez pour{' '}
                            <span className="text-[#7ED957] font-medium">
                              importer frais kilométriques
                            </span>
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 - VÉRIFICATION ET MODIFICATION */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-black">
                Vérification des données
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Les champs peuvent être modifiés en cas de correction
              </p>
            </div>
          </div>

          {/* Facturation */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-[#7ED957] rounded"></div>
              Facturation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TJM (€)
                </label>
                <input
                  type="number"
                  value={tjm}
                  onChange={(e) => setTjm(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jours travaillés
                </label>
                <input
                  type="number"
                  value={daysWorked}
                  onChange={(e) => setDaysWorked(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facture (auto)
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-semibold">
                  {formatCurrency(invoiceAmount)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payée ?
                </label>
                <div className="flex items-center h-10">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={invoicePaid}
                      onChange={(e) => setInvoicePaid(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#7ED957] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7ED957]"></div>
                  </label>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {invoicePaid ? 'Oui' : 'Non'} 
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total facturé
                </label>
                <div className="px-4 py-2 bg-[#7ED957]/10 border-2 border-[#7ED957]/30 rounded-lg text-black font-semibold">
                  {formatCurrency(totalPercu)}
                </div>
              </div>
            </div>
          </div>

          {/* Salaire */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-[#7ED957] rounded"></div>
              Salaire
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salaire brut (€)
                </label>
                <input
                  type="number"
                  value={salaireBrut}
                  onChange={(e) => setSalaireBrut(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Net après PAS (€)
                </label>
                <input
                  type="number"
                  value={salaireNetApresPAS}
                  onChange={(e) => setSalaireNetApresPAS(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Net avant PAS (€)
                </label>
                <input
                  type="number"
                  value={salaireNetAvantPAS}
                  onChange={(e) => setSalaireNetAvantPAS(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Net hors repas (€)
                </label>
                <input
                  type="number"
                  value={salaireNetHorsRepas}
                  onChange={(e) => setSalaireNetHorsRepas(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Frais */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-[#7ED957] rounded"></div>
              Frais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frais repas (€)
                </label>
                <input
                  type="number"
                  value={fraisRepas}
                  onChange={(e) => setFraisRepas(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frais kilométriques (€)
                </label>
                <input
                  type="number"
                  value={fraisKilometriques}
                  onChange={(e) => setFraisKilometriques(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autres frais (€)
                </label>
                <input
                  type="number"
                  value={autresFrais}
                  onChange={(e) => setAutresFrais(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Charges */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-[#7ED957] rounded"></div>
              Charges
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Charges patronales URSSAF (€)
                </label>
                <input
                  type="number"
                  value={chargesPatronales}
                  onChange={(e) => setChargesPatronales(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Charges salariales (€)
                </label>
                <input
                  type="number"
                  value={chargesSalariales}
                  onChange={(e) => setChargesSalariales(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3 - CALCUL AUTOMATIQUE */}
        <div className="bg-gradient-to-br from-[#7ED957]/10 to-[#7ED957]/5 rounded-xl shadow-lg p-8 border-2 border-[#7ED957]/30 mb-8">
          <div className="flex items-center gap-3 mb-6">
            {rentabilite >= 0 ? (
              <TrendingUp className="text-green-600" size={28} />
            ) : (
              <TrendingDown className="text-red-600" size={28} />
            )}
            <h2 className="text-2xl font-semibold text-black">Calcul automatique</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Total perçu</p>
              <p className="text-2xl font-bold text-black">
                {formatCurrency(totalPercu)}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Coût total salarié</p>
              <p className="text-2xl font-bold text-black">
                {formatCurrency(coutTotal)}
              </p>
            </div>

            <div
              className={`bg-white rounded-xl p-6 shadow-sm border-2 ${
                rentabilite >= 0 ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <p className="text-sm text-gray-600 mb-2">Rentabilité</p>
              <p
                className={`text-2xl font-bold ${
                  rentabilite >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(rentabilite)}
              </p>
            </div>

            <div
              className={`bg-white rounded-xl p-6 shadow-sm border-2 ${
                rentabilite >= 0 ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <p className="text-sm text-gray-600 mb-2">Pourcentage rentabilité</p>
              <p
                className={`text-2xl font-bold ${
                  rentabilite >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {pourcentageRentabilite.toFixed(2)} %
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-2 px-8 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <X size={20} />
            Annuler
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 bg-[#7ED957] text-black font-semibold rounded-lg hover:bg-[#6FC847] transition-colors shadow-md"
          >
            <Save size={20} />
            Enregistrer les données mensuelles
          </button>
        </div>
      </form>
    </div>
  );
}
export default SaisieEmployee;