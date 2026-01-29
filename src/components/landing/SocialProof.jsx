import React from 'react';

const logos = [
  { name: 'Google', url: '#' },
  { name: 'Microsoft', url: '#' },
  { name: 'Amazon', url: '#' },
  { name: 'Meta', url: '#' },
  { name: 'Netflix', url: '#' },
  { name: 'Apple', url: '#' },
];

export default function SocialProof() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Trusted by the world's leading companies
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 mt-12">
          {logos.map(({ name, url }) => (
            <a key={name} href={url} className="text-lg font-semibold text-muted-foreground hover:text-foreground transition-colors">
              {name}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
