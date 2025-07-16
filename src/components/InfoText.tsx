import React from 'react';
import { Text } from '@radix-ui/themes';

interface InfoTextProps {
  label: string;
  value: string | number;
  color?: string;
  isMobile?: boolean;
}

export const InfoText: React.FC<InfoTextProps> = ({ 
  label, 
  value, 
  color, 
  isMobile = false 
}) => (
  <Text size={isMobile ? "1" : "2"} style={{ color }}>
    <strong>{label}:</strong> <span className='data-pt'>{value}</span>
  </Text>
);
