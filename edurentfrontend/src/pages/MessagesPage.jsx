import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// Libraries for real-time chat functionality
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

// Custom hooks to manage complex logic outside the view
import usePageLogic from '../hooks/usePageLogic';
import useChatScroll from '../hooks/useChatScroll';
import useAuth from '../hooks/useAuth';

// New Feedback Hooks
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmationContext';

// UI Components
import Header from '../components/Header';
import ListingCard from '../components/ListingCard'; 
import ReviewModal from '../components/ReviewModal'; 
import UserRatingDisplay from '../components/UserRatingDisplay';
import AlertBanner from '../components/AlertBanner'; 

// API functions
import { 
  getCurrentUser, 
  getMessages,                
  sendMessage,                
  getConversationsForUser,
  startConversation,
  getLikedListings,
  likeListing,     
  unlikeListing,
  deleteConversation, 
  archiveConversation,
  markConversationAsRead,
  markConversationAsUnread,
  uploadMessageImage,
  getUserReviews 
} from '../services/apiService';

// Styles
import '../static/MessagesPage.css';
import '../components/LoadMoreButton.css'; // Ensure Load More button styles are available
import defaultAvatar from '../assets/default-avatar.png';

// --- Icons Component ---
const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
  ),
  BackArrow: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
    </svg>
  ),
  Attachment: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
    </svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
    </svg>
  ),
  ChevronDown: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
      </svg>
  ),
  MenuDots: () => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
      <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
    </svg>
  )
};

// --- Skeletons ---
function ChatWindowSkeleton() {
  return (
    <div className="chat-skeleton-loader">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
         <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
         <div className="skeleton" style={{ width: '150px', height: '20px', borderRadius: '4px' }}></div>
      </div>
      <div className="skeleton" style={{ width: '60%', height: '40px', borderRadius: '20px 20px 20px 0', alignSelf: 'flex-start' }}></div>
      <div className="skeleton" style={{ width: '50%', height: '40px', borderRadius: '20px 20px 0 20px', alignSelf: 'flex-end' }}></div>
      <div className="skeleton" style={{ width: '70%', height: '60px', borderRadius: '20px 20px 20px 0', alignSelf: 'flex-start' }}></div>
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="messages-skeleton-container">
       <aside className="skeleton-conversations-sidebar">
        <div className="skeleton skeleton-conversation-header"></div>
        <div className="skeleton skeleton-conversation-search"></div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="skeleton-conversation-item">
            <div className="skeleton skeleton-conversation-avatar"></div>
            <div className="skeleton-conversation-details">
              <div className="skeleton skeleton-conversation-line" style={{ width: '60%' }}></div>
              <div className="skeleton skeleton-conversation-line" style={{ width: '80%' }}></div>
            </div>
          </div>
        ))}
       </aside>
       <main className="skeleton-chat-area">
         <p>Loading Conversations...</p>
       </main>
    </div>
  );
}

// --- Formatters ---
const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
  
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
};
  
const formatChatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const timeOptions = { hour: 'numeric', minute: '2-digit' };
  
    if (isToday) return date.toLocaleTimeString([], timeOptions);
    const diffInHours = (now - date) / 1000 / 60 / 60;
    if (diffInHours < 24 * 6) return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + date.toLocaleTimeString([], timeOptions);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + date.toLocaleTimeString([], timeOptions);
};

export default function MessagesPage() {
  // Access our new feedback tools
  const toast = useToast();
  const confirm = useConfirm();

  // Store user details and the list of active conversations
  const [userData, setUserData] = useState(null);
  const [userName, setUserName] = useState('');
  
  // Independent Tab State: { [filterName]: { data: [], page: 0, hasMore: true, initialized: false } }
  const [conversationsMap, setConversationsMap] = useState({
      'All Messages': { data: [], page: 0, hasMore: true, initialized: false },
      'Selling': { data: [], page: 0, hasMore: true, initialized: false },
      'Buying': { data: [], page: 0, hasMore: true, initialized: false },
      'Unread': { data: [], page: 0, hasMore: true, initialized: false },
      'Archived': { data: [], page: 0, hasMore: true, initialized: false }
  });
  
  // Track the currently open chat and its messages
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]); 
  
  // UI controls for filtering and searching
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Messages');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [listingFilterId, setListingFilterId] = useState(null); 
  
  const location = useLocation(); 
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Visibility toggles for mobile views and menus
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [activeListMenuId, setActiveListMenuId] = useState(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Loading and Error states
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false); 
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false); // New: Track socket connection state

  // References
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const stompClientRef = useRef(null);
  const conversationSubscriptionRef = useRef(null);
  const selectedConversationRef = useRef(null);
  
  // Refs for State Access in WebSocket Callbacks
  const activeFilterRef = useRef(activeFilter);
  const conversationsMapRef = useRef(conversationsMap);

  useEffect(() => { activeFilterRef.current = activeFilter; }, [activeFilter]);
  useEffect(() => { conversationsMapRef.current = conversationsMap; }, [conversationsMap]);

  // Derived state for the active tab
  const activeTabState = conversationsMap[activeFilter] || { data: [], page: 0, hasMore: false };
  const conversations = activeTabState.data;
  const hasMoreConversations = activeTabState.hasMore;
  
  // Loading state for sidebar
  const [isFetchingConversations, setIsFetchingConversations] = useState(false);
  const isFetchingMoreConversations = isFetchingConversations; // Alias for now if needed, or just use isFetchingConversations

  // Pagination state (Messages inside chat)
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  // Image preview state
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Image modal state
  const [selectedImage, setSelectedImage] = useState(null);

  // Scroll management
  const { 
    chatContentRef, 
    showScrollBtn, 
    scrollToBottom, 
    handleScroll: onScrollInternal 
  } = useChatScroll(messages);

  const handleScroll = (e) => {
      onScrollInternal(e);
      handleInfiniteScroll(e);
  };
  
  const [chatUserRating, setChatUserRating] = useState(null);
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
    // Dispatch event to inform Header about the active conversation ID
    window.dispatchEvent(new CustomEvent('active-chat-change', { 
      detail: { id: selectedConversation ? selectedConversation.id : null } 
    }));
  }, [selectedConversation]);

  // --- Likes Handling ---
  const [likedListingIds, setLikedListingIds] = useState(new Set());
  const [likingInProgress, setLikingInProgress] = useState(new Set());

  const handleLikeToggle = async (listingId) => {
    if (likingInProgress.has(listingId)) return;
    setLikingInProgress(prev => new Set(prev).add(listingId));
    
    // Optimistic UI update
    const newLikedIds = new Set(likedListingIds);
    const isCurrentlyLiked = likedListingIds.has(listingId);
    if (isCurrentlyLiked) newLikedIds.delete(listingId); 
    else newLikedIds.add(listingId);
    setLikedListingIds(newLikedIds);

    try { 
      if (isCurrentlyLiked) await unlikeListing(listingId); 
      else await likeListing(listingId); 
    } catch (err) {
      // Revert if failed
      setLikedListingIds(prevIds => {
          const revertedIds = new Set(prevIds);
          if (isCurrentlyLiked) revertedIds.add(listingId); 
          else revertedIds.delete(listingId);
          return revertedIds;
      });
      toast.showError("Failed to update like status.");
    } finally {
      setLikingInProgress(prev => { const next = new Set(prev); next.delete(listingId); return next; });
    }
  };

  const likesHook = { likedListingIds, likingInProgress, handleLikeToggle };
  const { openModal, handleNotificationClick, ModalComponent } = usePageLogic(userData, likesHook);

  const getDateLabel = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const n = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const y = new Date(n);
    y.setDate(n.getDate() - 1);
    if (d.getTime() === n.getTime()) return 'Today';
    if (d.getTime() === y.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // --- Effects & Data Fetching ---

  useEffect(() => {
      if (location.state?.filterByListingId) {
          const targetId = location.state.filterByListingId;
          setListingFilterId(targetId);
          setSearchQuery('');
          setActiveFilter('All Messages'); 
      }
  }, [location.state]);

  const clearListingFilter = () => {
      setListingFilterId(null);
      navigate(location.pathname, { replace: true, state: {} });
  };

  // Debounce search query to reduce re-renders
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredConversations = useMemo(() => {
    if (!userData) return [];
    let result = conversations;

    // Filter by Listing (if coming from a listing page)
    if (listingFilterId) {
        result = result.filter(c => c.product && c.product.id === listingFilterId);
    } 
    
    // REDUNDANT FILTERING REMOVED: 
    // The 'conversations' array is already fetched specifically for the 'activeFilter' from the backend.
    // We do NOT need to re-filter it here. 
    // (e.g. if activeFilter is 'Selling', the backend only returned selling items).

    if (debouncedSearchQuery.trim() !== '') {
        const query = debouncedSearchQuery.toLowerCase();
        result = result.filter(conv =>
          conv.otherUser.name.toLowerCase().includes(query) ||
          (conv.product && conv.product.title.toLowerCase().includes(query))
        );
    }
    return result;
  }, [debouncedSearchQuery, conversations, userData, listingFilterId]);

  // Handle file selection - preview instead of sending immediately
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedConversation) return;
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageFile(file);
    };
    reader.readAsDataURL(file);
    
    // Clear file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle paste event for images
  const handlePaste = useCallback((e) => {
    if (!selectedConversation) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        
        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
          setImageFile(file);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }, [selectedConversation]);

  // Remove image preview
  const removeImagePreview = () => {
    setImagePreview(null);
    setImageFile(null);
  };



  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch User Data
      const userResponse = await getCurrentUser();
      const currentUser = userResponse.data;
      if (!currentUser) throw new Error("No user data.");
      
      setUserData(currentUser);
      setUserName(currentUser.fullName.split(' ')[0]);
      const userId = currentUser.userId;

      // 2. Fetch User Conversations based on CURRENT Active Filter
      // We only fetch for the active tab initially. Others load when clicked.
      const currentTabState = conversationsMap[activeFilter];
      
      // If we already have data for this tab, maybe we don't need to fetch? 
      // But typically on full page reload/init, we should fetch page 0.
      
      const convResponse = await getConversationsForUser(userId, 0, 5, activeFilter); 
      const convs = convResponse.data || [];
      
      const hasMoreForTab = convs.length >= 5;

      // Process conversation data
      const processedConvs = processConversationData(convs, userId);

      setConversationsMap(prev => ({
          ...prev,
          [activeFilter]: {
              data: processedConvs,
              page: 0,
              hasMore: hasMoreForTab
          }
      }));
      
      // 3. Handle External Navigation (e.g. clicking "Chat" on a listing)
      const passedConv = location.state?.openConversation;
      const passedConvId = location.state?.openConversationId;
      const initiateChat = location.state?.initiateChat;

      if (passedConvId) {
           // Check if it exists in the fetched list (or maybe we need to check All Messages if we are on a filtered tab?)
           // Ideally we search in 'All Messages' or the current loaded list.
           // Since we just loaded 'activeFilter', let's check there.
           let targetConv = processedConvs.find(c => c.id === passedConvId);
           
           if (!targetConv) {
               // Try to find in 'All Messages' if we are not there?
               // Or construct it temporarily if we have passedConv object
               if (passedConv) {
                   const participants = passedConv.participants || [];
                   const otherParticipant = participants.find(p => {
                        const pId = p.user?.userId || p.userId; 
                        return pId !== userId;
                   });
                   const otherUserObj = otherParticipant?.user || {};
 
                   targetConv = {
                      id: passedConv.conversationId,
                      otherUser: {
                          id: otherUserObj.userId,
                          name: otherUserObj.fullName || 'User',
                          avatar: otherUserObj.profilePictureUrl
                      },
                      product: passedConv.listing ? {
                          id: passedConv.listing.listingId,
                          title: passedConv.listing.title,
                          price: passedConv.listing.price,
                          ownerId: passedConv.listing.user?.userId,
                          image: passedConv.listing.images?.[0]?.imageUrl,
                          iconUrl: passedConv.listing.images?.[0]?.imageUrl
                      } : null,
                      lastMessagePreview: 'Start a conversation',
                      lastMessageDate: new Date().toISOString(),
                      isUnread: false
                  };
                  
                  // Add to current map view temporarily
                  setConversationsMap(prev => ({
                      ...prev,
                      [activeFilter]: {
                          ...prev[activeFilter],
                          data: [targetConv, ...prev[activeFilter].data]
                      }
                  }));
               }
           }
           
           if (targetConv) {
               handleSelectConversation(targetConv);
               setIsChatVisible(true);
               // Clean up state
               window.history.replaceState({}, document.title);
           }

      } else if (initiateChat && currentUser) {
          // Check if conversation already exists in our processed list
          let targetConv = processedConvs.find(c => 
              c.product?.id === initiateChat.listingId && 
              c.otherUser?.id === initiateChat.sellerId
          );

          if (targetConv) {
              handleSelectConversation(targetConv);
              setIsChatVisible(true);
          } else {
              try {
                  const newConvRes = await startConversation(
                      initiateChat.listingId, 
                      currentUser.userId, 
                      initiateChat.sellerId
                  );
                  
                  const raw = newConvRes.data;
                  const img = raw.listing?.images?.[0]?.imageUrl || raw.listing?.imageUrl || null;
                  
                  const newUiConv = {
                      id: raw.conversationId,
                      otherUser: {
                          id: initiateChat.sellerId,
                          name: raw.participants?.find(p => p.user.userId !== currentUser.userId)?.user.fullName || 'User',
                          avatar: raw.participants?.find(p => p.user.userId !== currentUser.userId)?.user.profilePictureUrl
                      },
                      product: {
                          id: raw.listing.listingId,
                          title: raw.listing.title,
                          price: raw.listing.price,
                          ownerId: raw.listing.user?.userId,
                          image: img,
                          iconUrl: img
                      },
                      lastMessagePreview: 'Start a conversation',
                      lastMessageDate: new Date().toISOString(),
                      isUnread: false
                  };

                  // Add to map
                  setConversationsMap(prev => ({
                      ...prev,
                      [activeFilter]: {
                          ...prev[activeFilter],
                          data: [newUiConv, ...prev[activeFilter].data]
                      }
                  }));
                  
                  handleSelectConversation(newUiConv);
                  setIsChatVisible(true);
              } catch (err) {
                  console.error("Failed to auto-create conversation", err);
                  toast.showError("Could not initialize new chat.");
              }
          }
          window.history.replaceState({}, document.title);
      }

      // 4. Fetch Liked Listings
      const likesResponse = await getLikedListings();
      const likedIds = new Set(likesResponse.data.map(listing => listing.listingId));
      setLikedListingIds(likedIds);

    } catch {
      setError("Could not load messages.");
      // Redirect or handle silent failure
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, location.state]); // Removed activeFilter to prevent full reload on tab switch

  // Helper to process raw conversation data
  const processConversationData = (convs, userId) => {
      return convs.map(conv => {
            if (!conv.participants) return null;
            const otherParticipant = conv.participants.find(p => {
                const pUserId = p.userId || p.user?.userId || p.user?.id; 
                return pUserId !== userId;
            });
            const otherUserObj = otherParticipant || otherParticipant?.user || {};
            const otherUser = { 
                userId: otherUserObj.userId || otherUserObj.id || 0, 
                fullName: otherUserObj.fullName || otherUserObj.name || 'Unknown User', 
                profilePictureUrl: otherUserObj.profilePictureUrl || otherUserObj.avatar || null,
                school: otherUserObj.schoolName || 'N/A'
            };
            
            let productImageUrl = null;
            if (conv.listing) {
                 productImageUrl = conv.listing.imageUrl 
                      || (conv.listing.listingImages && conv.listing.listingImages.length > 0 ? conv.listing.listingImages[0].imageUrl : null)
                      || (conv.listing.images && conv.listing.images.length > 0 ? conv.listing.images[0].imageUrl : null);
            }
  
            return {
                id: conv.conversationId,
                otherUser: {
                    id: otherUser.userId,
                    name: otherUser.fullName,
                    avatar: otherUser.profilePictureUrl,
                    school: otherUser.school
                },
                product: conv.listing ? {
                    ...conv.listing, 
                    id: conv.listing.listingId,
                    title: conv.listing.title,
                    price: conv.listing.price,
                    ownerId: conv.listing.owner?.userId || conv.listing.user?.userId, 
                    image: productImageUrl, 
                    iconUrl: productImageUrl 
                } : null,
                lastMessagePreview: conv.lastMessageContent || 'Start a conversation', 
                lastMessageDate: conv.lastMessageTimestamp || conv.listing?.createdAt,
                isUnread: conv.isUnread || false,
                isArchived: conv.isArchivedForCurrentUser || false,
                transactionId: conv.transactionId || null,
                hasReviewed: conv.hasReviewed || false 
            };
        }).filter(Boolean);
  };

  // Note: fetchData is called via the effect at line ~657, not here (removed duplicate) 
  
  // Define loadTab BEFORE the useEffect that uses it (fixes hoisting issue)
  const loadTab = useCallback(async (filterKey, pageNum) => {
      if (!userData) return;
      setIsFetchingConversations(true);
      try {
          const response = await getConversationsForUser(userData.userId, pageNum, 5, filterKey);
          const rawConvs = response.data || [];
          const processed = processConversationData(rawConvs, userData.userId);
          
          setConversationsMap(prev => {
              const prevData = pageNum === 0 ? [] : (prev[filterKey]?.data || []);
              return {
                  ...prev,
                  [filterKey]: {
                      data: [...prevData, ...processed],
                      page: pageNum,
                      hasMore: rawConvs.length >= 5,
                      initialized: true
                  }
              };
          });
      } catch (err) {
          console.error(`Failed to load tab ${filterKey}`, err);
          toast.showError("Failed to load conversations.");
      } finally {
          setIsFetchingConversations(false);
      }
  }, [userData, toast]);

  // When activeFilter changes, only load if tab not already initialized (caching)
  useEffect(() => {
      if (!userData) return;
      // Only fetch if this tab has never been loaded
      if (!conversationsMap[activeFilter]?.initialized) {
          loadTab(activeFilter, 0);
      }
  }, [activeFilter, userData, conversationsMap, loadTab]);

  // Initial Fetch
  useEffect(() => { fetchData(); }, [fetchData]);

  // --- WEBSOCKET CONNECTION (Global) ---
  // This effect runs ONCE when userData is available to establish the socket connection.
  useEffect(() => {
    if (userData) {
      const socket = new SockJS('http://localhost:8080/ws');
      const stompClient = Stomp.over(socket);

      stompClient.connect({}, () => {
        stompClientRef.current = stompClient;
        setIsConnected(true);

        // Subscribe to sidebar updates (Global user topic)
        stompClient.subscribe(`/topic/user.${userData.userId}`, (message) => {
          const payload = JSON.parse(message.body);

          if (!payload.conversationId) return;

          // Check if we already have this conversation loaded in any view
          const currentMap = conversationsMapRef.current;
          let existsLocally = false;
          
          Object.values(currentMap).forEach(tab => {
              if (tab.data.some(c => c.id === payload.conversationId)) {
                  existsLocally = true;
              }
          });

          if (!existsLocally) {
               // New Conversation! Refresh the current active tab to show it (if applicable)
               // We assume the user wants to see it. Reloading page 0 pulls it to the top.
               console.log("New conversation detected, refreshing tab...");
               loadTab(activeFilterRef.current, 0);
          } else {
               // Update existing in place
               setConversationsMap(prevMap => {
                  const newMap = { ...prevMap };
                  
                  Object.keys(newMap).forEach(key => {
                      const tabData = newMap[key];
                      const convIndex = tabData.data.findIndex(c => c.id === payload.conversationId);
                      
                      if (convIndex > -1) {
                          // Update existing
                          const updatedConv = {
                              ...tabData.data[convIndex],
                              lastMessagePreview: payload.text || '📷 Image',
                              lastMessageDate: payload.timestamp || payload.sentAt,
                              isUnread: payload.senderId !== userData.userId
                          };
                          
                          // Move to top
                          const newDataList = [...tabData.data];
                          newDataList.splice(convIndex, 1);
                          newDataList.unshift(updatedConv);
                          
                          newMap[key] = { ...tabData, data: newDataList };
                      }
                  });
                  return newMap;
              });
          }
      
          // If it matches the open conversation, we might want to trigger read status or other updates?
          // (Handled by active chat subscription usually)
        });
      }, (err) => {
        console.error("Socket connection error:", err);
        setIsConnected(false);
      });

      return () => { 
        if (stompClientRef.current) stompClientRef.current.disconnect(); 
        setIsConnected(false);
      };
    }
  }, [userData, loadTab]); // Added loadTab dependency (stable via useCallback)

  // --- WEBSOCKET SUBSCRIPTION (Active Chat) ---
  // This effect handles subscribing/unsubscribing to the specific conversation topic
  // whenever the user clicks a different conversation.
  useEffect(() => {
    if (!selectedConversation || !isConnected || !stompClientRef.current) return;

    // Unsubscribe from previous chat
    if (conversationSubscriptionRef.current) {
        conversationSubscriptionRef.current.unsubscribe();
    }

    // Subscribe to new chat
    conversationSubscriptionRef.current = stompClientRef.current.subscribe(`/topic/conversation.${selectedConversation.id}`, (message) => {
        const payload = JSON.parse(message.body);
        
        // Prevent duplicate messages if sender is self (handled optimistically)
        if (payload.senderId === userData.userId) return;

        const newMsg = {
            id: payload.id, 
            senderId: payload.senderId, 
            text: payload.text,
            attachmentUrl: payload.attachmentUrl, 
            timestamp: formatChatTimestamp(payload.timestamp), 
            rawDate: payload.timestamp
        };

        setMessages(prev => {
            // Safety check for duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
        });
        
        markConversationAsRead(selectedConversation.id);
    });

    return () => {
        if (conversationSubscriptionRef.current) {
            conversationSubscriptionRef.current.unsubscribe();
        }
    };
  }, [selectedConversation, isConnected, userData]);


  // Load the message history when the user clicks on a conversation
  const handleSelectConversation = async (conversation) => {
    if (activeListMenuId) return; 
    setIsMessagesLoading(true);
    setSelectedConversation(conversation);
    setIsChatVisible(true); 
    setMessages([]); 
    setPage(0);       
    setHasMore(true);
    setIsChatMenuOpen(false);
    setChatUserRating(null);

    // Mark locally as read
    // Mark locally as read (update map)
    updateConversationInMap(conversation.id, c => ({ ...c, isUnread: false }));

    // Note: The WebSocket subscription is now handled by the separate useEffect above,
    // so we don't need to manually subscribe here anymore.

    try {
      const [messagesRes, ratingRes] = await Promise.all([
          getMessages(conversation.id, 0),
          getUserReviews(conversation.otherUser.id),
          markConversationAsRead(conversation.id)
      ]);
      
      // Dispatch event to update Header badge
      window.dispatchEvent(new Event('message-read'));

      const mappedMessages = messagesRes.data.map(msg => ({
          id: msg.messageId, senderId: msg.sender?.userId, text: msg.content,
          attachmentUrl: msg.attachmentUrl, timestamp: formatChatTimestamp(msg.sentAt), rawDate: msg.sentAt
      }));
      setMessages(mappedMessages);
      if (messagesRes.data.length < 20) setHasMore(false);

      const reviews = ratingRes.data || [];
      const count = reviews.length;
      const avg = count > 0 
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count).toFixed(1)
        : 0;
      setChatUserRating({ avg, count });

    } catch (err) {
      console.error("Error loading conversation:", err);
      toast.showError("Failed to load conversation history.");
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const handleLoadMoreConversations = () => {
    if (isFetchingConversations || !conversationsMap[activeFilter]?.hasMore || !userData) return;
    const nextPage = conversationsMap[activeFilter]?.page + 1;
    loadTab(activeFilter, nextPage);
  };

  // --- Sidebar Actions (Delete, Archive, Mark Read) ---
  // Helper to update a conversation in ALL tabs where it exists
  const updateConversationInMap = (convId, updateFn) => {
      setConversationsMap(prevMap => {
          const newMap = { ...prevMap };
          Object.keys(newMap).forEach(key => {
              const tabData = newMap[key];
              const index = tabData.data.findIndex(c => c.id === convId);
              if (index > -1) {
                  const updatedConv = updateFn(tabData.data[index]);
                  // If updateFn returns null/undefined, it means remove it? 
                  // Let's assume updateFn returns the updated object.
                  // Special case: if we are filtering, some updates might remove it from the list (e.g. archiving in "All")
                  // But for now let's just update properties.
                  
                  const newDataList = [...tabData.data];
                  newDataList[index] = updatedConv;
                   newMap[key] = { ...tabData, data: newDataList };
              }
          });
          return newMap;
      });
  };

  // Helper to remove conversation from map
  const removeConversationFromMap = (convId) => {
      setConversationsMap(prevMap => {
          const newMap = { ...prevMap };
          Object.keys(newMap).forEach(key => {
              const tabData = newMap[key];
              const newDataList = tabData.data.filter(c => c.id !== convId);
              if (newDataList.length !== tabData.data.length) {
                   newMap[key] = { ...tabData, data: newDataList };
              }
          });
          return newMap;
      });
  };

  const handleListMenuToggle = (e, convId) => { e.stopPropagation(); setActiveListMenuId(prev => prev === convId ? null : convId); };
  
  const handleArchiveListAction = async (e, conv) => {
    e.stopPropagation(); setActiveListMenuId(null);
    
    // Optimistic update
    updateConversationInMap(conv.id, c => ({ ...c, isArchived: !c.isArchived }));

    try { 
        await archiveConversation(conv.id); 
        toast.showSuccess(conv.isArchived ? "Conversation unarchived" : "Conversation archived");
        // Re-fetch to ensure consistency? Or trust optimistic.
        // If we really want to remove it from the list immediately if we are in a text-specific filter context:
        // E.g. if we are in "Archived" tab and we Unarchive, it should disappear.
        // The optimistic update above just toggles the flag.
        
        // Let's refine the map update to respect the filter immediately?
        // Actually simplest is to just re-fetch the current tab logic or filter locally.
        setConversationsMap(prevMap => {
             const newMap = { ...prevMap };
             // If active filter is "Archived" and we unarchived, remove it from this tab
             if (activeFilter === 'Archived' && conv.isArchived) { // was archived, now unarchived
                  newMap['Archived'].data = newMap['Archived'].data.filter(c => c.id !== conv.id);
             }
             // If active filter is "All" and we archive, it usually stays visible but marked archived? 
             // Logic in backend: "All" excludes archived usually.
             // If "All" excludes archived, then archiving should remove it from "All".
             if (activeFilter === 'All Messages' && !conv.isArchived) { // was not archived, now is
                  newMap['All Messages'].data = newMap['All Messages'].data.filter(c => c.id !== conv.id);
             }
             return newMap;
        });

    } catch (err) { 
        console.error("Archive failed", err); 
        // Revert is hard without previous state history, so just refetch active tab
        loadTab(activeFilter, conversationsMap[activeFilter]?.page || 0);
        toast.showError("Action failed. Reloading...");
    }
  };

  const handleDeleteListAction = async (e, convId) => {
    e.stopPropagation(); setActiveListMenuId(null);
    
    const isConfirmed = await confirm({
        title: "Delete Conversation?",
        message: "This cannot be undone. The chat history will be removed for you.",
        confirmText: "Delete",
        isDangerous: true
    });

    if (!isConfirmed) return;

    removeConversationFromMap(convId);
    
    if (selectedConversation?.id === convId) { setSelectedConversation(null); setIsChatVisible(false); }
    try { 
        await deleteConversation(convId); 
        toast.showSuccess("Conversation deleted");
    } catch (err) { 
        console.error("Delete failed", err); 
        loadTab(activeFilter, 0); // Reload on error
        toast.showError("Failed to delete conversation");
    }
  };

  const handleReadUnreadAction = async (e, conv) => {
    e.stopPropagation(); setActiveListMenuId(null);
    const newStatus = !conv.isUnread; 
    
    updateConversationInMap(conv.id, c => ({ ...c, isUnread: newStatus }));

    try { 
        if (newStatus) await markConversationAsUnread(conv.id); 
        else await markConversationAsRead(conv.id); 
    } catch (err) { 
        console.error("Toggle failed", err); 
        // loadTab(activeFilter, conversationsPage);
    }
  };

  // --- Chat Actions ---
  const handleBackToList = () => {
    setIsChatVisible(false);
    if (conversationSubscriptionRef.current) { conversationSubscriptionRef.current.unsubscribe(); conversationSubscriptionRef.current = null; }
    setSelectedConversation(null);
  };

  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; }
  };

  const handleSendMessage = async () => {
      if ((!newMessage.trim() && !imageFile) || !selectedConversation || !userData) return;
      
      const textToSend = newMessage.trim();
      let imageUrl = null;
      
      setNewMessage(''); 
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      const tempTimestamp = new Date();
      
      try {
          // Upload image if present
          if (imageFile) {
              const response = await uploadMessageImage(selectedConversation.id, imageFile);
              imageUrl = response.data.url;
              removeImagePreview();
          }
          
          const optimisticMsg = {
              id: Date.now(), 
              senderId: userData.userId, 
              text: textToSend,
              attachmentUrl: imageUrl,
              timestamp: formatChatTimestamp(tempTimestamp), 
              rawDate: tempTimestamp.toISOString()
          };
          setMessages(prev => [...prev, optimisticMsg]);
          
          setConversationsMap(prevMap => {
              const newMap = { ...prevMap };
              Object.keys(newMap).forEach(key => {
                  const tabData = newMap[key];
                  const index = tabData.data.findIndex(c => c.id === selectedConversation.id);
                  if (index > -1) {
                       const newDataList = [...tabData.data];
                       const conv = newDataList[index];
                       newDataList.splice(index, 1);
                       newDataList.unshift({ ...conv, lastMessagePreview: textToSend || '📷 Image', lastMessageDate: tempTimestamp.toISOString(), isUnread: false });
                       newMap[key] = { ...tabData, data: newDataList };
                  }
              });
              return newMap;
          });

          await sendMessage(textToSend, selectedConversation.id, userData.userId, imageUrl); 
      } catch (error) { 
          console.error("Failed to send", error); 
          toast.showError("Message failed to send.");
      }
  };

  const handleInfiniteScroll = async (e) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMore && !isFetchingMore) {
      setIsFetchingMore(true);
      const prevHeight = e.currentTarget.scrollHeight; 
      const nextPage = page + 1;
      try {
        const response = await getMessages(selectedConversation.id, nextPage);
        const newRawMessages = response.data;
        if (newRawMessages.length > 0) {
          const mappedNewMessages = newRawMessages.map(msg => ({
            id: msg.messageId, senderId: msg.sender?.userId, text: msg.content,
            attachmentUrl: msg.attachmentUrl, timestamp: formatChatTimestamp(msg.sentAt), rawDate: msg.sentAt
          }));
          setMessages(prev => [...mappedNewMessages, ...prev]);
          setPage(nextPage);
          requestAnimationFrame(() => { if (chatContentRef.current) chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight - prevHeight; });
          if (newRawMessages.length < 20) setHasMore(false);
        } else { setHasMore(false); }
      } catch (err) { console.error("Failed load older messages", err); } finally { setIsFetchingMore(false); }
    }
  };

  const handleArchiveChat = async () => {
      if (!selectedConversation) return;
      const convId = selectedConversation.id;
      const willArchive = !selectedConversation.isArchived;

      // Optimistic updat in map
      updateConversationInMap(convId, c => ({ ...c, isArchived: willArchive }));
      
      // Update selected conversation state too
      setSelectedConversation(prev => ({ ...prev, isArchived: willArchive }));
      
      setIsChatMenuOpen(false); 
      // If we are archiving, do we close the chat? Maybe not, just mark it?
      // Existing logic closed it: setIsChatVisible(false);
      // Let's keep it open but update status, unless it disappears from list and user confusion?
      // Original logic:
      // setSelectedConversation(null); setIsChatMenuOpen(false); setIsChatVisible(false);
      
      // Reverting to original behavior of closing chat if desired, or maybe keeping it open is better UX?
      // Let's stick to original behavior of finding it in list.
      // If I archive it, it might disappear from "All Messages".
      if (willArchive && activeFilter !== 'Archived') {
          setSelectedConversation(null);
          setIsChatVisible(false);
      }
      
      try { 
          await archiveConversation(convId); 
          toast.showSuccess(willArchive ? "Conversation archived" : "Conversation unarchived");
          
          // Re-evaluate list presence
          loadTab(activeFilter, 0); // Reload current tab to correctly filter it out/in
          
      } catch (err) { 
          console.error("Archive failed", err);
          loadTab(activeFilter, 0);
          toast.showError("Failed to update archive status");
      }
  };

  const handleDeleteChat = async () => {
      if (!selectedConversation) return;

      // New Confirm Logic for active chat
      const isConfirmed = await confirm({
          title: "Delete this conversation?",
          message: "You will lose all message history. This cannot be undone.",
          confirmText: "Delete Forever",
          isDangerous: true
      });

      if (!isConfirmed) return;

      const convId = selectedConversation.id;
      removeConversationFromMap(convId);
      
      setSelectedConversation(null); setIsChatMenuOpen(false); setIsChatVisible(false);
      
      try { 
          await deleteConversation(convId); 
          toast.showSuccess("Conversation deleted");
      } catch (err) { 
          console.error("Delete failed", err); 
          loadTab(activeFilter, 0); // Reload
          toast.showError("Failed to delete");
      }
  };

  const handleReviewSuccess = () => {
      updateConversationInMap(selectedConversation.id, c => ({ ...c, hasReviewed: true }));

      if (selectedConversation) {
          setSelectedConversation(prev => ({ ...prev, hasReviewed: true }));
      }
      toast.showSuccess("Review submitted successfully!");
  };

  if (isLoading) {
      return <div className="profile-page"><Header userName="" onLogout={logout} /><MessagesSkeleton /></div>;
  }
  
  if (error) {
      // Replaced the raw error div with your new AlertBanner for consistency
      return (
        <div className="profile-page">
            <Header userName={userName} onLogout={logout} />
            <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
                <AlertBanner type="error" message={`We couldn't load your messages. ${error}`} />
                <button className="btn btn-primary" onClick={fetchData} style={{ marginTop: '1rem' }}>Retry</button>
            </div>
        </div>
      );
  }

  const filterOptions = ['All Messages', 'Selling', 'Buying', 'Unread', 'Archived'];

  return (
    <div className="profile-page">
      {/* Header */}
        <Header userName={userName} 
          profilePictureUrl={userData?.profilePictureUrl}
          onLogout={logout} 
          onNotificationClick={handleNotificationClick} 
        />

      <div className="messages-page-container">
        
        {/* Sidebar: Conversation List */}
        <aside className={`conversations-sidebar ${isChatVisible ? 'mobile-hidden' : ''}`}>
          <div className="conversations-header">
            
            {listingFilterId ? (
                <div className="active-filter-banner">
                    <span>Filtering by Item</span>
                    <button onClick={clearListingFilter} className="clear-filter-btn">✕ Clear</button>
                </div>
            ) : (
                <div className="message-filter-container">
                    <button 
                        className="message-filter-btn" 
                        onClick={(e) => { e.stopPropagation(); setIsFilterDropdownOpen(!isFilterDropdownOpen); }}
                    >
                        {activeFilter} <Icons.ChevronDown />
                    </button>
                    {isFilterDropdownOpen && (
                        <div className="filter-dropdown-menu">
                            {filterOptions.map(option => (
                                <button 
                                    key={option} 
                                    className={`filter-option ${activeFilter === option ? 'active' : ''}`}
                                    onClick={() => { setActiveFilter(option); setIsFilterDropdownOpen(false); }}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="conversation-search-bar">
              <span className="conversation-search-icon"><Icons.Search /></span>
              <input
                type="text"
                className="conversation-search-input"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <ul className="conversations-list">
          {filteredConversations.map((conv) => (
          <li
            key={conv.id}
            className={`conversation-list-item ${selectedConversation?.id === conv.id ? 'active' : ''} ${conv.isUnread ? 'unread' : ''} ${activeListMenuId === conv.id ? 'menu-active' : ''}`}
            onClick={() => handleSelectConversation(conv)}
            style={{ zIndex: activeListMenuId === conv.id ? 1000 : 1, position: 'relative' }}
          >
              <div className="conversation-avatar">
                  <img 
                    src={
                      conv.otherUser.avatar 
                        ? (conv.otherUser.avatar.startsWith('http') ? conv.otherUser.avatar : `http://localhost:8080${conv.otherUser.avatar}`)
                        : defaultAvatar
                    }
                    alt={conv.otherUser.name}
                    className="user-avatar"
                    style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}}
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                  />
              </div>

              <div style={{ flex: 1, minWidth: 0, marginRight: '0.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="conversation-user-name" style={{ marginBottom: '0.25rem' }}>
                    {conv.otherUser.name}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                      {conv.product && (
                          <span style={{ color: 'var(--primary-color)', fontWeight: 500, marginRight: '0.5rem', whiteSpace: 'nowrap' }}>
                              {conv.product.title}:
                          </span>
                      )}
                      <span className="conversation-preview" style={{ color: conv.isUnread ? 'var(--text-color)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.lastMessagePreview}
                      </span>
                  </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatRelativeTime(conv.lastMessageDate)}
                      </span>
                      
                      <div style={{ position: 'relative' }}>
                          <button 
                            className="icon-button" 
                            onClick={(e) => handleListMenuToggle(e, conv.id)}
                            style={{ padding: '2px', fontSize: '1rem', height: '24px', width: '24px' }}
                          >
                            <Icons.MenuDots />
                          </button>

                          {activeListMenuId === conv.id && (
                            <div className="filter-dropdown-menu" style={{ right: '0', left: 'auto', top: '100%', width: '150px', zIndex: 50 }}>
                                <button className="filter-option" onClick={(e) => handleReadUnreadAction(e, conv)}>
                                  {conv.isUnread ? 'Mark as Read' : 'Mark as Unread'}
                                </button>
                                <button className="filter-option" onClick={(e) => handleArchiveListAction(e, conv)}>
                                  {conv.isArchived ? 'Unarchive' : 'Archive'}
                                </button>
                                <button className="filter-option" onClick={(e) => handleDeleteListAction(e, conv.id)} style={{ color: 'red' }}>
                                  Delete
                                </button>
                            </div>
                          )}
                      </div>
                  </div>
                  {conv.isUnread && <span className="unread-dot"></span>}
              </div>
            </li>
          ))}
            {/* Empty State */}
            {filteredConversations.length === 0 && !isFetchingConversations && activeTabState.initialized && (
                <li style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {listingFilterId 
                        ? 'No conversation history found for this item.' 
                        : (activeFilter === 'All Messages' ? 'No conversations found.' : `No '${activeFilter}' conversations found.`)
                    }
                </li>
            )}

            {/* Initial Loading Skeleton for Tab (Prevents Flicker) */}
            {(!activeTabState.initialized || (isFetchingConversations && conversations.length === 0)) && (
                 <div style={{ padding: '1rem' }}>
                    <div className="skeleton-line" style={{ height: '60px', marginBottom: '10px' }}></div>
                    <div className="skeleton-line" style={{ height: '60px', marginBottom: '10px' }}></div>
                    <div className="skeleton-line" style={{ height: '60px' }}></div>
                 </div>
            )}
          </ul>
            {/* Load More Button moved to sidebar bottom */}
            {hasMoreConversations && !isLoading && (
                <div className="load-more-container">
                    <button 
                        className={`load-more-btn ${isFetchingMoreConversations ? 'loading' : ''}`}
                        onClick={handleLoadMoreConversations}
                        disabled={isFetchingMoreConversations}
                    >
                        {isFetchingMoreConversations ? (
                            <>
                                <span className="load-more-spinner"></span>
                                Loading...
                            </>
                        ) : (
                            <>
                                Load More
                                <span className="load-more-icon">▼</span>
                            </>
                        )}
                    </button>
                </div>
            )}
          </aside>

        {/* --- Right Chat Area --- */}
        <main className={`chat-area ${!selectedConversation ? 'no-chat-selected' : ''} ${isChatVisible ? 'mobile-visible' : ''}`}>
          
          {isMessagesLoading ? (
             <ChatWindowSkeleton />
          ) : selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <button className="chat-back-button" onClick={handleBackToList}>
                  <Icons.BackArrow />
                </button>
                <div className="chat-user-info" style={{ flexDirection: 'column', justifyContent: 'center' }}>
                <Link 
                  to={`/profile/${selectedConversation.otherUser.id}`} 
                  className="user-name" 
                  style={{ textDecoration: 'none', color: 'var(--primary-color)', cursor: 'pointer', lineHeight: '1.2' }}
                >
                  {selectedConversation.otherUser.name}
                </Link>

                <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                  {selectedConversation.otherUser.school}
                </span>

                <UserRatingDisplay 
                    userId={selectedConversation.otherUser.id} 
                    initialData={chatUserRating}
                />
              </div>
                
                {/* Embedded Product Card */}
                {selectedConversation.product && (
                  <div className="chat-listing-card-wrapper" style={{ marginLeft: 'auto', marginRight: '10px' }}>
                      <ListingCard
                        listing={selectedConversation.product}
                        onClick={() => openModal(selectedConversation.product)} 
                        isLiked={likedListingIds.has(selectedConversation.product.listingId)}
                        onLikeClick={handleLikeToggle}
                        isLiking={likingInProgress.has(selectedConversation.product.listingId)}
                        currentUserId={userData?.userId}
                        variant="compact" 
                      />
                  </div>
                )}

                {/* Review Action Buttons */}
                {selectedConversation.transactionId && !selectedConversation.hasReviewed && (
                    <button 
                        className="btn btn-primary-accent btn-small"
                        style={{ marginRight: '10px', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        onClick={() => setIsReviewModalOpen(true)}
                    >
                        Write Review
                    </button>
                )}
                {selectedConversation.transactionId && selectedConversation.hasReviewed && (
                    <span style={{ marginRight: '10px', fontSize: '0.8rem', color: '#2ecc71', fontWeight: 'bold' }}>
                        ✓ Reviewed
                    </span>
                )}

                {/* Top Right Chat Actions */}
                <div style={{ marginLeft: '0', position: 'relative' }}>
                      <button 
                          className="icon-button" 
                          onClick={(e) => { e.stopPropagation(); setIsChatMenuOpen(!isChatMenuOpen); }}
                          style={{ fontSize: '1.5rem', cursor: 'pointer', padding: '0 5px' }}
                      >
                          ⋮
                      </button>
                      {isChatMenuOpen && (
                          <div className="filter-dropdown-menu" style={{ right: 0, left: 'auto', top: '100%', width: '150px', zIndex: 100 }}>
                              <button className="filter-option" onClick={handleArchiveChat}>
                                  {selectedConversation.isArchived ? 'Unarchive' : 'Archive'}
                              </button>
                              <button className="filter-option" onClick={handleDeleteChat} style={{color: 'red'}}>
                                  Delete
                              </button>
                          </div>
                      )}
                </div>
              </div>

              {/* Chat History */}
              <div className="chat-content" ref={chatContentRef} onScroll={handleScroll}>
                {isFetchingMore && <div style={{ textAlign: 'center', padding: '10px', fontSize: '0.8rem', color: '#888' }}>Loading history...</div>}
                
                {messages.map((msg, index) => {
                  const prevMsg = messages[index - 1];
                  const currentDateLabel = getDateLabel(msg.rawDate);
                  const prevDateLabel = prevMsg ? getDateLabel(prevMsg.rawDate) : null;
                  const showDateHeader = currentDateLabel !== prevDateLabel;

                  return (
                    <React.Fragment key={msg.id}>
                      {showDateHeader && <div className="date-header-badge">{currentDateLabel}</div>}

                      <div className={`message-bubble-wrapper ${msg.senderId === userData.userId ? 'sent' : 'received'}`}>
                        <div className={`message-bubble ${msg.senderId === userData.userId ? 'sent' : 'received'}`}>
                          {msg.attachmentUrl && (
                              <img 
                                  src={msg.attachmentUrl} 
                                  alt="Attachment" 
                                  className="message-attachment"
                                  onClick={() => setSelectedImage(msg.attachmentUrl)}
                              />
                          )}
                          {msg.text && <div>{msg.text}</div>}
                        </div>
                        <span className="message-timestamp">
                            {formatChatTimestamp(msg.rawDate)}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {showScrollBtn && (
                  <button className="scroll-bottom-btn" onClick={scrollToBottom}>
                      ⬇ New Message
                  </button>
              )}

              {/* Chat Input Area */}
              <div className="chat-input-area">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*"
                    onChange={handleFileSelect} 
                />
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '0.5rem' }}>
                  {imagePreview && (
                    <div className="image-preview-container">
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                      <button className="remove-preview-btn" onClick={removeImagePreview} aria-label="Remove image">
                        ✕
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', width: '100%' }}>
                    <textarea
                      ref={textareaRef}
                      className="chat-input"
                      placeholder="Type here..."
                      value={newMessage}
                      onChange={handleTextareaChange}
                      onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                      onPaste={handlePaste}
                      rows={1}
                    />
                    {(newMessage.trim() || imageFile) ? (
                      <button className="icon-button send-button" onClick={handleSendMessage} aria-label="Send message">
                        <Icons.Send />
                      </button>
                    ) : (
                      <button className="icon-button" aria-label="Attach file" onClick={() => fileInputRef.current?.click()}>
                        <Icons.Attachment />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-conversation-selected">
              <button onClick={handleBackToList} className="empty-state-back-btn">
                  ← Back to Messages
              </button>
              <span className="no-conversation-icon">💬</span>
              <h2>Select a conversation</h2>
              <p>Choose a chat from the left to start messaging.</p>
            </div>
          )}
        </main>
      </div>
      
      {/* Shared Modals */}
      <ModalComponent />

      {/* Review Modal */}
      {isReviewModalOpen && selectedConversation && (
        <div style={{ position: 'relative', zIndex: 3000 }}>
          <ReviewModal 
              transactionId={selectedConversation.transactionId}
              reviewerId={userData.userId}
              otherUserName={selectedConversation.otherUser.name}
              onClose={() => setIsReviewModalOpen(false)}
              onSuccess={handleReviewSuccess}
          />
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setSelectedImage(null)}>✕</button>
            <img src={selectedImage} alt="Full size" className="image-modal-img" />
          </div>
        </div>
      )}

    </div>
  );
}