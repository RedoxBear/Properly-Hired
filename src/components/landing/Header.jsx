import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFAQ = () => {
    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <img src="/src/assets/prague-day-logo.svg" alt="Prague Day Logo" className="h-6 w-auto" />
            <span className="hidden font-bold sm:inline-block">Prague Day</span>
          </a>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <button onClick={scrollToFeatures} className="transition-colors hover:text-foreground/80 text-foreground/60">Features</button>
            <button onClick={scrollToPricing} className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</button>
            <button onClick={scrollToFAQ} className="transition-colors hover:text-foreground/80 text-foreground/60">FAQ</button>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/auth')}>Log In</Button>
            <Button onClick={() => navigate('/auth')}>Get Started</Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
