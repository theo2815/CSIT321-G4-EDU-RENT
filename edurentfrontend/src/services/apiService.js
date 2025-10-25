import axios from 'axios';

// Backend URL
const API_URL = 'http://localhost:8080/api/v1';

// Create an Axios instance (useful for setting defaults like headers later)
const apiClient = axios.create({
  baseURL: API_URL,
});

// --- Auth ---
export const registerUser = (userData) => {
  // Assuming your DTO for registration includes schoolId
  // Adjust if your RegisterRequest DTO is different
  const registerData = {
      fullName: userData.fullName,
      studentIdNumber: userData.studentIdNumber,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      address: userData.address,
      password: userData.passwordHash, // Backend expects 'password'
      schoolId: userData.schoolId // Pass schoolId in the body if needed by DTO
  };
  // Or if schoolId is still a query param on backend:
  // return apiClient.post(`/auth/register?schoolId=${userData.schoolId}`, registerData);
  return apiClient.post(`/auth/register`, registerData); // Use POST to the new auth endpoint
};

export const loginUser = (credentials) => {
  // Calls the backend /auth/login endpoint
  return apiClient.post(`/auth/login`, credentials); // credentials should be { email: '...', password: '...' }
};

// --- User ---
export const getCurrentUser = () => {
  // Get token from localStorage
  const storedData = localStorage.getItem('eduRentUserData');
  let token = null;
  if (storedData) {
    try {
       token = JSON.parse(storedData).token;
    } catch (e) {
        console.error("Error parsing stored user data", e);
        // Clear corrupted data
        localStorage.removeItem('eduRentUserData');
    }
  }

  if (!token) {
    // If no token, reject the promise immediately
    return Promise.reject(new Error("No authentication token found."));
  }

  // Make a GET request to the protected /users/me endpoint
  // Include the token in the Authorization header
  return apiClient.get(`/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};


// --- School ---
export const getSchools = () => {
  return apiClient.get(`/schools`); // Use apiClient instance
};


// --- Other Placeholders (using apiClient) ---
export const getUsers = () => {
  return apiClient.get(`/users`);
};

export const getProducts = () => {
  return apiClient.get(`/listings`);
};

export const getCategories = () => {
  return apiClient.get(`/categories`);
};