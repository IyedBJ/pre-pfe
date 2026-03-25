import { useState, useEffect } from 'react';
import { 
  FileArchive, 
  Upload, 
  CheckCircle2, 
  Loader2,
  X,
  Save,
  Download,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const SaisieGroupe = () => {
  const [zipFiles, setZipFiles] = useState({
    payslips: null,
    expenses: null,
    mileage: null
  });

  const [extractionStatus, setExtractionStatus] = useState({
    isExtracting: false,
    progress: 0,
    currentStep: '',
    results: []
  });

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

  const startExtraction = () => {
    if (!zipFiles.payslips && !zipFiles.expenses && !zipFiles.mileage) {
      toast.error('Veuillez au moins uploader un fichier ZIP');
      return;
    }

    setExtractionStatus({
      isExtracting: true,
      progress: 0,
      currentStep: 'Initialisation de l\'extraction...',
      results: []
    });

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      
      let step = 'Extraction en cours...';
      if (currentProgress < 30) step = 'Analyse des fichiers ZIP...';
      else if (currentProgress < 60) step = 'Lecture OCR des documents...';
      else if (currentProgress < 90) step = 'Traitement des données et réconciliation...';
      else step = 'Finalisation...';

      setExtractionStatus(prev => ({
        ...prev,
        progress: currentProgress,
        currentStep: step
      }));

      if (currentProgress >= 100) {
        clearInterval(interval);
        setExtractionStatus(prev => ({
          ...prev,
          isExtracting: false,
          progress: 100,
          currentStep: 'Extraction terminée avec succès !',
          results: [
            { id: 1, name: 'Jean Dupont', status: 'Succès', details: 'Fiche de paie et frais extraits' },
            { id: 2, name: 'Marie Curie', status: 'Succès', details: 'Fiche de paie extraite' },
            { id: 3, name: 'Albert Einstein', status: 'Erreur', details: 'Fichier corrompu' },
            { id: 4, name: 'Nikola Tesla', status: 'Succès', details: 'Note de frais extraite' },
          ]
        }));
        toast.success('Extraction terminée !');
      }
    }, 200);
  };

  const resetFiles = () => {
    setZipFiles({
      payslips: null,
      expenses: null,
      mileage: null
    });
    setExtractionStatus({
      isExtracting: false,
      progress: 0,
      currentStep: '',
      results: []
    });
    toast.info('Formulaire réinitialisé');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black flex items-center gap-3">
          <FileArchive size={32} className="text-[#7ED957]" />
          Saisie groupe des données mensuelles
        </h1>
        <p className="text-gray-600 mt-1">
          Importation par lots via fichiers ZIP et extraction automatisée des données.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UploadCard 
          title="Fiches de paie (ZIP)" 
          description="Contient tous les PDF de paie du mois"
          file={zipFiles.payslips}
          onFileSelect={(e) => handleFileChange('payslips', e)}
          id="zip-payslips"
        />

        <UploadCard 
          title="Notes de frais (ZIP)" 
          description="Contient les justificatifs de frais"
          file={zipFiles.expenses}
          onFileSelect={(e) => handleFileChange('expenses', e)}
          id="zip-expenses"
        />

        <UploadCard 
          title="Frais kilométriques (ZIP)" 
          description="Contient les relevés kilométriques"
          file={zipFiles.mileage}
          onFileSelect={(e) => handleFileChange('mileage', e)}
          id="zip-mileage"
        />
      </div>

      <div className="flex gap-4 justify-center mb-12">
        <button
          onClick={resetFiles}
          className="flex items-center gap-2 px-8 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
          disabled={extractionStatus.isExtracting}
        >
          <X size={20} />
          Tout annuler
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
          {extractionStatus.isExtracting ? 'Extraction en cours...' : 'Lancer l\'extraction groupée'}
        </button>
      </div>

      {(extractionStatus.isExtracting || extractionStatus.progress > 0) && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b border-gray-50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-black flex items-center gap-2">
                  <Database size={24} className="text-[#7ED957]" />
                  Avancement de l'extraction
                </h2>
                <p className="text-gray-500 text-sm mt-1">{extractionStatus.currentStep}</p>
              </div>
              <span className="text-2xl font-black text-[#7ED957]">{extractionStatus.progress}%</span>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-4 relative overflow-hidden">
              <div 
                className="bg-[#7ED957] h-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(126,217,87,0.5)]"
                style={{ width: `${extractionStatus.progress}%` }}
              />
            </div>
          </div>

          {extractionStatus.results.length > 0 && (
            <div className="p-8 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-black mb-4">Détails du traitement</h3>
              <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                    <tr>
                      <th className="px-6 py-4">Salarié</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4">Détails</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {extractionStatus.results.map((res) => (
                      <tr key={res.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-black">{res.name}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            res.status === 'Succès' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {res.status === 'Succès' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                            {res.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{res.details}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-[#7ED957] hover:text-[#6FC847] p-2 rounded-lg hover:bg-gray-100 transition-all">
                            <Save size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const UploadCard = ({ title, description, file, onFileSelect, id }) => (
  <div className={`relative bg-white p-6 rounded-2xl border-2 border-dashed transition-all duration-300 group
    ${file ? 'border-[#7ED957] bg-green-50/30' : 'border-gray-200 hover:border-[#7ED957]'}`}>
    <div className="flex flex-col items-center text-center gap-4">
      <div className={`p-4 rounded-full transition-transform duration-500 
        ${file ? 'bg-[#7ED957] text-white scale-110 shadow-lg' : 'bg-gray-100 text-gray-400 group-hover:scale-110'}`}>
        {file ? <CheckCircle2 size={32} /> : <FileArchive size={32} />}
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

export default SaisieGroupe;
