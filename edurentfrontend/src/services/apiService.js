import axios from 'axios';

// Backend URL
const API_URL = 'http://localhost:8080/api/v1';

// Create an Axios instance to handle all API requests
const apiClient = axios.create({
  baseURL: API_URL,
});

// Retrieves the JWT token from local storage to authenticate requests
const getAuthToken = () => {
  const storedData = localStorage.getItem('eduRentUserData');
  if (storedData) {
    try {
      return JSON.parse(storedData).token;
    } catch (e) {
      console.error("Error parsing stored user data", e);
      localStorage.removeItem('eduRentUserData'); 
    }
  }
  return null;
};

// Automatically attaches the authorization header to every outgoing request if a user is logged in
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Axios request interceptor error:", error);
    return Promise.reject(error);
  }
);

// --- Authentication ---

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

// --- User Profile ---

// Fetches the profile details of the currently logged-in user
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get(`/users/me`);
    return response;
  } catch (error) {
    console.error("Error during getCurrentUser API call:", error.response || error.message);
    throw error;
  }
};

// Retrieves all listings created by a specific user
export const getUserListings = (userId) => {
  return apiClient.get(`/listings/user/${userId}`);
};

// Gets all reviews received by a specific user
export const getUserReviews = (userId) => {
  return apiClient.get(`/reviews/user/${userId}`);
};

// Updates the current user's profile information
export const updateUserProfile = async (payload) => {
  try {
    const response = await apiClient.put(`/users/me`, payload);
    return response;
  } catch (error) {
    console.error("Error during updateUserProfile API call:", error.response || error.message);
    throw error;
  }
};

// --- Schools & Categories ---

export const getSchools = async () => {
  try {
    const response = await apiClient.get(`/schools`);
    return response;
  } catch (error) {
    console.error("Error during getSchools API call:", error.response || error.message);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const response = await apiClient.get(`/categories`);
    return response;
  } catch (error) {
    console.error("Error during getCategories API call:", error.response || error.message);
    throw error;
  }
};

export const getCategoryById = async (id) => {
  try {
    const response = await apiClient.get(`/categories/${id}`);
    return response;
  } catch (error) {
    console.error(`Error during getCategoryById(${id}) API call:`, error.response || error.message);
    throw error;
  }
};

// --- Listings Management ---

export const getListings = async () => {
  try {
    const response = await apiClient.get(`/listings`);
    return response;
  } catch (error) {
    console.error("Error during getListings API call:", error.response || error.message);
    throw error;
  }
};

export const getListingsByCategoryId = async (categoryId) => {
  try {
    const response = await apiClient.get(`/listings/category/${categoryId}`);
    return response;
  } catch (error) {
    console.error(`Error during getListingsByCategoryId(${categoryId}) API call:`, error.response || error.message);
    throw error;
  }
};

export const getUsers = async () => {
  try {
    const response = await apiClient.get(`/users`);
    return response;
  } catch (error) {
    console.error("Error during getUsers API call:", error.response || error.message);
    throw error;
  }
};

// Creates a new listing. Supports file uploads via FormData.
export const createListing = async (listingData) => {
    try {
      const response = await apiClient.post(`/listings`, listingData, {
          headers: {
              // 'Content-Type': 'multipart/form-data', // Browser sets this automatically
          }
      });
      return response;
    } catch (error) {
      console.error("Error during createListing API call:", error.response || error.message);
      throw error;
    }
};

// Fetches details for a single listing (used for edit pages and modals)
export const getListingById = async (listingId) => {
  try {
      const response = await apiClient.get(`/listings/${listingId}`);
      return response;
  } catch (error) {
      console.error(`Error during getListingById(${listingId}) API call:`, error.response || error.message);
      throw error;
  }
};

// Updates an existing listing, including text fields and images
export const updateListing = async (listingId, listingData) => {
    try {
        const response = await apiClient.put(`/listings/${listingId}`, listingData, {
           headers: {
             // 'Content-Type': 'multipart/form-data', 
           }
        });
        return response;
    } catch (error) {
        console.error(`Error during updateListing(${listingId}) API call:`, error.response || error.message);
        throw error;
    }
};

// Permanently removes a listing
export const deleteListing = async (listingId) => {
    try {
        const response = await apiClient.delete(`/listings/${listingId}`);
        return response;
    } catch (error) {
        console.error(`Error during deleteListing(${listingId}) API call:`, error.response || error.message);
        throw error;
    }
};

// Changes the status of a listing (e.g., to 'Sold' or 'Inactive')
export const updateListingStatus = async (listingId, status) => {
  try {
    const response = await apiClient.put(`/listings/${listingId}/status`, null, {
      params: { status }
    });
    return response;
  } catch (error) {
    console.error(`Error updating status for listing ${listingId}:`, error);
    throw error;
  }
};

// --- Likes / Favorites ---

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

// --- Notifications ---

// Fetches notifications for the user, optionally filtering for unread ones
export const getMyNotifications = async (unreadOnly = false) => {
  try {
    const params = {};
    if (unreadOnly) {
      params.unread = true;
    }
    const response = await apiClient.get('/notifications/my-notifications', { params });
    return response;
  } catch (error) {
    console.error("Error during getMyNotifications API call:", error.response || error.message);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response;
  } catch (error) {
    console.error(`Error during markNotificationAsRead(${notificationId}) API call:`, error.response || error.message);
    throw error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await apiClient.put('/notifications/read-all');
    return response;
  } catch (error) {
    console.error("Error during markAllNotificationsAsRead API call:", error.response || error.message);
    throw error;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response;
  } catch (error) {
    console.error(`Error during deleteNotification(${notificationId}) API call:`, error.response || error.message);
    throw error;
  }
};

export const markNotificationAsUnread = async (notificationId) => {
  try {
    const response = await apiClient.put(`/notifications/${notificationId}/unread`);
    return response;
  } catch (error) {
    console.error(`Error during markNotificationAsUnread(${notificationId}) API call:`, error.response || error.message);
    throw error;
  }
};

// --- Chat & Conversations ---

// Initiates a new chat regarding a specific listing
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

// Fetches message history for a specific conversation with pagination
export const getMessages = async (conversationId, page = 0, size = 20) => {
  try {
    const response = await apiClient.get(`/conversations/${conversationId}/messages`, {
        params: { page, size }
    });
    return response;
  } catch (error) {
    console.error(`Error during getMessages(${conversationId}) API call:`, error.response || error.message);
    throw error;
  }
};

export const sendMessage = async (content, conversationId, senderId, attachmentUrl = null) => {
    try {
    const response = await apiClient.post(`/conversations/${conversationId}/messages`, 
      { content,
        attachmentUrl 
      }, 
      { params: { senderId } }
    );
    return response;
  } catch (error) {
    console.error("Error during sendMessage API call:", error.response || error.message);
    throw error;
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    const response = await apiClient.delete(`/conversations/${conversationId}`);
    return response;
  } catch (error) {
    console.error(`Error during deleteConversation(${conversationId}) API call:`, error.response || error.message);
    throw error;
  }
};

// Archives a conversation so it doesn't appear in the main list
export const archiveConversation = async (conversationId) => {
  try {
    const response = await apiClient.put(`/conversations/${conversationId}/archive`);
    return response;
  } catch (error) {
    console.error(`Error during archiveConversation(${conversationId}) API call:`, error.response || error.message);
    throw error;
  }
};

export const markConversationAsRead = async (conversationId) => {
  try {
    const response = await apiClient.put(`/conversations/${conversationId}/read`);
    return response;
  } catch (error) {
    console.error(`Error marking conversation ${conversationId} as read:`, error.response || error.message);
    throw error;
  }
};

export const markConversationAsUnread = async (conversationId) => {
  try {
    const response = await apiClient.put(`/conversations/${conversationId}/unread`);
    return response;
  } catch (error) {
    console.error(`Error marking conversation ${conversationId} as unread:`, error.response || error.message);
    throw error;
  }
};

// Uploads an image file to be sent as a message attachment
export const uploadMessageImage = async (conversationId, file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await apiClient.post(
        `/conversations/${conversationId}/messages/upload-image`, 
        formData
    );
    return response;
  } catch (error) {
    console.error("Error uploading message image:", error.response || error.message);
    throw error;
  }
};

// --- Transactions & Reviews ---

// Records a transaction when an item is sold/rented
export const createTransaction = async (transactionData) => {
  try {
    const { listingId, buyerId, ...body } = transactionData;
    
    const response = await apiClient.post(`/transactions`, body, {
      params: {
        listingId,
        buyerId
      }
    });
    return response;
  } catch (error) {
    console.error("Error during createTransaction API call:", error.response || error.message);
    throw error;
  }
};

// Creates a new review for a specific transaction, including ratings and images
export const createReview = async (reviewData) => {
  try {
    const formData = new FormData();
    formData.append('rating', reviewData.rating);
    formData.append('comment', reviewData.comment);
    formData.append('transactionId', reviewData.transactionId);
    formData.append('reviewerId', reviewData.reviewerId);

    if (reviewData.images && reviewData.images.length > 0) {
      reviewData.images.forEach((file) => {
        formData.append('images', file);
      });
    }

    const response = await apiClient.post(`/reviews`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error("Error during createReview API call:", error.response || error.message);
    throw error;
  }
};

// Checks if a review already exists for a specific transaction
export const getReviewByTransaction = async (transactionId) => {
  try {
    const response = await apiClient.get(`/reviews/transaction/${transactionId}`);
    return response;
  } catch (error) {
    // 404 is valid if no review exists yet
    if (error.response && error.response.status !== 404) {
        console.error(`Error fetching review for transaction ${transactionId}:`, error);
    }
    throw error;
  }
};

export const updateReview = async (reviewId, data) => {
  try {
    const formData = new FormData();
    if (data.rating) formData.append('rating', data.rating);
    if (data.comment) formData.append('comment', data.comment);
    
    // Append IDs of images to delete
    if (data.imagesToDelete && data.imagesToDelete.length > 0) {
      data.imagesToDelete.forEach(id => formData.append('imagesToDelete', id));
    }

    // Append new files
    if (data.newImages && data.newImages.length > 0) {
      data.newImages.forEach(file => formData.append('newImages', file));
    }

    const response = await apiClient.put(`/reviews/${reviewId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response;
  } catch (error) {
    console.error(`Error updating review ${reviewId}:`, error);
    throw error;
  }
};

export const deleteReview = async (reviewId) => {
  try {
    const response = await apiClient.delete(`/reviews/${reviewId}`);
    return response;
  } catch (error) {
    console.error(`Error deleting review ${reviewId}:`, error);
    throw error;
  }
};