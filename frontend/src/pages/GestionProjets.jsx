import { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Briefcase, Trash2, Edit2, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import AddProjectModal from "../components/AddProjectModal";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const statusConfig = {
  "En cours": "bg-blue-100 text-blue-700",
  "Terminé": "bg-emerald-100 text-emerald-700",
  "En pause": "bg-amber-100 text-amber-700",
  "Annulé": "bg-red-100 text-red-700",
};

function StatusBadge({ status }) {
  const colorClass = statusConfig[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
      {status}
    </span>
  );
}

export default function GestionProjets() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous les états");
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:7000/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des projets");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSave = async (form) => {
    try {
      const url = editingProject 
        ? `http://localhost:7000/api/projects/${editingProject._id}`
        : "http://localhost:7000/api/projects";
      
      const method = editingProject ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(editingProject ? "Projet modifié" : "Projet créé");
        fetchProjects();
        setIsModalOpen(false);
        setEditingProject(null);
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Erreur lors de l'enregistrement");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  const handleDelete = (project) => {
    MySwal.fire({
      title: "Supprimer ce projet ?",
      text: `Voulez-vous vraiment supprimer "${project.title}" ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`http://localhost:7000/api/projects/${project._id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            toast.success("Projet supprimé");
            fetchProjects();
          }
        } catch {
          toast.error("Erreur de connexion");
        }
      }
    });
  };

  const filtered = projects.filter((p) => {
    const matchSearch = 
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      p.employeeId?.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = statusFilter === "Tous les états" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const activeProjects = projects.filter(p => p.status === "En cours").length;
  const avgMargin = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + (p.marge || 0), 0) / projects.length)
    : 0;

  return (
    <div className="text-slate-900 font-sans">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">Gestion des Projets</h1>
          <p className="text-black font-medium mt-1">
            Pilotez l'affectation de vos consultants et la rentabilité de vos missions.
          </p>
        </div>
        <button 
          onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
          className="bg-[#7ED957] hover:bg-[#6ec948] text-slate-900 font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm w-fit active:scale-95"
        >
          <Briefcase className="w-5 h-5" />
          Ajouter un projet
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-500">Projets Actifs</span>
            <div className="text-2xl font-bold text-slate-900">{activeProjects}</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-500">Marge Moyenne</span>
            <div className="text-2xl font-bold text-slate-900">{avgMargin}%</div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par projet, client ou salarié..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7ED957] text-sm"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7ED957] text-sm"
            >
              <option>Tous les états</option>
              <option>En cours</option>
              <option>Terminé</option>
              <option>En pause</option>
              <option>Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Projet", "Salarié Assigné", "Client", "TJM", "État", ""].map((h, i) => (
                  <th key={i} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-slate-400 text-sm">Chargement...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-slate-400 text-sm">Aucun projet trouvé</td></tr>
              ) : (
                paginated.map((prj) => (
                  <tr key={prj._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-slate-900">{prj.title}</div>
                      <div className="text-xs text-slate-400">{prj.ref}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {prj.employeeId?.avatar && (
                          <img src={prj.employeeId.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                        )}
                        <span className="text-sm text-slate-700">{prj.employeeId?.name || "Non assigné"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {prj.clientName}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {prj.tjm} €<span className="text-[10px] text-slate-400 ml-1">/j</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={prj.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 text-slate-400">
                        <button onClick={() => { setEditingProject(prj); setIsModalOpen(true); }} className="hover:text-[#7ED957]">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(prj)} className="hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-sm">
          <div className="text-slate-500">
            Page {currentPage} sur {totalPages || 1}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-slate-200 rounded hover:bg-white disabled:opacity-50"
            >
              Précédent
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 border border-slate-200 rounded hover:bg-white disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingProject={editingProject}
      />
    </div>
  );
}
