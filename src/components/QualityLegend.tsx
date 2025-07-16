import React, { useState } from 'react';
import { Card, Text, Button, Flex, Box, Tooltip } from '@radix-ui/themes';

interface QualityLegendProps {
  pathDataLength: number;
  isMobile: boolean;
}

export const QualityLegend: React.FC<QualityLegendProps> = ({ 
  pathDataLength, 
  isMobile 
}) => {
  const [isLegendExpanded, setIsLegendExpanded] = useState(!isMobile);

  if (pathDataLength === 0) return null;

  return (
    <Card style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      zIndex: 1000,
      width: isMobile ? '180px' : '220px',
      transition: 'all 0.3s ease-in-out',
      maxWidth: isLegendExpanded ? (isMobile ? '180px' : '220px') : (isMobile ? '120px' : '150px')
    }}>
      {/* Header with toggle button for mobile */}
      <Flex justify="between" align="center" style={{ marginBottom: isLegendExpanded ? '12px' : '8px' }}>
        <Text size={isMobile ? "2" : "3"} weight="bold" style={{ display: 'block' }}>
          {isLegendExpanded ? 'Road Quality Legend' : 'Legend'}
        </Text>
        {isMobile && (
          <Button 
            variant="ghost" 
            size="1" 
            onClick={() => setIsLegendExpanded(!isLegendExpanded)}
            style={{ cursor: 'pointer', padding: '2px' }}
          >
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 15 15" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ 
                transform: isLegendExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}
            >
              <path d="M4 6H11L7.5 10.5L4 6Z" fill="currentColor"></path>
            </svg>
          </Button>
        )}
      </Flex>

      {(isLegendExpanded || !isMobile) && (
        <Flex direction="column" gap={isMobile ? "2" : "3"}>
          {/* Gradient Bar */}
          <Tooltip content="Road quality gradient: Red (Very Poor) → Green (Excellent)">
            <Box style={{ cursor: 'help' }}>
              <Box
                style={{
                  width: '100%',
                  height: isMobile ? '1em' : '1.2em',
                  background: 'linear-gradient(to right, rgb(255, 0, 0) 0%, rgb(255, 128, 0) 25%, rgb(255, 255, 0) 50%, rgb(128, 255, 0) 75%, rgb(0, 255, 0) 100%)',
                  borderRadius: '10px',
                  border: '1px solid var(--gray-6)',
                  marginBottom: isMobile ? '4px' : '8px'
                }}
              />

              {/* Labels */}
              <Flex justify="between" align="center">
                <Text size="1" color="gray">0%</Text>
                {!isMobile && <Text size="1" color="gray">25%</Text>}
                <Text size="1" color="gray">50%</Text>
                {!isMobile && <Text size="1" color="gray">75%</Text>}
                <Text size="1" color="gray">100%</Text>
              </Flex>
            </Box>
          </Tooltip>
        </Flex>
      )}
    </Card>
  );
};
