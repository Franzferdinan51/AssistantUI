import React from 'react';

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3.75 18A5.25 5.25 0 009 20.25h6A5.25 5.25 0 0020.25 15a5.25 5.25 0 00-5.25-5.25h-1.5a3.75 3.75 0 01-3.75-3.75V4.5m-4.5 4.5A3.75 3.75 0 019 3.75h1.5" />
  </svg>
);

export default UploadIcon;
