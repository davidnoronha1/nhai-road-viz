import React, { useRef, useEffect } from 'react';
import { Text, Button, Flex, Separator } from '@radix-ui/themes';
import { FrameData } from './types';

interface VideoPlayerProps {
    videoUrl: string;
    videoCoordinates?: FrameData[];
    isMobile: boolean;
    onClose: () => void;
    onVideoPositionUpdate?: (position: { lat: number; lng: number } | null) => void;
    isInTab?: boolean; // New prop to indicate if it's used within a tab
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    videoUrl,
    videoCoordinates = [],
    isMobile,
    onClose,
    onVideoPositionUpdate,
    isInTab = false
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Handle video time updates to show position on map
    const handleVideoTimeUpdate = () => {
        if (!videoRef.current || !videoCoordinates.length || !onVideoPositionUpdate) return;
        
        const currentTime = videoRef.current.currentTime;
        const videoDuration = videoRef.current.duration;
        
        if (videoDuration && videoDuration > 0) {
            // Calculate which frame we should show based on current time
            const frameIndex = Math.floor((currentTime / videoDuration) * videoCoordinates.length);
            const clampedIndex = Math.min(frameIndex, videoCoordinates.length - 1);
            
            if (videoCoordinates[clampedIndex]) {
                const frame = videoCoordinates[clampedIndex];
                onVideoPositionUpdate({
                    lat: frame.latitude,
                    lng: frame.longitude
                });
            }
        }
    };

    // Clear position marker when component unmounts
    useEffect(() => {
        return () => {
            if (onVideoPositionUpdate) {
                onVideoPositionUpdate(null);
            }
        };
    }, [onVideoPositionUpdate]);

    // Mobile Video Player - Full overlay or inline based on isInTab
    if (isMobile) {
        if (isInTab) {
            // Inline version for tab usage - minimal styling
            return (
                <div style={{ padding: '8px' }}>

                    <video
                        ref={videoRef}
                        controls
                        autoPlay={false}
                        onTimeUpdate={handleVideoTimeUpdate}
                        style={{
                            width: '100%',
                            borderRadius: '4px',
                            objectFit: 'contain',
                        }}
                        src={videoUrl}
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        }
        
        // Full overlay version for popup usage
        return (
            <div
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    right: '20px',
                    bottom: '20px',
                    zIndex: 3000,
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        padding: '12px',
                        backgroundColor: 'var(--color-surface)',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Text weight="bold" size="3">
                        Video Player
                    </Text>
                    <Button
                        variant="ghost"
                        size="2"
                        onClick={onClose}
                        style={{ cursor: 'pointer' }}
                    >
                        ✕
                    </Button>
                </div>

                <div 
                    style={{
                        flex: 1,
                        padding: '12px',
                        display: 'flex',
                        minHeight: 0,
                    }}
                >
                    <video
                        ref={videoRef}
                        controls
                        autoPlay={false}
                        onTimeUpdate={handleVideoTimeUpdate}
                        style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '4px',
                            objectFit: 'contain',
                        }}
                        src={videoUrl}
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        );
    }

    // Desktop Video Player - Inline component
    return (
        <div style={{ 
            flex: '1',
            minWidth: '280px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--gray-1)',
            borderRadius: '6px',
            padding: '12px'
        }}>
            <Flex gap="2" style={{ marginBottom: '8px' }}>
                <video
                    ref={videoRef}
                    controls
                    autoPlay={false}
                    onTimeUpdate={handleVideoTimeUpdate}
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '4px',
                        objectFit: 'contain',
                    }}
                    src={videoUrl}
                >
                    Your browser does not support the video tag.
                </video>
                <Button
                    variant="ghost"
                    size="1"
                    onClick={onClose}
                    style={{ cursor: 'pointer' }}
                >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
                    </svg>
                </Button>
            </Flex>
        </div>
    );
};
