import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t py-8 mt-20">
      <div className="container mx-auto text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Prague Day. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
