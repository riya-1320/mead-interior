// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/components', // Replace with your API base URL
});

export default api;
