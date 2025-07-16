import React, { useState, useEffect } from 'react';
import { Card, Text, Button, Flex, Box, Separator, Badge } from '@radix-ui/themes';
import { InfoText } from './InfoText';
import { VideoPlayer } from './VideoPlayer';
import { PathData, VideoData, FrameData } from './types';
import { getQualityColorScheme } from './utils';
import { API_ENDPOINTS } from '../config';

interface QualityChartProps {
  data: PathData[];
  onPointClick: (segment: PathData) => void;
  isMobile?: boolean;
}

// Import QualityChart component - this will need to be extracted separately
// For now, we'll comment it out to avoid compilation errors
// declare const QualityChart: React.FC<QualityChartProps>;

interface VehiclePathAnalysisProps {
  pathData: PathData[];
  isMobile: boolean;
  handleChartPointClick: (segment: PathData) => void;
  onVideoPositionUpdate?: (position: { lat: number; lng: number } | null) => void;
  onVideoSelect?: (videoUrl: string | null, coordinates?: FrameData[]) => void;
}

// Helper function to calculate average quality score
const calculateAverageQuality = (pathData: PathData[]): number => {
  if (pathData.length === 0) return 0;
  const sum = pathData.reduce((sum, seg) => sum + (seg.overall_quality_score ?? 0), 0);
  return (sum / pathData.length) * 100;
};

export const VehiclePathAnalysis: React.FC<VehiclePathAnalysisProps> = ({ 
  pathData, 
  isMobile,
  handleChartPointClick,
  onVideoPositionUpdate,
  onVideoSelect
}) => {
  const [isPathAnalysisExpanded, setIsPathAnalysisExpanded] = useState(!isMobile);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoCoordinates, setVideoCoordinates] = useState<FrameData[]>([]);

  // Fetch videos from the server
  useEffect(() => {
    const fetchVideos = async () => {
      setLoadingVideos(true);
      try {
        const response = await fetch(API_ENDPOINTS.videos);
        if (response.ok) {
          const videoData = await response.json();
          setVideos(videoData);
        }
      } catch (error) {
        console.error('Failed to fetch videos:', error);
      } finally {
        setLoadingVideos(false);
      }
    };

    fetchVideos();
  }, []);

  const handleVideoClick = async (videoId: number) => {
    const videoUrl = API_ENDPOINTS.videoFile(videoId.toString());
    
    // Fetch video coordinates
    try {
      const response = await fetch(API_ENDPOINTS.videoById(videoId.toString()));
      if (response.ok) {
        const videoData = await response.json();
        const coordinates = videoData.coordinates || [];
        
        if (isMobile && onVideoSelect) {
          // For mobile, use the callback to set video in parent component
          onVideoSelect(videoUrl, coordinates);
        } else {
          // For desktop, set local state
          setSelectedVideo(videoUrl);
          setVideoCoordinates(coordinates);
        }
      }
    } catch (error) {
      console.error('Failed to fetch video coordinates:', error);
      if (isMobile && onVideoSelect) {
        onVideoSelect(videoUrl, []);
      } else {
        setSelectedVideo(videoUrl);
        setVideoCoordinates([]);
      }
    }
  };

  const closeVideoPlayer = () => {
    setSelectedVideo(null);
    setVideoCoordinates([]);
  };

  if (pathData.length === 0) return null;

  // On mobile, return simplified expanded view without card wrapper
  if (isMobile) {
    return (
      <Box style={{ padding: '16px' }}>
        <Flex direction="column" gap="3">
          
          <Flex direction="column" gap="1">
            <InfoText label="Total Segments" value={pathData.length} isMobile={isMobile} />
            <InfoText label="Start Chainage" value={`${pathData[0]?.start_chainage?.toFixed(2)} - ${pathData[0]?.end_chainage?.toFixed(2)} km`} isMobile={isMobile} />
            <InfoText label="End Chainage" value={`${pathData[pathData.length - 1]?.start_chainage?.toFixed(2)} - ${pathData[pathData.length - 1]?.end_chainage?.toFixed(2)} km`} isMobile={isMobile} />
            <InfoText label="NH Number" value={pathData[0]?.nh_number || 'N/A'} isMobile={isMobile} />
          </Flex>

          <Separator size="2" />

          <Flex direction="column" gap="1">
            <Flex align="center" gap="2">
              <Text size="1" weight="medium">Avg Quality Score:</Text>
              <Badge 
                color={getQualityColorScheme(calculateAverageQuality(pathData)).badgeColor}
                size="1"
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 6px'
                }}
              >
                {calculateAverageQuality(pathData).toFixed(1)}%
              </Badge>
            </Flex>
            <InfoText label="Best Segment" value={`${(Math.max(...pathData.map(seg => seg.overall_quality_score ?? 0)) * 100).toFixed(1)}%`} isMobile={isMobile} />
            <InfoText label="Worst Segment" value={`${(Math.min(...pathData.map(seg => seg.overall_quality_score ?? 0)) * 100).toFixed(1)}%`} isMobile={isMobile} />

            <Separator size="2" />

            <InfoText label="Avg Roughness BI" value={`${(pathData.reduce((sum, seg) => sum + (seg.avg_roughness_bi ?? 0), 0) / pathData.length).toFixed(0)} mm/km`} isMobile={isMobile} />
            <InfoText label="Avg Rut Depth" value={`${(pathData.reduce((sum, seg) => sum + (seg.avg_rut_depth ?? 0), 0) / pathData.length).toFixed(1)} mm`} isMobile={isMobile} />
            <InfoText label="Total Length" value={`${pathData.reduce((sum, seg) => sum + (seg.length ?? 0), 0).toFixed(2)} km`} isMobile={isMobile} />
          </Flex>

          <Separator size="2" />

          <Flex direction="column" gap="2">
            <Text weight="bold" size="2">
              Available Videos ({videos.length})
            </Text>
            
            {loadingVideos ? (
              <Text size="1" color="gray">Loading videos...</Text>
            ) : videos.length > 0 ? (
              <Flex direction="column" gap="1">
                {videos.slice(0, 3).map((video) => (
                  <Button
                    key={video.id}
                    variant="soft"
                    size="1"
                    onClick={() => handleVideoClick(video.id)}
                    style={{
                      maxWidth: 'fit-content',
                      cursor: 'pointer',
                      fontSize: '10px',
                      padding: '4px 8px',
                      justifyContent: 'flex-start'
                    }}
                  >
                    📹 {video.filename.split('/').pop()?.replace('.mp4', '') || `Video ${video.id}`}
                  </Button>
                ))}
                {videos.length > 3 && (
                  <Text size="1" color="gray">
                    +{videos.length - 3} more videos
                  </Text>
                )}
              </Flex>
            ) : (
              <Text size="1" color="gray">No videos available</Text>
            )}
            
            {onVideoSelect && (
              <Text size="1" color="blue" style={{ fontStyle: 'italic' }}>
                💡 Tap a video to view it in the Video tab
              </Text>
            )}
          </Flex>
        </Flex>
      </Box>
    );
  }

  // Desktop version with folding card and absolute positioning
  return (
    <>
      <Card style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        zIndex: 1000,
        transition: 'all 0.3s ease-in-out',
        maxWidth: isPathAnalysisExpanded 
          ? (selectedVideo ? '600px' : '400px') 
          : '200px',
        fontSize: '14px',
        maxHeight: '80vh'
      }}>
        {/* Header with toggle button */}
        <Flex style={{ marginBottom: isPathAnalysisExpanded ? '12px' : '0' }}>
          <Text weight={"bold"} size="3" wrap={"nowrap"}>
            {isPathAnalysisExpanded ? 'Vehicle Path Analysis' : 'Path Info'}
          </Text>
          <Button 
            variant="ghost" 
            size="1" 
            onClick={() => setIsPathAnalysisExpanded(!isPathAnalysisExpanded)}
            style={{ cursor: 'pointer', padding: '4px' }}
          >
            <svg 
              width="15" 
              height="15" 
              viewBox="0 0 15 15" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ 
                transform: isPathAnalysisExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}
            >
              <path d="M4 6H11L7.5 10.5L4 6Z" fill="currentColor"></path>
            </svg>
          </Button>
        </Flex>
        
        {/* Collapsible content */}
        {isPathAnalysisExpanded && (
          <Flex 
            direction={!selectedVideo ? "column" : "row"} 
            gap="3"
          >
            {/* Left side - Analysis data */}
            <Box style={{ 
              flex: selectedVideo ? '1' : 'none',
              backgroundColor: selectedVideo ? 'var(--gray-2)' : 'transparent',
              borderRadius: selectedVideo ? '6px' : '0',
              padding: selectedVideo ? '12px' : '0'
            }}>
              <Flex direction="column" gap="1">
                <InfoText label="Total Segments" value={pathData.length} isMobile={false} />
                <InfoText label="Start Chainage" value={`${pathData[0]?.start_chainage?.toFixed(2)} - ${pathData[0]?.end_chainage?.toFixed(2)} km`} isMobile={false} />
                <InfoText label="End Chainage" value={`${pathData[pathData.length - 1]?.start_chainage?.toFixed(2)} - ${pathData[pathData.length - 1]?.end_chainage?.toFixed(2)} km`} isMobile={false} />
                <InfoText label="NH Number" value={pathData[0]?.nh_number || 'N/A'} isMobile={false} />
              </Flex>

              <Box style={{ margin: '12px 0' }}>
                <Separator size="2" />
              </Box>

              <Flex direction="column" gap="1">
                <Flex align="center" gap="2">
                  <Text size="1" weight="medium">Avg Quality Score:</Text>
                  <Badge 
                    color={getQualityColorScheme(calculateAverageQuality(pathData)).badgeColor}
                    size="1"
                    style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '2px 6px'
                    }}
                  >
                    {calculateAverageQuality(pathData).toFixed(1)}%
                  </Badge>
                </Flex>
                <InfoText label="Best Segment" value={`${(Math.max(...pathData.map(seg => seg.overall_quality_score ?? 0)) * 100).toFixed(1)}%`} isMobile={false} />
                <InfoText label="Worst Segment" value={`${(Math.min(...pathData.map(seg => seg.overall_quality_score ?? 0)) * 100).toFixed(1)}%`} isMobile={false} />

                <Box style={{ margin: '8px 0' }}>
                  <Separator size="2" />
                </Box>

                <InfoText label="Avg Roughness BI" value={`${(pathData.reduce((sum, seg) => sum + (seg.avg_roughness_bi ?? 0), 0) / pathData.length).toFixed(0)} mm/km`} isMobile={false} />
                <InfoText label="Avg Rut Depth" value={`${(pathData.reduce((sum, seg) => sum + (seg.avg_rut_depth ?? 0), 0) / pathData.length).toFixed(1)} mm`} isMobile={false} />
                <InfoText label="Total Length" value={`${pathData.reduce((sum, seg) => sum + (seg.length ?? 0), 0).toFixed(2)} km`} isMobile={false} />
              </Flex>

              {/* Video Section */}
              <Box style={{ margin: '12px 0' }}>
                <Separator size="2" />
              </Box>

              <Flex direction="column" gap="2">
                <Text weight="bold" size="2">
                  Available Videos ({videos.length})
                </Text>
                
                {loadingVideos ? (
                  <Text size="1" color="gray">Loading videos...</Text>
                ) : videos.length > 0 ? (
                  <Flex direction="column" gap="1">
                    {videos.slice(0, 3).map((video) => (
                      <Button
                        key={video.id}
                        variant={selectedVideo?.includes(video.id.toString()) ? "solid" : "soft"}
                        size="1"
                        onClick={() => handleVideoClick(video.id)}
                        style={{
                          maxWidth: 'fit-content',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '4px 8px',
                          justifyContent: 'flex-start'
                        }}
                      >
                        📹 {video.filename.split('/').pop()?.replace('.mp4', '') || `Video ${video.id}`}
                      </Button>
                    ))}
                    {videos.length > 3 && (
                      <Text size="1" color="gray">
                        +{videos.length - 3} more videos
                      </Text>
                    )}
                  </Flex>
                ) : (
                  <Text size="1" color="gray">No videos available</Text>
                )}
              </Flex>
            </Box>

            {/* Vertical separator between path info and video */}
            {selectedVideo && (
              <Separator orientation="vertical" style={{ 
                height: 'auto',
                alignSelf: 'stretch',
                margin: '0 12px',
                backgroundColor: 'var(--gray-6)'
              }} />
            )}

            {/* Right side - Video player */}
            {selectedVideo && (
              <VideoPlayer
                videoUrl={selectedVideo}
                videoCoordinates={videoCoordinates}
                isMobile={false}
                onClose={closeVideoPlayer}
                onVideoPositionUpdate={onVideoPositionUpdate}
              />
            )}
          </Flex>
        )}
      </Card>
    </>
  );
};
