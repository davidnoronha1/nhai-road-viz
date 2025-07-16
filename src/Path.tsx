import React, { useState, useEffect, useRef } from 'react';
import { Polyline, Popup, Marker, useMapEvents, useMap } from 'react-leaflet';
import { LatLng, DivIcon } from 'leaflet';
import { Hotline } from 'react-leaflet-hotline';
import * as Dialog from '@radix-ui/react-dialog';
import { Theme, Tooltip, Separator, Card, Text, Badge, Button, Flex, Box, Heading, ScrollArea } from '@radix-ui/themes';
import { QualityLegend } from './components/QualityLegend';
import { VehiclePathAnalysis } from './components/VehiclePathAnalysis';
import { ChainageInfo } from './components/ChainageInfo';
import { InfoText } from './components/InfoText';
import { PathData } from './components/types';
import { getQualityColorScheme, expandStructureAbbreviations } from './components/utils';
import { API_ENDPOINTS } from './config';

const Em = ({ children }: { children: React.ReactNode }) => <span className='data-pt'>{children}</span>

// Custom hook for responsive breakpoints
const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 'mobile';
      if (window.innerWidth < 1024) return 'tablet';
      return 'desktop';
    }
    return 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setBreakpoint('mobile');
      } else if (window.innerWidth < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    breakpoint
  };
};

// Internal text component for consistent styling
// Custom hook for responsive breakpoints
// Custom hook for responsive breakpoints
const QualityChart: React.FC<{
  data: PathData[],
  onPointClick: (segment: PathData) => void,
  isMobile?: boolean
}> = ({ data, onPointClick, isMobile = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = isMobile ? 8 : 10;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw quality line and points
    if (data.length > 1) {
      // Draw smooth line
      ctx.strokeStyle = '#4a9eff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      data.forEach((segment, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const score = segment.overall_quality_score ?? 0;
        const y = padding + chartHeight - (score * chartHeight);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          // Create smooth curves using quadratic curves
          const prevX = padding + (chartWidth / (data.length - 1)) * (index - 1);
          const prevScore = data[index - 1].overall_quality_score ?? 0;
          const prevY = padding + chartHeight - (prevScore * chartHeight);

          const midX = (prevX + x) / 2;
          const midY = (prevY + y) / 2;

          ctx.quadraticCurveTo(prevX, prevY, midX, midY);
        }
      });

      // Complete the last segment
      if (data.length > 1) {
        const lastIndex = data.length - 1;
        const lastX = padding + (chartWidth / (data.length - 1)) * lastIndex;
        const lastScore = data[lastIndex].overall_quality_score ?? 0;
        const lastY = padding + chartHeight - (lastScore * chartHeight);
        ctx.lineTo(lastX, lastY);
      }

      ctx.stroke();

      // Draw subtle gradient area under the line
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#4a9eff';
      ctx.lineTo(padding + chartWidth, padding + chartHeight); // bottom right
      ctx.lineTo(padding, padding + chartHeight); // bottom left
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Draw interactive points only
      data.forEach((segment, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const score = segment.overall_quality_score ?? 0;
        const y = padding + chartHeight - (score * chartHeight);

        // Only show point when hovered
        if (hoveredPoint === index) {
          // Determine color based on score
          let color = '#ff6b6b'; // red
          if (score >= 0.8) color = '#51cf66'; // green
          else if (score >= 0.6) color = '#ffd43b'; // yellow
          else if (score >= 0.4) color = '#ff922b'; // orange

          // Draw larger highlighted point
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, 2 * Math.PI);
          ctx.fill();

          // Add white border for better visibility
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Add subtle shadow
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 2;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowColor = 'transparent';
        }
      });
    }
  }, [data, hoveredPoint]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = 10;
    const chartWidth = canvas.width - padding * 2;

    if (data.length > 1) {
      const pointIndex = Math.round((x - padding) / (chartWidth / (data.length - 1)));
      if (pointIndex >= 0 && pointIndex < data.length) {
        setHoveredPoint(pointIndex);
      } else {
        setHoveredPoint(null);
      }
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = 10;
    const chartWidth = canvas.width - padding * 2;

    if (data.length > 1) {
      const pointIndex = Math.round((x - padding) / (chartWidth / (data.length - 1)));
      if (pointIndex >= 0 && pointIndex < data.length) {
        onPointClick(data[pointIndex]);
      }
    }
  };

  return (
    <div style={{ marginTop: isMobile ? '8px' : '12px' }}>
      <Text size={isMobile ? "1" : "2"} weight="bold" style={{ marginBottom: isMobile ? '6px' : '8px', display: 'block' }}>
        Quality Score Trend
      </Text>
      <canvas
        ref={canvasRef}
        width={isMobile ? 200 : 250}
        height={isMobile ? 80 : 100}
        style={{
          cursor: 'pointer',
          border: '1px solid var(--gray-7)',
          borderRadius: '4px',
          display: 'block',
          width: '100%',
          maxWidth: isMobile ? '200px' : '250px',
          backgroundColor: '#1a1a1a'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
        onClick={handleClick}
      />
      {hoveredPoint !== null && (
        <Text size="1" color="gray" style={{ marginTop: '4px', display: 'block' }}>
          Chainage {data[hoveredPoint].start_chainage?.toFixed(2)} - {data[hoveredPoint].end_chainage?.toFixed(2)}: {((data[hoveredPoint].overall_quality_score ?? 0) * 100).toFixed(1)}%
        </Text>
      )}
    </div>
  );
};

interface PathProps {
  showMarkers?: boolean;
  color?: string;
  weight?: number;
  showAllLanes?: boolean;
}

// Component to handle map clicks
const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

// Component to handle map zoom functionality
const MapController = React.forwardRef<any, {}>((props, ref) => {
  const map = useMap();

  React.useImperativeHandle(ref, () => ({
    zoomToSegment: (segment: PathData) => {
      const lat = segment.l1_start_latitude;
      const lng = segment.l1_start_longitude;
      if (lat && lng) {
        map.setView([lat, lng], 16, { animate: true });
      }
    }
  }));

  return null;
});

const Path: React.FC<PathProps> = ({
  showMarkers = false,
  color = '#3388ff',
  weight = 4,
  showAllLanes = false
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [pathData, setPathData] = useState<PathData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<PathData | null>(null);
  const [clickPosition, setClickPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [segmentLoading, setSegmentLoading] = useState(false);
  const [isPathAnalysisExpanded, setIsPathAnalysisExpanded] = useState(() => {
    // Auto-collapse on mobile devices
    return window.innerWidth >= 768;
  });
  const [isLegendExpanded, setIsLegendExpanded] = useState(() => {
    // Auto-collapse legend on mobile devices
    return window.innerWidth >= 768;
  });
  const [videoPosition, setVideoPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [animatedVideoPosition, setAnimatedVideoPosition] = useState<{ lat: number; lng: number } | null>(null);
  const mapControllerRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const zoomLevel = 13; // Fixed zoom level since we're not tracking it

  useEffect(() => {
    const loadRoadData = async () => {
      try {
        setLoading(true);

        // Fetch from FastAPI - directly use server data without processing
        const response = await fetch(API_ENDPOINTS.roads);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Use the raw data directly from the server
        setPathData(result.filter((f: PathData) => f.l1_start_latitude != null));
        setError(null);
      } catch (err) {
        setError('Failed to load road data: ' + (err as Error).message);
        console.error('Error loading road data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRoadData();
  }, []);

  // Handle responsive behavior for mobile devices
  useEffect(() => {
    const handleResize = () => {
      if (isMobile) {
        // Auto-collapse panels on mobile
        if (isPathAnalysisExpanded) {
          setIsPathAnalysisExpanded(false);
        }
        if (isLegendExpanded) {
          setIsLegendExpanded(false);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, isPathAnalysisExpanded, isLegendExpanded]);

  const handleMapClick = async (lat: number, lng: number) => {
    try {
      setSegmentLoading(true);
      setClickPosition({ lat, lng });

      const response = await fetch(API_ENDPOINTS.roadsByLocation(lat, lng));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.segment) {
        setSelectedSegment(result.segment);
      } else {
        setSelectedSegment(null);
        console.log(result.message || 'No road segment found at this location');
      }
    } catch (err) {
      console.error('Error fetching segment data:', err);
      setSelectedSegment(null);
    } finally {
      setSegmentLoading(false);
    }
  };

  const handleChartPointClick = (segment: PathData) => {
    if (mapControllerRef.current) {
      mapControllerRef.current.zoomToSegment(segment);
    }
  };

  const handleVideoPositionUpdate = (position: { lat: number; lng: number } | null) => {
    if (position) {
    setVideoPosition(position);
    }
  };

  // Animate marker movement when video position changes
  useEffect(() => {
    if (!videoPosition) {
      setAnimatedVideoPosition(null);
      return;
    }

    if (!animatedVideoPosition) {
      // First position, no animation needed
      setAnimatedVideoPosition(videoPosition);
      return;
    }

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startPosition = animatedVideoPosition;
    const endPosition = videoPosition;
    const duration = 300; // 300ms animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use easeOutQuad for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 2);

      const currentLat = startPosition.lat + (endPosition.lat - startPosition.lat) * easeProgress;
      const currentLng = startPosition.lng + (endPosition.lng - startPosition.lng) * easeProgress;

      setAnimatedVideoPosition({ lat: currentLat, lng: currentLng });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [videoPosition]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Create custom video position marker icon
  const videoMarkerIcon = new DivIcon({
    html: `
      <div style="
        width: 20px; 
        height: 20px; 
        background: linear-gradient(45deg, #ff4757, #ff6b81);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
        position: relative;
      "></div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    className: 'video-position-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });

  if (loading) {
    return (
      <Card style={{
        position: 'absolute',
        top: '50px',
        left: '10px',
        zIndex: 1000
      }}>
        <Text size="2">Loading path data...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={{
        position: 'absolute',
        top: '50px',
        left: '10px',
        zIndex: 1000,
        borderColor: 'var(--red-9)'
      }} variant="surface">
        <Text size="2" color="red">Error: {error}</Text>
      </Card>
    );
  }


  return (
    <>
      {/* Map click handler */}
      <MapClickHandler onMapClick={handleMapClick} />

      {/* Map controller for zoom functionality */}
      <MapController ref={mapControllerRef} />

      {/* Single continuous path line */}
      {pathData.length > 0 && (
        <Hotline
          data={pathData}
          getLat={({ point }) => point.l1_start_latitude}
          getLng={({ point }) => point.l1_start_longitude}
          getVal={({ point }) => 1 - Math.min(1, (point.overall_quality_score ?? 0))}
          options={{ min: 0, max: 1 }}
        />
      )}

      {/* Video position marker */}
      {animatedVideoPosition && (
        <Marker 
          position={[animatedVideoPosition.lat, animatedVideoPosition.lng]}
          icon={videoMarkerIcon}
        >
          <Popup>
            <div style={{ textAlign: 'center' }}>
              <strong>🎥 Video Position</strong><br />
              Lat: {animatedVideoPosition.lat.toFixed(6)}<br />
              Lng: {animatedVideoPosition.lng.toFixed(6)}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Quality Legend Component */}
      <QualityLegend pathDataLength={pathData.length} isMobile={isMobile} />

      {/* Vehicle Path Analysis Component */}
      <VehiclePathAnalysis 
        pathData={pathData} 
        isMobile={isMobile} 
        handleChartPointClick={handleChartPointClick}
        onVideoPositionUpdate={handleVideoPositionUpdate}
      />

      {/* Chainage Info Component */}
      <ChainageInfo 
        selectedSegment={selectedSegment}
        segmentLoading={segmentLoading}
        isMobile={isMobile}
        clickPosition={clickPosition}
        onClose={() => setSelectedSegment(null)}
      />
    </>
  );
};

export default Path;
