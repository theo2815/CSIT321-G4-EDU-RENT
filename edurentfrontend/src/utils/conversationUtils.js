/**
 * Conversation data processing utilities.
 * Extracted from MessagesPage.jsx for reusability and maintainability.
 */

/**
 * Processes raw conversation data from the API into UI-friendly format.
 * 
 * @param {Array} convs - Raw conversation data from API
 * @param {number} userId - Current user's ID
 * @returns {Array} Processed conversations with normalized structure
 */
export const processConversationData = (convs, userId) => {
  return convs.map(conv => {
    if (!conv.participants) return null;
    
    // Find the other participant (not the current user)
    const otherParticipant = conv.participants.find(p => {
      const pUserId = p.userId || p.user?.userId || p.user?.id;
      return pUserId !== userId;
    });
    
    // Normalize other user data from various response formats
    const otherUserObj = otherParticipant || otherParticipant?.user || {};
    const otherUser = {
      userId: otherUserObj.userId || otherUserObj.id || 0,
      fullName: otherUserObj.fullName || otherUserObj.name || 'Unknown User',
      profilePictureUrl: otherUserObj.profilePictureUrl || otherUserObj.avatar || null,
      school: otherUserObj.schoolName || 'N/A',
      profileSlug: otherUserObj.profileSlug
    };

    // Extract product image from various nested structures
    let productImageUrl = null;
    if (conv.listing) {
      productImageUrl = conv.listing.imageUrl ||
        (conv.listing.listingImages && conv.listing.listingImages.length > 0 
          ? conv.listing.listingImages[0].imageUrl 
          : null) ||
        (conv.listing.images && conv.listing.images.length > 0 
      ? conv.listing.images[0].imageUrl 
          : null);
    }

    return {
      id: conv.conversationId,
      otherUser: {
        id: otherUser.userId,
        name: otherUser.fullName,
        avatar: otherUser.profilePictureUrl,
        school: otherUser.school,
        profileSlug: otherUser.profileSlug
      },
      product: conv.listing ? {
        ...conv.listing,
        id: conv.listing.listingId,
        title: conv.listing.title,
        price: conv.listing.price,
        status: conv.listing.status, 
        type: conv.listing.listingType, // e.g. "For Rent", "For Sale"
        ownerId: conv.listing.owner?.userId || conv.listing.user?.userId,
        image: productImageUrl,
        iconUrl: productImageUrl
      } : null,
      lastMessagePreview: conv.lastMessageContent || 'Start a conversation',
      lastMessageDate: conv.lastMessageTimestamp || conv.listing?.createdAt,
      isUnread: conv.isUnread || false,
      isArchived: conv.isArchivedForCurrentUser || conv.archivedForCurrentUser || false,
      isListingSold: conv.listingSold || conv.isListingSold || false, // For sold badge
      transactionId: conv.transactionId || null,
      hasReviewed: conv.hasReviewed || false
    };
  }).filter(Boolean);
};

// Note: createConversationFromState was removed as it duplicated inline logic in MessagesPage.jsx
// If needed in the future, it can be restored from git history.

/**
 * Filters conversations based on search query.
 * 
 * @param {Array} conversations - Array of processed conversations
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered conversations
 */
export const filterConversationsBySearch = (conversations, searchQuery) => {
  if (!searchQuery || searchQuery.trim() === '') return conversations;
  
  const query = searchQuery.toLowerCase();
  return conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(query) ||
    (conv.product && conv.product.title.toLowerCase().includes(query))
  );
};

/**
 * Filters conversations by listing ID.
 * 
 * @param {Array} conversations - Array of processed conversations
 * @param {number|null} listingId - Listing ID to filter by
 * @returns {Array} Filtered conversations
 */
export const filterConversationsByListing = (conversations, listingId) => {
  if (!listingId) return conversations;
  return conversations.filter(c => c.product && c.product.id === listingId);
};
