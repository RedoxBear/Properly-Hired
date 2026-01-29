/* eslint-disable react/react-in-jsx-scope, react/prop-types */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasAccess, getUpgradeMessage } from './utils/accessControl';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Lock } from 'lucide-react';

/**
 * PremiumGate component to protect features from non-pro users
 */
const PremiumGate = ({ children, feature, fallback }) => {
  const { user } = useAuth();
  const hasFeatureAccess = hasAccess(user, feature);

  if (hasFeatureAccess) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-lg border-dashed border-2 border-blue-200 bg-blue-50/50">
        <CardHeader className="text-center">
          <div className="mx-auto p-3 rounded-full bg-blue-100 w-fit mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            Premium Feature
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-slate-600">
            {getUpgradeMessage(feature)}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-600">
              <Link to="/Pricing">Upgrade to Pro</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/Dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumGate;
