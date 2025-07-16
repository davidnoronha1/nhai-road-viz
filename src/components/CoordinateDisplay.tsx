import React from 'react';
import { Card, Text, Separator } from '@radix-ui/themes';
import { InfoText } from "./InfoText"

interface CoordinateDisplayProps {
  clickPosition: { lat: number; lng: number } | null;
  isMobile: boolean;
}

export const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({ 
  clickPosition, 
  isMobile 
}) => {
  if (!clickPosition) return null;

  return (
    <>
      <Separator size="2" />
      <InfoText 
        label="Latitude" 
        value={clickPosition.lat.toFixed(6)} 
        isMobile={isMobile} 
      />
      <InfoText 
        label="Longitude" 
        value={clickPosition.lng.toFixed(6)} 
        isMobile={isMobile} 
      />
    </>
  );
};
