import React from 'react';

const ChatBubbleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor"
    {...props}
  >
    <path 
      fillRule="evenodd" 
      d="M10 2a8 8 0 100 16 8 8 0 000-16zM3.465 12.023a.75.75 0 01.93-.526a6.502 6.502 0 006.11 0a.75.75 0 01.93.526a4.997 4.997 0 01-8.036-.044a4.997 4.997 0 01.066.044zM5.5 8a.5.5 0 100-1 .5.5 0 000 1zm9 0a.5.5 0 100-1 .5.5 0 000 1z" 
      clipRule="evenodd" 
    />
  </svg>
);

export default ChatBubbleIcon;
