// config.js
export const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost/api'      // Dev (nginx sur port 80)
  : 'https://vitegourmand.com/api'; // Production

export const URL_IMG = window.location.hostname === 'localhost'
  ? 'http://localhost'
  : 'https://vitegourmand.com';
