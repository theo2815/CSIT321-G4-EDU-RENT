// This hooks manages chat scroll behavior, including auto-scrolling and "New Message" button visibility
import { useRef, useState, useEffect } from 'react';

export default function useChatScroll(messages) {
  const chatContentRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const isNearBottomRef = useRef(true);
  const lastMessageIdRef = useRef(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMsg = messages[messages.length - 1];
    
    // Only trigger if the message ID actually changed
    if (lastMsg.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMsg.id;
      
      // If user was already at the bottom, scroll to the new message
      if (isNearBottomRef.current) {
        scrollToBottom();
      } else {
        // If user was scrolled up, show the "New Message" button
        setShowScrollBtn(true);
      }
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTo({
        top: chatContentRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setShowScrollBtn(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    isNearBottomRef.current = distanceFromBottom < 100;
    
    if (isNearBottomRef.current) {
      setShowScrollBtn(false);
    }
  };

  return {
    chatContentRef,
    showScrollBtn,
    scrollToBottom,
    handleScroll
  };
}