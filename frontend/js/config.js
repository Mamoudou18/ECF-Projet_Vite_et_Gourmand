// config.js
export const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost/api'      // Dev (nginx sur port 80)
  : 'https://vite-et-gourmand.fr/api'; // Production
