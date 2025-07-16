import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Card, Text, Button, Flex, Box, ScrollArea, Theme, Separator } from '@radix-ui/themes';
import { InfoText } from './InfoText';
import { CoordinateDisplay } from './CoordinateDisplay';
import { LaneAnalysisTable } from './LaneAnalysisTable';
import { PathData } from './types';
import { expandStructureAbbreviations } from './utils';

interface ChainageInfoProps {
  selectedSegment: PathData | null;
  segmentLoading: boolean;
  isMobile: boolean;
  clickPosition: { lat: number; lng: number } | null;
  onClose: () => void;
}

export const ChainageInfo: React.FC<ChainageInfoProps> = ({
  selectedSegment,
  segmentLoading,
  isMobile,
  clickPosition,
  onClose
}) => {
  const isOpen = !!(selectedSegment || segmentLoading);

  // For mobile, return a simple widget without dialog
  if (isMobile) {
    if (segmentLoading) {
      return (
        <Box p="4">
          <Text size="2">Loading segment details...</Text>
        </Box>
      );
    }

    if (!selectedSegment) {
      return (
        <Box p="4" style={{ textAlign: 'center', color: '#666' }}>
          <Text size="2">Click on the map to view segment details</Text>
        </Box>
      );
    }

    return (
      <Box p="3">
        <Flex direction="column" gap="3">
          {/* Basic Information */}
          <Box>
            <Flex justify="between" align="center" style={{ marginBottom: '8px' }}>
              <Text size="3" weight="bold">Segment Details</Text>
              <Button variant="ghost" size="1" onClick={onClose} style={{ cursor: 'pointer' }}>
                <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.8536 2.85355Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                </svg>
              </Button>
            </Flex>
            
            <Flex direction="column" gap="1">
              <InfoText label="NH Number" value={selectedSegment.nh_number || 'N/A'} isMobile={true} />
              <InfoText label="Chainage" value={`${selectedSegment.start_chainage?.toFixed(2)} - ${selectedSegment.end_chainage?.toFixed(2)} km`} isMobile={true} />
              <InfoText label="Length" value={`${selectedSegment.length?.toFixed(2)} km`} isMobile={true} />
              {selectedSegment.structure_details && (
                <InfoText label="Structure" value={expandStructureAbbreviations(selectedSegment.structure_details)} isMobile={true} />
              )}
            </Flex>
          </Box>

          <Separator size="2" />

          {/* Lane Analysis Table */}
          <LaneAnalysisTable selectedSegment={selectedSegment} isMobile={true} />

          {/* Click coordinates */}
          <CoordinateDisplay clickPosition={clickPosition} isMobile={true} />

          {selectedSegment.remark && (
            <Card variant="surface" style={{ padding: '8px' }}>
              <Text size="2"><strong>Remark:</strong> {selectedSegment.remark}</Text>
            </Card>
          )}
        </Flex>
      </Box>
    );
  }

  // Desktop version with dialog
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Content style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 1001,
          maxWidth: '400px',
          maxHeight: '80vh',
          outline: 'none'
        }}>
          <Theme>
            <Card size="3">
              <Flex justify="between" align="center" style={{ marginBottom: '16px' }}>
                <Text size="4" weight="bold">
                  {segmentLoading ? 'Loading...' : 'Chainage Details'}
                </Text>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="2" style={{ cursor: 'pointer' }}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.8536 2.85355Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                    </svg>
                  </Button>
                </Dialog.Close>
              </Flex>

              {segmentLoading ? (
                <Text size="2">Fetching segment details...</Text>
              ) : selectedSegment && (
                <ScrollArea style={{ height: '400px', width: '100%' }}>
                  <Flex direction="column" gap="4" style={{ padding: '0 16px 16px 0' }}>
                    {/* Basic Information */}
                    <Box>
                      <Text size="3" weight="bold" style={{ marginBottom: '8px', display: 'block' }}>
                        Basic Information
                      </Text>
                      <Flex direction="column" gap="1">
                        <InfoText label="NH Number" value={selectedSegment.nh_number || 'N/A'} isMobile={false} />
                        <InfoText label="Chainage" value={`${selectedSegment.start_chainage?.toFixed(2)} - ${selectedSegment.end_chainage?.toFixed(2)} km`} isMobile={false} />
                        <InfoText label="Length" value={`${selectedSegment.length?.toFixed(2)} km`} isMobile={false} />
                        {selectedSegment.structure_details && (
                          <InfoText label="Structure" value={expandStructureAbbreviations(selectedSegment.structure_details)} isMobile={false} />
                        )}
                      </Flex>
                    </Box>

                    <Separator size="2" />

                    {/* Lane Analysis Table */}
                    <LaneAnalysisTable selectedSegment={selectedSegment} isMobile={false} />

                    {/* Click coordinates */}
                    <CoordinateDisplay clickPosition={clickPosition} isMobile={false} />

                    {selectedSegment.remark && (
                      <Card variant="surface" style={{ padding: '8px' }}>
                        <Text size="2"><strong>Remark:</strong> {selectedSegment.remark}</Text>
                      </Card>
                    )}
                  </Flex>
                </ScrollArea>
              )}
            </Card>
          </Theme>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
