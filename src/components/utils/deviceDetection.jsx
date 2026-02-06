import React from 'react';

export function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = React.useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    deviceType: 'desktop'
  });

  React.useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      
      const mobileRegex = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i;
      const tabletRegex = /ipad|android(?!.*mobile)|tablet/i;
      
      const isMobileUA = mobileRegex.test(userAgent.toLowerCase());
      const isTabletUA = tabletRegex.test(userAgent.toLowerCase());
      
      const screenWidth = window.innerWidth;
      const isMobileScreen = screenWidth < 768;
      const isTabletScreen = screenWidth >= 768 && screenWidth < 1024;
      
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      const isMobile = isMobileUA || (isMobileScreen && hasTouch);
      const isTablet = isTabletUA || (isTabletScreen && hasTouch && !isMobileUA);
      const isDesktop = !isMobile && !isTablet;
      
      let deviceType = 'desktop';
      if (isMobile) deviceType = 'mobile';
      else if (isTablet) deviceType = 'tablet';
      
      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        deviceType,
        screenWidth,
        hasTouch
      });
    };

    detectDevice();
    
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  return deviceInfo;
}

export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /android|webos|iphone|ipod|ipad|blackberry|iemobile|opera mini/i;
  
  return mobileRegex.test(userAgent.toLowerCase()) || 
         (window.innerWidth < 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
}