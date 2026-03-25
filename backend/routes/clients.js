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
    console.log("Fetching clients and invoices from Dolibarr...");


    const clientsResponse = await dolibarrRequest('/thirdparties', {
      limit: 10000,
      sortfield: 't.nom',
      sortorder: 'ASC'
    });


    const invoicesResponse = await dolibarrRequest('/invoices', {
      limit: 10000
    });

    const dolibarrClients = clientsResponse.data;
    const dolibarrInvoices = invoicesResponse.data;

    const invoiceStats = {};
    if (Array.isArray(dolibarrInvoices)) {
      dolibarrInvoices.forEach(inv => {
        if (inv.statut === "0") return; // Ignorer les brouillons
        
        const sid = inv.socid;
        if (!invoiceStats[sid]) {
          invoiceStats[sid] = {
            total_ht: 0,
            total_ttc: 0,
            resteapayer: 0,
            count: 0,
            last_invoice_ref: inv.ref,
            last_invoice_date: inv.date
          };
        }
        invoiceStats[sid].total_ht += parseFloat(inv.total_ht || 0);
        invoiceStats[sid].total_ttc += parseFloat(inv.total_ttc || 0);
        const outstanding = inv.remaintopay !== undefined ? inv.remaintopay : (inv.resteapayer || 0);
        invoiceStats[sid].resteapayer += parseFloat(outstanding || 0);
        invoiceStats[sid].count += 1;
      });
    }

    const mappedClients = dolibarrClients
      .filter(c => c.client === "1" || c.client === 1 || c.client === "3" || c.client === 3)
      .map(c => {
        const stats = invoiceStats[c.id] || { total_ht: 0, total_ttc: 0, resteapayer: 0, count: 0 };
        const logoUrl = c.logo ? `http://localhost:7000/api/clients/logo/${c.id}/${c.logo}` : null;

        return {
          id: c.id,
          name: c.name,
          email: c.email || null,
          phone: c.phone || null,
          address: c.address || null,
          zip: c.zip || null,
          town: c.town || null,
          country_code: c.country_code || null,
          url: c.url || null,
          code_client: c.code_client || null,
          tva_intra: c.tva_intra || null,
          forme_juridique: c.forme_juridique || null,
          capital: c.capital ? parseFloat(c.capital) : null,
          effectif: c.effectif || null,
          date_creation: c.date_creation || null,
          avatar: logoUrl,
          siren: c.idprof1 || null,
          siret: c.idprof2 || null,
          ape: c.idprof3 || null,
          note_public: c.note_public || null,
         
          total_ca_ht: stats.total_ht,
          total_ca_ttc: stats.total_ttc,
          outstanding_amount: stats.resteapayer,
          invoice_count: stats.count,
          last_invoice_ref: stats.last_invoice_ref || null,
          last_invoice_date: stats.last_invoice_date || null
        };
      });

    res.json(mappedClients);

    
  } catch (err) {
    const status = err.response?.status || 500;
    const errorMessage = err.response?.data?.message || err.message;
    console.error(`Dolibarr API Error (${status}):`, errorMessage);
    
    res.status(status).json({ 
      message: "Erreur lors de la récupération des clients Dolibarr",
      error: errorMessage,
      isDolibarrError: true
    });
  }
});
router.get('/logo/:id/:filename', async (req, res) => {
  try {
    const { id, filename } = req.params;
    const apiUrl = process.env.DOLIBARR_API_URL;
    const apiKey = process.env.DOLIBARR_API_KEY;

    const dolibarrLogoUrl = `${apiUrl}/documents/download`;
    
    const filePath = `${id}/logos/${filename}`;

    console.log(`[LogoProxy] Fetching for Client ${id}: ${filePath}`);

    const response = await axios({
      method: 'get',
      url: dolibarrLogoUrl,
      params: {
        modulepart: 'societe',
        original_file: filePath, 
        api_key: apiKey
      },
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.content) {
      console.log(`[LogoProxy] Received base64 for ${filename}`);
      const buffer = Buffer.from(response.data.content, 'base64');
      const contentType = response.data['content-type'] || 'image/png';
      res.set('Content-Type', contentType);
      res.send(buffer);
    } else {
      console.log(`[LogoProxy] Pipe stream for ${filename}`);
      res.set('Content-Type', response.headers['content-type'] || 'image/png');
      if (typeof response.data.pipe === 'function') {
        response.data.pipe(res);
      } else {
        res.send(response.data);
      }
    }
  } catch (err) {
    console.error(`[LogoProxy] Error ${req.params.filename}:`, err.response?.data?.error?.message || err.message);
    res.status(404).send('Logo not found');
  }
});

module.exports = router;
