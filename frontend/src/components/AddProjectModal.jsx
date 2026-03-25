import { X, Save, Info, Briefcase } from "lucide-react";
import PropTypes from "prop-types";


export default function AddProjectModal({ isOpen, onClose, onSave, editingProject }) {
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);

  const [form, setForm] = useState({
    title: "",
    employeeId: "",
    clientDolibarrId: "",
    clientName: "",
    tjm: "",
    status: "En cours",
    marge: "10", // Default margin 10%
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchData().catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingProject) {
      setForm({
        title: editingProject.title || "",
        employeeId: editingProject.employeeId?._id || editingProject.employeeId || "",
        clientDolibarrId: editingProject.clientDolibarrId || "",
        clientName: editingProject.clientName || "",
        tjm: editingProject.tjm || "",
        status: editingProject.status || "En cours",
        marge: editingProject.marge || "10",
      });
    } else {
      setForm({
        title: "",
        employeeId: "",
        clientDolibarrId: "",
        clientName: "",
        tjm: "",
        status: "En cours",
        marge: "10",
      });
    }
  }, [editingProject, isOpen]);

  const fetchData = async () => {
    try {
      const [empRes, cliRes] = await Promise.all([
        fetch("http://localhost:7000/api/employees"),
        fetch("http://localhost:7000/api/clients"),
      ]);
      if (!empRes.ok || !cliRes.ok) {
        throw new Error("Erreur de requête HTTP");
      }
      const [empData, cliData] = await Promise.all([empRes.json(), cliRes.json()]);
      setEmployees(empData);
      setClients(cliData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors de la récupération des salariés/clients");
    }
  };

  const handleChange = (field, value) => {
    if (field === "clientDolibarrId") {
      const selectedClient = clients.find((c) => c.id === value);
      setForm((prev) => ({
        ...prev,
        clientDolibarrId: value,
        clientName: selectedClient ? selectedClient.name : "",
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Le titre est requis";
    if (!form.employeeId) newErrors.employeeId = "Le salarié est requis";
    if (!form.clientDolibarrId) newErrors.clientDolibarrId = "Le client est requis";
    if (!form.tjm || Number.isNaN(Number(form.tjm)) || Number(form.tjm) < 0)
      newErrors.tjm = "TJM invalide";

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-[640px] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-[#7fd959]" />
              <h2 className="text-slate-900 text-2xl font-bold leading-tight">
                {editingProject ? "Modifier le Projet" : "Nouveau Projet"}
              </h2>
            </div>
            <p className="text-slate-500 text-sm">
              Associez un salarié à un client et définissez les conditions du projet.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-title" className="text-slate-700 text-sm font-semibold">Titre du Projet</label>
            <input
              id="project-title"
              type="text"

              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Ex: Refonte Frontend, Audit Cloud..."
              className={`w-full h-12 rounded-lg border px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all ${
                errors.title ? "border-red-400" : "border-slate-200"
              }`}
            />
            {errors.title && <p className="text-red-400 text-xs">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="project-employee" className="text-slate-700 text-sm font-semibold">Salarié Assigné</label>
              <select
                id="project-employee"
                value={form.employeeId}

                onChange={(e) => handleChange("employeeId", e.target.value)}
                className={`w-full h-12 rounded-lg border px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all appearance-none cursor-pointer ${
                  errors.employeeId ? "border-red-400" : "border-slate-200"
                }`}
              >
                <option value="">Sélectionner un salarié</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
              {errors.employeeId && <p className="text-red-400 text-xs">{errors.employeeId}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="project-client" className="text-slate-700 text-sm font-semibold">Client (Dolibarr)</label>
              <select
                id="project-client"
                value={form.clientDolibarrId}

                onChange={(e) => handleChange("clientDolibarrId", e.target.value)}
                className={`w-full h-12 rounded-lg border px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all appearance-none cursor-pointer ${
                  errors.clientDolibarrId ? "border-red-400" : "border-slate-200"
                }`}
              >
                <option value="">Sélectionner un client</option>
                {clients.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    {cli.name}
                  </option>
                ))}
              </select>
              {errors.clientDolibarrId && <p className="text-red-400 text-xs">{errors.clientDolibarrId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="project-tjm" className="text-slate-700 text-sm font-semibold">TJM appliqué</label>
              <div className="relative">
                <input
                  id="project-tjm"
                  type="number"

                  value={form.tjm}
                  onChange={(e) => handleChange("tjm", e.target.value)}
                  placeholder="850"
                  className={`w-full h-12 rounded-lg border px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all ${
                    errors.tjm ? "border-red-400" : "border-slate-200"
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">€/j</span>
              </div>
              {errors.tjm && <p className="text-red-400 text-xs">{errors.tjm}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="project-status" className="text-slate-700 text-sm font-semibold">État du Projet</label>
              <select
                id="project-status"
                value={form.status}

                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full h-12 rounded-lg border border-slate-200 px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all appearance-none cursor-pointer"
              >
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
                <option value="En pause">En pause</option>
                <option value="Annulé">Annulé</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-marge" className="text-slate-700 text-sm font-semibold">Marge cible (%)</label>
            <input
              id="project-marge"
              type="range"

              min="0"
              max="100"
              value={form.marge}
              onChange={(e) => handleChange("marge", e.target.value)}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#7fd959]"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
              <span>0%</span>
              <span className="text-[#7fd959] text-sm">{form.marge}%</span>
              <span>100%</span>
            </div>
          </div>


        </form>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-200 transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-8 py-2.5 bg-[#7fd959] text-slate-900 font-bold rounded-lg hover:brightness-105 active:scale-95 transition-all text-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

AddProjectModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  editingProject: PropTypes.shape({
    title: PropTypes.string,
    employeeId: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ _id: PropTypes.string })
    ]),
    clientDolibarrId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    clientName: PropTypes.string,
    tjm: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    marge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
};
