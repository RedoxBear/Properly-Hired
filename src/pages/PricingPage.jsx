/* eslint-disable react/react-in-jsx-scope, react/prop-types */
import React from 'react';

function PricingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800">Choose Your Plan</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        {/* Free Plan */}
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold mb-4">Free Plan</h2>
          <p className="text-gray-600 mb-4">Basic access to features</p>
          <p className="text-3xl font-bold mb-4">$0/month</p>
          <button 
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            onClick={() => console.log('Initiate Free Plan sign-up')}
          >
            Get Started
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-white p-6 rounded-lg shadow-md text-center border-2 border-blue-500">
          <h2 className="text-2xl font-semibold mb-4">Pro Plan</h2>
          <p className="text-gray-600 mb-4">Full access to all features</p>
          <p className="text-3xl font-bold mb-4">$X.XX/month</p>
          <button 
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            onClick={() => console.log('Initiate Pro Plan payment')}
          >
            Choose Pro
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold mb-4">Premium Plan</h2>
          <p className="text-gray-600 mb-4">Priority support & advanced features</p>
          <p className="text-3xl font-bold mb-4">$Y.YY/month</p>
          <button 
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            onClick={() => console.log('Initiate Premium Plan payment')}
          >
            Go Premium
          </button>
        </div>
      </div>
    </div>
  );
}

export default PricingPage;