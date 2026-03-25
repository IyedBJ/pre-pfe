/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { UserPlus, Trash2, Edit2 } from "lucide-react";
import AddEmployeeModal from "../components/AddEmployeeModal";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);


const clientColorMap = {
  blue: "bg-blue-50 text-blue-600",
  purple: "bg-purple-50 text-purple-600",
  indigo: "bg-indigo-50 text-indigo-600",
  slate: "bg-slate-100 text-slate-600",
  emerald: "bg-emerald-50 text-emerald-600",
  "axa": "bg-blue-100 text-blue-700",
  "bnp": "bg-emerald-100 text-emerald-700",
  "total": "bg-yellow-100 text-yellow-700",
  "cyberdyne": "bg-indigo-100 text-indigo-700",
  "phoenix": "bg-purple-100 text-purple-700",
  "aws": "bg-orange-100 text-orange-700",
};

const statusConfig = {
  Rentable: {
    className: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  Perte: {
    className: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
  Neutre: {
    className: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.Neutre;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
      {status}
    </span>
  );
}

function ClientBadge({ client, color }) {
  const colorClass = clientColorMap[color] || "bg-slate-100 text-slate-600";
  return (
    <span className={`${colorClass} px-2 py-1 rounded text-xs font-medium uppercase`}>
      {client}
    </span>
  );
}

export default function GestionSalarie() {
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tous les rôles");
  const [statusFilter, setStatusFilter] = useState("Statut de Rentabilité");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;




  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:7000/api/employees");
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des salariés");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter]);

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const filtered = employees.filter((e) => {
    const nameMatch = e.name?.toLowerCase().includes(search.toLowerCase()) || false;
    const clientMatch = e.client?.toLowerCase().includes(search.toLowerCase()) || false;
    const roleMatch = e.role?.toLowerCase().includes(search.toLowerCase()) || false;
    
    const matchSearch = nameMatch || clientMatch || roleMatch;
    const matchRole = roleFilter === "Tous les rôles" || e.role === roleFilter;
    const matchStatus = statusFilter === "Statut de Rentabilité" || e.status === statusFilter;
    
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSave = async (form) => {
    const payload = {
      name: form.nom,
      email: form.email,
      role: form.role,
      client: form.client || "Interne",
      tjm: Number(form.tjm),
      status: editingEmployee ? editingEmployee.status : "Neutre",
      avatar: editingEmployee ? editingEmployee.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(form.nom)}&background=random`,
    };

    try {
      const url = editingEmployee 
        ? `http://localhost:7000/api/employees/${editingEmployee._id}`
        : "http://localhost:7000/api/employees";
      
      const method = editingEmployee ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingEmployee ? "Modifié avec succès" : "Ajouté avec succès");
        fetchEmployees();
        closeModal();
      } else {
        const errorData = await res.json();
        const errorMessage = errorData.detailedError?.message || errorData.message || "Erreur durant l'enregistrement";
        toast.error(errorMessage, { duration: 5000 });
        console.error("Détails de l'erreur 400:", errorData);
      }
    } catch (error) {
      toast.error("Erreur de connexion au serveur");
      console.error(error);
    }
  };

  const handleDelete = (employee) => {
    MySwal.fire({
      title: "Êtes-vous sûr ?",
      text: `Vous allez supprimer ${employee.name}. Cette action est irréversible !`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, supprimer !",
      cancelButtonText: "Annuler",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`http://localhost:7000/api/employees/${employee._id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            toast.success("Salarié supprimé avec succès");
            fetchEmployees();
          } else {
            toast.error("Erreur lors de la suppression");
          }
        } catch (error) {
          toast.error("Erreur de connexion");
          console.error(error);
        }
      }
    });
  };

  const avgTjm = employees.length > 0 
    ? Math.round(employees.reduce((acc, emp) => acc + (Number(emp.tjm) || 0), 0) / employees.length)
    : 0;

  return (
    <div className="text-slate-900 font-sans">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">Gestion des Salariés</h1>
          <p className="text-black font-medium mt-1">
            Suivez la rentabilité et l'affectation des ressources de vos équipes de conseil.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#7ED957] hover:bg-[#6ec948] text-slate-900 font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm w-fit active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Ajouter un salarié
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, client ou rôle..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7ED957] text-sm text-slate-900 transition-colors"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7ED957] text-sm text-slate-900 transition-colors"
            >
              <option>Tous les rôles</option>
              <option>Consultant Senior</option>
              <option>Consultant Junior</option>
              <option>Chef de Projet</option>
              <option>Architecte</option>
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7ED957] text-sm text-slate-900 transition-colors"
            >
              <option>Statut de Rentabilité</option>
              <option>Rentable</option>
              <option>Perte</option>
              <option>Neutre</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm flex items-center justify-center gap-2 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Filtres
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Nom du Salarié", "Rôle", "Client", "TJM", "Statut de Rentabilité", ""].map((h, i) => (
                  <th
                    key={i}
                    className={`px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${i === 5 ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEmployees.map((emp) => (
                <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar} alt={emp.name} className="h-9 w-9 rounded-full object-cover" />
                      <div>
                        <div className="font-medium text-sm text-slate-900">{emp.name}</div>
                        <div className="text-xs text-slate-500">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{emp.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <ClientBadge client={emp.client} color={emp.clientColor || "slate"} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {emp.tjm?.toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={emp.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(emp)}
                        className="text-slate-400 hover:text-[#7ED957] transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(emp)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Affichage de <span className="font-medium text-slate-900">{filtered.length > 0 ? startIndex + 1 : 0}</span> à{" "}
            <span className="font-medium text-slate-900">{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}</span> sur{" "}
            <span className="font-medium text-slate-900">{filtered.length}</span> salariés
          </div>
          <div className="flex gap-2 text-sm">
            <span className="flex items-center px-3 text-slate-500">
              Page {currentPage} sur {totalPages || 1}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-md font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 border border-slate-200 rounded-md font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TJM Moyen */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">TJM Moyen Total</span>
            <svg className="w-5 h-5 text-[#7ED957]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-slate-900">{avgTjm.toLocaleString("fr-FR")} €</div>
          <div className="text-xs text-green-500 mt-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Calculé sur {employees.length} salariés
          </div>
        </div>

        {/* Rentabilité Moyenne */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Rentabilité Moyenne</span>
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-slate-900">14,2%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: "72%" }}></div>
          </div>
        </div>

        {/* Objectif */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Objectif de Rentabilité</span>
            <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-slate-900">10%</div>
          <div className="text-xs text-slate-500 mt-2">
            3 consultants sous le seuil cible
          </div>
        </div>
      </div>


      <AddEmployeeModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        onSave={handleSave} 
        editingEmployee={editingEmployee}
      />
    </div>
  );
}