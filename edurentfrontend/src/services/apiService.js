import axios from 'axios';

// The base URL of your Spring Boot application
const API_URL = 'http://localhost:8080/api/v1';

// --- School ---
export const getSchools = () => {
  return axios.get(`${API_URL}/schools`);
};

// --- User ---
export const registerUser = (userData, schoolId) => {
  // We send the user data as the request body
  // and the schoolId as a request parameter
  return axios.post(`${API_URL}/users?schoolId=${schoolId}`, userData);
};

export const loginUser = (credentials) => {
  // We will build this endpoint next
  console.warn('loginUser function not yet implemented');
  // return axios.post(`${API_URL}/login`, credentials);
};

export const getUsers = () => {
  return axios.get(`${API_URL}/users`);
};

// --- Listing/Category (for later) ---
export const getProducts = () => {
  return axios.get(`${API_URL}/listings`);
};

export const getCategories = () => {
  return axios.get(`${API_URL}/categories`);
};