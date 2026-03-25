const express = require('express');
const router = express.Router();
const axios = require('axios');

const dolibarrRequest = async (endpoint, params = {}) => {
  const apiUrl = process.env.DOLIBARR_API_URL;
  const apiKey = process.env.DOLIBARR_API_KEY;
  
  return axios.get(`${apiUrl}${endpoint}`, {
    params: { ...params, api_key: apiKey },
    headers: { 'DOLIAPIKEY': apiKey, 'Accept': 'application/json' }
  });
};

router.get('/', async (req, res) => {
  try {
    console.log("Fetching invoices and thirdparties from Dolibarr...");
    const apiUrl = process.env.DOLIBARR_API_URL;

    let dolibarrThirdparties = [];
    try {
      console.log(`[Dolibarr] Requesting thirdparties from ${apiUrl}/thirdparties with limit 10000`);
      const tpRes = await dolibarrRequest('/thirdparties', { limit: 10000 });
      dolibarrThirdparties = tpRes.data;
    } catch (tpErr) {
      console.error("[Dolibarr] Error fetching thirdparties:", tpErr.message);

    }

    let dolibarrInvoices = [];
    try {
      console.log(`[Dolibarr] Requesting invoices from ${apiUrl}/invoices with limit 10000`);

      const invRes = await dolibarrRequest('/invoices', { limit: 10000 });
      dolibarrInvoices = invRes.data;
    } catch (invErr) {
      console.error("[Dolibarr] Error fetching invoices:", invErr.message);
      return res.status(invErr.response?.status || 500).json({
        message: "Erreur lors de la récupération des factures Dolibarr",
        error: invErr.message
      });
    }

    if (!Array.isArray(dolibarrInvoices)) {
      return res.json([]);
    }
    const thirdpartyMap = {};
    if (Array.isArray(dolibarrThirdparties)) {
      dolibarrThirdparties.forEach(tp => {
        thirdpartyMap[tp.id] = {
          name: tp.name,
          email: tp.email,
          code_client: tp.code_client
        };
      });
    }

    const mappedInvoices = dolibarrInvoices
      .filter(inv => inv.statut !== "0" && inv.statut !== "3"    ) 
      .map(inv => {
      const tp = thirdpartyMap[inv.socid] || {};
      return {
        id: inv.id,
        ref: inv.ref,
        date: inv.date,
        date_lim_reglement: inv.date_lim_reglement,
        total_ht: parseFloat(inv.total_ht || 0),
        total_ttc: parseFloat(inv.total_ttc || 0),
        total_tva: parseFloat(inv.total_tva || 0),
        status: inv.statut || inv.status,
        paye: inv.paye,
        remaintopay: parseFloat(inv.remaintopay !== undefined ? inv.remaintopay : (inv.resteapayer || 0)),
        client_id: inv.socid,
        client_name: tp.name || "Client inconnu",
        client_code: tp.code_client || "N/A"
      };
    });

    res.json(mappedInvoices);
  } catch (err) {
    const status = err.response?.status || 500;
    const errorMessage = err.response?.data?.message || err.message;
    console.error(`Dolibarr API Error Invoices (${status}):`, errorMessage);
    
    res.status(status).json({ 
      message: "Erreur lors de la récupération des factures Dolibarr",
      error: errorMessage,
      isDolibarrError: true
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Dolibarr] Fetching invoice details for ID: ${id}`);
    
    const invRes = await dolibarrRequest(`/invoices/${id}`);
    const inv = invRes.data;


    
    res.json({
      id: inv.id,
      ref: inv.ref,
      date: inv.date,
      total_ht: parseFloat(inv.total_ht || 0),
      total_ttc: parseFloat(inv.total_ttc || 0),
      status: inv.statut || inv.status,
      paye: inv.paye,
      lines: inv.lines || []
    });
  } catch (err) {
    const status = err.response?.status || 500;
    const errorMessage = err.response?.data?.message || err.message;
    console.error(`Dolibarr API Error Invoice Details (${status}):`, errorMessage);
    res.status(status).json({ 
      message: "Erreur lors de la récupération des détails de la facture",
      error: errorMessage
    });
  }
});

module.exports = router;
