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



export const getLikedListings = async () => {
    try {
        const response = await apiClient.get('/likes/my-likes');
        return response;
    } catch (error) {
        console.error("Error during getLikedListings API call:", error.response || error.message);
        throw error;
    }
};

export const likeListing = async (listingId) => {
    try {
        const response = await apiClient.post(`/likes/${listingId}`);
        return response;
    } catch (error) {
        console.error(`Error during likeListing(${listingId}) API call:`, error.response || error.message);
        throw error;
    }
};

export const unlikeListing = async (listingId) => {
    try {
        const response = await apiClient.delete(`/likes/${listingId}`);
        return response;
    } catch (error) {
        console.error(`Error during unlikeListing(${listingId}) API call:`, error.response || error.message);
        throw error;
    }
};
// --- End NEW Functions ---

// --- NEW: Notification Functions ---
export const getMyNotifications = async (unreadOnly = false) => {
  try {
    const params = {};
    if (unreadOnly) {
      params.unread = true;
    }
    // Calls GET /api/v1/notifications/my-notifications
    // Token is added by the interceptor
    const response = await apiClient.get('/notifications/my-notifications', { params });
    return response;
  } catch (error) {
    console.error("Error during getMyNotifications API call:", error.response || error.message);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    // Calls PUT /api/v1/notifications/{notificationId}/read
    // Token is added by the interceptor
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response;
  } catch (error) {
    console.error(`Error during markNotificationAsRead(${notificationId}) API call:`, error.response || error.message);
    throw error;
  }


};

// --- NEW: Mark All as Read ---
export const markAllNotificationsAsRead = async () => {
  try {
    // Calls PUT /api/v1/notifications/read-all
    const response = await apiClient.put('/notifications/read-all');
    return response;
  } catch (error) {
    console.error("Error during markAllNotificationsAsRead API call:", error.response || error.message);
    throw error;
  }
};

// --- NEW: Delete Notification ---
export const deleteNotification = async (notificationId) => {
  try {
    // Calls DELETE /api/v1/notifications/{notificationId}
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response;
  } catch (error) {
    console.error(`Error during deleteNotification(${notificationId}) API call:`, error.response || error.message);
    throw error;
  }
};
// --- End NEW Functions ---

// --- NEW: Mark as Unread ---
export const markNotificationAsUnread = async (notificationId) => {
  try {
    // Calls PUT /api/v1/notifications/{notificationId}/unread
    const response = await apiClient.put(`/notifications/${notificationId}/unread`);
    return response;
  } catch (error) {
    console.error(`Error during markNotificationAsUnread(${notificationId}) API call:`, error.response || error.message);
    throw error;
  }
};


// --- Chat / Conversations ---

export const startConversation = async (listingId, starterId, receiverId) => {
  try {
    const response = await apiClient.post('/conversations', null, {
      params: {
        listingId,
        starterId,
        receiverId
      }
    });
    return response;
  } catch (error) {
    console.error("Error during startConversation API call:", error.response || error.message);
    throw error;
  }
};

export const getConversationsForUser = async (userId) => {
  try {
    const response = await apiClient.get(`/conversations/user/${userId}`);
    return response;
  } catch (error) {
    console.error(`Error during getConversationsForUser(${userId}) API call:`, error.response || error.message);
    throw error;
  }
};

export const getMessages = async (conversationId) => {
  try {
    const response = await apiClient.get(`/conversations/${conversationId}/messages`);
    return response;
  } catch (error) {
    console.error(`Error during getMessages(${conversationId}) API call:`, error.response || error.message);
    throw error;
  }
};

export const sendMessage = async (content, conversationId, senderId) => {
  try {
    const response = await apiClient.post(`/conversations/${conversationId}/messages`, 
      { content }, 
      { params: { senderId } }
    );
    return response;
  } catch (error) {
    console.error("Error during sendMessage API call:", error.response || error.message);
    throw error;
  }
};

// --- NEW: Delete & Archive Conversations ---

export const deleteConversation = async (conversationId) => {
  try {
    // DELETE /api/v1/conversations/{conversationId}
    const response = await apiClient.delete(`/conversations/${conversationId}`);
    return response;
  } catch (error) {
    console.error(`Error during deleteConversation(${conversationId}) API call:`, error.response || error.message);
    throw error;
  }
};

export const archiveConversation = async (conversationId) => {
  try {
    // PUT /api/v1/conversations/{conversationId}/archive
    const response = await apiClient.put(`/conversations/${conversationId}/archive`);
    return response;
  } catch (error) {
    console.error(`Error during archiveConversation(${conversationId}) API call:`, error.response || error.message);
    throw error;
  }
};
// -------------------------------------------

// --- NEW: Mark Conversation as Read ---
export const markConversationAsRead = async (conversationId) => {
  try {
    // PUT /api/v1/conversations/{conversationId}/read
    const response = await apiClient.put(`/conversations/${conversationId}/read`);
    return response;
  } catch (error) {
    console.error(`Error marking conversation ${conversationId} as read:`, error.response || error.message);
    throw error;
  }
};
// -------------------------------------------

// --- NEW: Mark Conversation as Unread ---
export const markConversationAsUnread = async (conversationId) => {
  try {
    // PUT /api/v1/conversations/{conversationId}/unread
    const response = await apiClient.put(`/conversations/${conversationId}/unread`);
    return response;
  } catch (error) {
    console.error(`Error marking conversation ${conversationId} as unread:`, error.response || error.message);
    throw error;
  }
};