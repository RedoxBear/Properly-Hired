import React from 'react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="max-w-md w-full p-8 bg-card rounded-lg shadow-lg border">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Access Restricted</h1>
          <p className="text-muted-foreground mb-8">
            You are not registered to use this application. Please contact the administrator to request access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;