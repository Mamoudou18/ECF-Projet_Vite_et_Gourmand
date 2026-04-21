// config.js
export const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost/api'      // Dev (nginx sur port 80)
  : 'https://vitegourmand-ecf2026-0523fcfb2200.herokuapp.com/api'; // Production

export const URL_IMG = window.location.hostname === 'localhost'
  ? 'http://localhost'
  : 'https://vitegourmand-ecf2026-0523fcfb2200.herokuapp.com';
