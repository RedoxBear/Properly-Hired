import React from 'react';
import { Link } from 'react-router-dom';

const CallToAction = () => {
  return (
    <div className="bg-blue-700 text-white py-20 px-8 text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to Take the Next Step in Your Career?</h2>
        <p className="text-lg md:text-xl mb-8 opacity-90">
          Join thousands of successful job seekers who have transformed their careers with Prague-day's powerful AI tools.
        </p>
        <Link
          to="/auth"
          className="bg-white text-blue-700 font-bold py-3 px-8 rounded-full hover:bg-blue-100 transition-colors text-lg shadow-lg"
        >
          Sign Up for Free
        </Link>
      </div>
    </div>
  );
};

export default CallToAction;
