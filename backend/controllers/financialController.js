const { spawn } = require("child_process");        //permet à Node.js de lancer un programme externe
const path = require("path");

exports.extractFinancialData = (req, res) => {
    if (!req.file) return res.status(400).send({ error: "Fichier manquant" });

    const filePath = path.resolve(req.file.path); 
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    const scriptPath = path.join(__dirname, "../../microservice-python/ai_extractor.py");
    const pythonPath = "C:\\Users\\user\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";
    console.log(`[Backend] Launching Python extraction: script=${scriptPath}, file=${filePath}`);

    const pythonProcess = spawn(pythonPath, [scriptPath, filePath, fileExt]);

    let dataString = "";
    let errorString = "";

    pythonProcess.stdout.on("data", (data) => {
        dataString += data.toString();
        console.log(`[Python STDOUT]: ${data.toString()}`);
    });

    pythonProcess.stderr.on("data", (err) => {
        errorString += err.toString();
        console.error(`[Python STDERR]: ${err.toString()}`);
    });

    pythonProcess.on("close", (code) => {
        console.log(`[Backend] Python process closed with code ${code}`);
        if (code !== 0) {
            return res.status(500).json({ error: "Le script Python a échoué", details: errorString });
        }
        try {
            const result = JSON.parse(dataString);
            res.json(result); 
        } catch (err) {
            console.error("[Backend] Error parsing JSON from Python:", dataString);
            res.status(500).send({ error: "Erreur JSON lors de l'extraction", raw: dataString });
        }
    });
};

exports.extractZipData = (req, res) => {
    if (!req.file) return res.status(400).send({ error: "Fichier ZIP manquant" });
    const { employeeName, fileType } = req.body;

    if (!employeeName) return res.status(400).send({ error: "Nom du salarié manquant" });

    const filePath = path.resolve(req.file.path);
    const scriptPath = path.join(__dirname, "../../microservice-python/zip_processor.py");
    const pythonPath = "C:\\Users\\user\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";
    
    console.log(`[Backend] Launching ZIP extraction: script=${scriptPath}, file=${filePath}, employee=${employeeName}`);

    const pythonProcess = spawn(pythonPath, [scriptPath, filePath, employeeName, fileType || "unknown"]);

    let dataString = "";
    let errorString = "";

    pythonProcess.stdout.on("data", (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on("data", (err) => {
        const msg = err.toString();
        errorString += msg;
        console.log(`[Backend-ZIP STDERR]: ${msg.trim()}`);
    });

    pythonProcess.on("close", (code) => {
        console.log(`[Backend-ZIP] Python process closed with code ${code}`);
        if (code !== 0) {
            console.error(`[Backend-ZIP] Error output: ${errorString}`);
            return res.status(500).json({ error: "Le traitement du ZIP a échoué", details: errorString });
        }
        try {
            if (!dataString.trim()) {
                console.error("[Backend-ZIP] Python returned empty string");
                return res.status(500).json({ error: "Python a retourné une réponse vide" });
            }
            const result = JSON.parse(dataString);
            console.log(`[Backend-ZIP] Success: found ${result.length} items`);
            res.json(result);
        } catch (err) {
            console.error("[Backend-ZIP] JSON parse error:", dataString);
            res.status(500).send({ error: "Erreur JSON lors du traitement du ZIP", raw: dataString });
        }
    });
};
