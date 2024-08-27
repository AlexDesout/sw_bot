const axios = require('axios');
const qs = require('qs'); // Utilisé pour encoder les données du formulaire

class Api {
  constructor(baseURL, authEndpoint, credentials) {
    this.baseURL = baseURL;
    this.authEndpoint = authEndpoint;
    this.credentials = credentials;
    this.token = null;
    this.tokenExpirationTime = 0;

    this.instance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Méthode pour obtenir un token initial
  async authenticate() {
    try {
      const response = await this.instance.post(this.authEndpoint, qs.stringify(this.credentials), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.token = response.data.token;
      // Définir une expiration en fonction des informations reçues
      this.tokenExpirationTime = Date.now() + 3600 * 1000; // Exemple : le token expire dans 1 heure

    //   console.log('Token obtained:', this.token);
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  }

  // Méthode pour vérifier si le token est expiré
  isTokenExpired() {
    return !this.token || Date.now() >= this.tokenExpirationTime;
  }

  // Méthode pour renouveler le token
  async refreshToken() {
    await this.authenticate();
  }

  // Méthode pour gérer les requêtes
  async request(method, url, data = {}, params = {}) {
    if (this.isTokenExpired()) {
      await this.refreshToken();
    }

    try {
      const response = await this.instance.request({
        method,
        url,
        data,
        params,
        headers: {
          'Authorization': this.token,
        },
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async get(url, params = {}) {
    return this.request('GET', url, {}, params);
  }

  async post(url, data = {}) {
    return this.request('POST', url, data);
  }

  async put(url, data = {}) {
    return this.request('PUT', url, data);
  }

  async delete(url) {
    return this.request('DELETE', url);
  }

  handleApiError(error) {
    console.error('API Error:', error);
    throw error;
  }
}

module.exports = Api;
