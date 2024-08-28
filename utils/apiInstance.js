const Api = require('./api');
require('dotenv').config();

// Remplacez par l'URL de base de votre API
// const BASE_URL = 'http://localhost:8080';
const BASE_URL = 'https://desoutter.alwaysdata.net';

// Remplacez par le point de terminaison d'authentification
const AUTH_ENDPOINT = '/api/auth/login';

// Remplacez par les identifiants nécessaires pour l'authentification
const CREDENTIALS = {
  username: process.env.USERNAME,
  password: process.env.PASSWORD
};

const api = new Api(BASE_URL, AUTH_ENDPOINT, CREDENTIALS);

module.exports = api;
