import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import profileService from '../../services/profileService';

interface MessageBubbleProps {
  message: string;
  isFromMe: boolean;
  avatar?: string;
  senderName: string;
  timestamp: Date | string;
  isRead?: boolean;
  showAvatar?: boolean;
}

/**
 * MessageBubble Component - Facebook Messenger-style message bubble
 * 
 * Features:
 * - Blue background for sent messages (isFromMe=true)
 * - White background for received messages (isFromMe=false)
 * - Rounded corners with appropriate styling
 * - Avatar display option
 * - Read status indicators (single/double check marks)
 * - Timestamp display
 */
export const MessageBubble = ({
  message,
  isFromMe,
  avatar,
  senderName,
  timestamp,
  isRead = false,
  showAvatar = true,
}: MessageBubbleProps) => {
  const formattedTime = typeof timestamp === 'string' 
    ? format(new Date(timestamp), 'p') 
    : format(timestamp, 'p');

  // Use profileService to get avatar URL with fallback
  const displayAvatar = avatar ? profileService.getProfilePictureUrl(avatar, senderName) : profileService.getProfilePictureUrl(null, senderName);

  return (
    <div className={`flex items-end gap-2 mb-3 ${isFromMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
          <img src={displayAvatar} alt={senderName} className="w-full h-full object-cover" />
        </div>
      )}
      
      {/* Message Container */}
      <div className={`flex flex-col max-w-[70%] ${isFromMe ? 'items-end' : 'items-start'}`}>
        {/* Message Bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl break-words ${
            isFromMe
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>

        {/* Timestamp and Read Status */}
        <div className={`flex items-center gap-1 mt-1 px-1 ${isFromMe ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-gray-500">{formattedTime}</span>
          
          {/* Read Status for Sent Messages */}
          {isFromMe && (
            <span className="flex items-center">
              {isRead ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <Check className="w-3.5 h-3.5 text-gray-400" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Spacer for alignment when avatar is hidden */}
      {!showAvatar && <div className="flex-shrink-0 w-8" />}
    </div>
  );
};

export default MessageBubble;
