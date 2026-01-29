import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="bg-blue-100 p-6 rounded-full mb-6">
        <FileSearch className="w-16 h-16 text-blue-600" />
      </div>
      <h1 className="text-6xl font-extrabold text-slate-900 mb-4">404</h1>
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Page Not Found</h2>
      <p className="text-lg text-slate-600 max-w-md mb-8">
        The page you are looking for doesn't exist or has been moved. 
        Current path: <code className="bg-slate-100 px-2 py-1 rounded text-blue-600 font-semibold">{window.location.pathname}</code>
      </p>
      <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg">
        <Link to="/">Return to Home</Link>
      </Button>
    </div>
  );
}
