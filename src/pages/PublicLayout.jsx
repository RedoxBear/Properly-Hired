/* eslint-disable react/react-in-jsx-scope, react/prop-types */
import React from 'react';

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

export default PublicLayout;
