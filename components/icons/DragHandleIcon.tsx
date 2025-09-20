import React from 'react';

const DragHandleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    {...props}
  >
    <path d="M7 3.5A1.5 1.5 0 015.5 5v10a1.5 1.5 0 01-3 0V5A1.5 1.5 0 015.5 3.5zm7 0A1.5 1.5 0 0112.5 5v10a1.5 1.5 0 01-3 0V5a1.5 1.5 0 013 0z" />
  </svg>
);

export default DragHandleIcon;
