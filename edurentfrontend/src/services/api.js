import axios from 'axios';

// Create an Axios instance configured to talk to your Spring Boot backend
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api', // Your backend's base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define functions to call your specific API endpoints

export const getProducts = () => {
  return apiClient.get('/products');
};

export const getCategories = () => {
  return apiClient.get('/categories');
};

export const getUsers = () => {
  return apiClient.get('/users');
};

// It sends a POST request to the /api/users endpoint with the user's data.
export const registerUser = (userData) => {
  return apiClient.post('/users', userData);
};

// You can add more functions here as you build out your backend
// For example, for logging in or registering:
/*


export const loginUser = (credentials) => {
  return apiClient.post('/auth/login', credentials); // Example
};

export const registerUser = (userData) => {
  return apiClient.post('/auth/register', userData); // Example
*/