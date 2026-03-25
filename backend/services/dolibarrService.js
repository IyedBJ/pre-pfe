const api = require('../config/axiosConfig');

const getProjects = async () => {
  try {
    const response = await api.get('/projects');
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    throw error;
  }
};

module.exports = { getProjects };
