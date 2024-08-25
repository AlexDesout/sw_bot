const Api = require('./api');

// Remplacez par l'URL de base de votre API
const BASE_URL = 'http://localhost:8080';

const api = new Api(BASE_URL);

module.exports = api;
