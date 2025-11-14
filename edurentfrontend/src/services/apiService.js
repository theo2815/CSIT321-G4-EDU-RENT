import axios from 'axios';

// Backend URL
const API_URL = 'http://localhost:8080/api/v1';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_URL,
});

// --- Function to get the stored token ---
const getAuthToken = () => {
  const storedData = localStorage.getItem('eduRentUserData');
  if (storedData) {
    try {
      return JSON.parse(storedData).token;
    } catch (e) {
      console.error("Error parsing stored user data", e);
      localStorage.removeItem('eduRentUserData'); // Clear corrupted data
    }
  }
  return null;
};

// --- Add interceptor to automatically add token to requests ---
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // This will catch errors *before* the request is sent
    console.error("Axios request interceptor error:", error);
    return Promise.reject(error);
  }
);

// --- Auth ---
export const registerUser = async (userData) => {
  try {
    const registerData = {
        fullName: userData.fullName,
        studentIdNumber: userData.studentIdNumber,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        password: userData.passwordHash,
        schoolId: userData.schoolId
    };
    const response = await apiClient.post(`/auth/register`, registerData);
    return response;
  } catch (error) {
    console.error("Error during registerUser API call:", error.response || error.message);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post(`/auth/login`, credentials);
    return response;
  } catch (error) {
    console.error("Error during loginUser API call:", error.response || error.message);
    throw error;
  }
};

// --- User ---
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get(`/users/me`);
    return response;
  } catch (error) {
    console.error("Error during getCurrentUser API call:", error.response || error.message);
    throw error;
  }
};

// --- User Specific Data ---
export const getUserListings = (userId) => {
  // Calls GET /api/v1/listings/user/{userId}
  // Token added by interceptor
  return apiClient.get(`/listings/user/${userId}`);
};

export const getUserReviews = (userId) => {
  // Calls GET /api/v1/reviews/user/{userId}
  // Token added by interceptor
  return apiClient.get(`/reviews/user/${userId}`);
};

// --- School ---
export const getSchools = async () => {
  try {
    const response = await apiClient.get(`/schools`);
    return response;
  } catch (error) {
    console.error("Error during getSchools API call:", error.response || error.message);
    throw error;
  }
};

// --- Listings ---
export const getListings = async () => {
  try {
    const response = await apiClient.get(`/listings`);
    return response;
  } catch (error) {
    console.error("Error during getListings API call:", error.response || error.message);
    throw error;
  }
};

// --- NEW FUNCTION (with try/catch) ---
export const getListingsByCategoryId = async (categoryId) => {
  try {
    // Calls GET /api/v1/listings/category/{categoryId}
    const response = await apiClient.get(`/listings/category/${categoryId}`);
    return response;
  } catch (error) {
    console.error(`Error during getListingsByCategoryId(${categoryId}) API call:`, error.response || error.message);
    throw error;
  }
};
// --------------------------------------

// --- Categories ---
export const getCategories = async () => {
  try {
    const response = await apiClient.get(`/categories`);
    return response;
  } catch (error) {
    console.error("Error during getCategories API call:", error.response || error.message);
    throw error;
  }
};

// --- ADDED FUNCTION (for CategoryPage.jsx) ---
export const getCategoryById = async (id) => {
  try {
    const response = await apiClient.get(`/categories/${id}`);
    return response;
  } catch (error) {
    console.error(`Error during getCategoryById(${id}) API call:`, error.response || error.message);
    throw error;
  }
};
// ------------------------------------------

// --- Other User functions ---
export const getUsers = async () => {
  try {
    const response = await apiClient.get(`/users`);
    return response;
  } catch (error) {
    console.error("Error during getUsers API call:", error.response || error.message);
    throw error;
  }
};

// --- Add function for creating listings ---
export const createListing = async (listingData) => {
    try {
      // listingData should be a FormData object if including images
      const response = await apiClient.post(`/listings`, listingData, {
          headers: {
              // 'Content-Type': 'multipart/form-data', // Usually not needed
          }
      });
      return response;
    } catch (error) {
      console.error("Error during createListing API call:", error.response || error.message);
      throw error;
    }
};


// --- NEW: Function to get a single listing (for edit page) ---
export const getListingById = async (listingId) => {
  try {
      const response = await apiClient.get(`/listings/${listingId}`);
      return response;
  } catch (error) {
      console.error(`Error during getListingById(${listingId}) API call:`, error.response || error.message);
      throw error;
  }
};

// --- NEW: Function to update a listing (for edit page) ---
// Note: FormData is used to support changing images
export const updateListing = async (listingId, listingData) => {
    try {
        const response = await apiClient.put(`/listings/${listingId}`, listingData, {
           headers: {
             // 'Content-Type': 'multipart/form-data', // Let browser set
           }
        });
        return response;
    } catch (error) {
        console.error(`Error during updateListing(${listingId}) API call:`, error.response || error.message);
        throw error;
    }
};

// --- NEW: Function to delete a listing ---
export const deleteListing = async (listingId) => {
    try {
        const response = await apiClient.delete(`/listings/${listingId}`);
        return response;
    } catch (error) {
        console.error(`Error during deleteListing(${listingId}) API call:`, error.response || error.message);
        throw error;
    }
};