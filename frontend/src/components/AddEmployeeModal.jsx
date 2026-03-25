import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";
import { X, Save, Info, UserPlus } from "lucide-react";

export default function AddEmployeeModal({ isOpen, onClose, onSave, editingEmployee }) {
  const [form, setForm] = useState({
    nom: "",
    email: "",
    role: "",
    client: "",
    tjm: "",
    dateEntree: null,
  });

  useEffect(() => {
    if (editingEmployee) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nom: editingEmployee.name || "",
        email: editingEmployee.email || "",
        role: editingEmployee.role || "",
        client: editingEmployee.client || "",
        tjm: editingEmployee.tjm || "",
        dateEntree: editingEmployee.dateEntree ? new Date(editingEmployee.dateEntree) : null,
      });
    } else {
      setForm({ nom: "", email: "", role: "", client: "", tjm: "", dateEntree: null });
    }
  }, [editingEmployee, isOpen]);

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nom.trim()) newErrors.nom = "Le nom est requis";
    if (!form.email.trim()) newErrors.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Email invalide";
    if (!form.role) newErrors.role = "Le rôle est requis";
    if (!form.tjm || isNaN(Number(form.tjm)) || Number(form.tjm) <= 0) 
      newErrors.tjm = "TJM invalide (nombre positif requis)";
    if (!form.dateEntree) newErrors.dateEntree = "La date est requise";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Veuillez corriger les erreurs du formulaire.");
      return;
    }

    const promise = new Promise((resolve) => setTimeout(resolve, 1200));
    toast.promise(promise, {
      loading: "Enregistrement en cours...",
      success: `${form.nom} a été ajouté avec succès !`,
      error: "Une erreur est survenue.",
    });

    promise.then(() => {
      onSave?.(form);
      setForm({ nom: "", email: "", role: "", client: "", tjm: "", dateEntree: null });
      setErrors({});
      onClose?.();
    }).catch(console.error);
  };

  const handleCancel = () => {
    setForm({ nom: "", email: "", role: "", client: "", tjm: "", dateEntree: null });
    setErrors({});
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <div className="bg-white w-full max-w-[640px] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn">
        
        {/* ── Header ── */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-[#7fd959]" />
              <h2 className="text-slate-900 text-2xl font-bold leading-tight">
                {editingEmployee ? "Modifier le Salarié" : "Ajouter un Salarié"}
              </h2>
            </div>
            <p className="text-slate-500 text-sm">
              Configurez le profil du collaborateur pour les prévisions financières.
            </p>
          </div>
          <button
            onClick={handleCancel}
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
          
          {/* Row 1 : Nom + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-semibold">
                Nom complet <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => handleChange("nom", e.target.value)}
                placeholder="Ex: Jean Dupont"
                className={`w-full h-12 rounded-lg border px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all ${
                  errors.nom
                    ? "border-red-400 focus:ring-red-300"
                    : "border-slate-200"
                }`}
              />
              {errors.nom && <p className="text-red-400 text-xs">{errors.nom}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-semibold">
                Email professionnel <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="jean.dupont@cabinet.fr"
                className={`w-full h-12 rounded-lg border px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all ${
                  errors.email
                    ? "border-red-400 focus:ring-red-300"
                    : "border-slate-200"
                }`}
              />
              {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
            </div>
          </div>

          {/* Row 2 : Rôle + Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-semibold">
                Rôle <span className="text-red-400">*</span>
              </label>
              <select
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className={`w-full h-12 rounded-lg border px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all appearance-none cursor-pointer ${
                  errors.role
                    ? "border-red-400 focus:ring-red-300"
                    : "border-slate-200"
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='24px' height='24px' fill='rgb(100,116,139)' viewBox='0 0 256 256'%3e%3cpath d='M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34Zm-96-84.68L128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z'%3e%3c/path%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                  backgroundSize: "1.25rem",
                }}
              >
                <option value="">Sélectionner un rôle</option>
                <option value="Consultant Senior">Consultant Senior</option>
                <option value="Consultant Junior">Consultant Junior</option>
                <option value="Chef de Projet">Chef de Projet</option>
                <option value="Architecte">Architecte</option>
                <option value="Spécialiste Cloud">Spécialiste Cloud</option>
                <option value="Cybersécurité">Cybersécurité</option>
              </select>
              {errors.role && <p className="text-red-400 text-xs">{errors.role}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-semibold">
                Client assigné
              </label>
              <input
                type="text"
                value={form.client}
                onChange={(e) => handleChange("client", e.target.value)}
                placeholder="Ex: Axa Assurances, Interne..."
                className="w-full h-12 rounded-lg border border-slate-200 px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all"
              />
            </div>
          </div>

          {/* Row 3 : TJM + Date d'entrée */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-semibold">
                TJM <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.tjm}
                  onChange={(e) => handleChange("tjm", e.target.value)}
                  placeholder="850"
                  min="0"
                  className={`w-full h-12 rounded-lg border px-4 pr-20 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all ${
                    errors.tjm
                      ? "border-red-400 focus:ring-red-300"
                      : "border-slate-200"
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs pointer-events-none">
                  € / jour
                </span>
              </div>
              {errors.tjm && <p className="text-red-400 text-xs">{errors.tjm}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-semibold">
                Date d'entrée <span className="text-red-400">*</span>
              </label>
              <DatePicker
                selected={form.dateEntree}
                onChange={(date) => handleChange("dateEntree", date)}
                locale={fr}
                dateFormat="dd/MM/yyyy"
                placeholderText="jj/mm/aaaa"
                className={`w-full h-12 rounded-lg border px-4 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all ${
                  errors.dateEntree
                    ? "border-red-400 focus:ring-red-300"
                    : "border-slate-200"
                }`}
                wrapperClassName="w-full"
              />
              {errors.dateEntree && (
                <p className="text-red-400 text-xs">{errors.dateEntree}</p>
              )}
            </div>
          </div>

          {/* Info box */}
          <div className="bg-[#7fd959]/10 border border-[#7fd959]/25 rounded-lg p-4 flex gap-3">
            <Info className="w-5 h-5 text-[#7fd959] shrink-0 mt-0.5" />
            <p className="text-slate-700 text-xs leading-relaxed">
              Le TJM saisi sera utilisé pour calculer la marge prévisionnelle et la
              rentabilité du collaborateur sur ses projets futurs.
            </p>
          </div>
        </form>

        {/* ── Footer ── */}
        <div className="px-8 py-5 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-200 transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-8 py-2.5 bg-[#7fd959] text-slate-900 font-bold rounded-lg hover:brightness-105 hover:shadow-lg active:scale-95 transition-all text-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input { width: 100%; }
      `}</style>
    </div>
  );
}
