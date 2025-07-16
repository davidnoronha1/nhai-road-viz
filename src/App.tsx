import React, { useState, useEffect } from 'react';
import Map from './Map';
import Path from './Path';
import { Theme } from '@radix-ui/themes';
import MobileView from './mobile/MobileView';
import { API_ENDPOINTS } from './config';
import '@radix-ui/themes/styles.css';
import './App.css';

// Custom hook for responsive breakpoints
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
};

import { VehiclePathAnalysis } from './components/VehiclePathAnalysis';
import { Marker } from 'react-leaflet';

function App() {
  const { isMobile } = useResponsive();
  const [pathData, setPathData] = useState([]);
  const [videoPosition, setVideoPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const fetchPathData = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.path);
        if (response.ok) {
          const data = await response.json();
          setPathData(data);
        }
      } catch (error) {
        console.error('Failed to fetch path data:', error);
      }
    };

    fetchPathData();
  }, []);

  // Render MobileApp for mobile view, otherwise render the desktop version
  if (isMobile) {
    return <Theme appearance='dark' panelBackground='solid'>
      <MobileView />
      </Theme>;
  }

  // Position along the NH148N route based on the CSV data
  const defaultPosition = [26.3586, 76.2495]; // Approximate center of the route

  return (
    <Theme appearance='dark' panelBackground='solid'>
      <div className="App">
        <Map position={defaultPosition}>
          <Path color="#ff4444" weight={6} />
        </Map>
      </div>
    </Theme>
  );
}

export default App;