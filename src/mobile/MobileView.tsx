import { useState, useEffect } from 'react'
import Map from '../Map'
import { Box, Button, ScrollArea, Tabs } from '@radix-ui/themes'
import './MobileView.css'
import { PathData, FrameData } from '../components/types'
import { Hotline } from 'react-leaflet-hotline'
import { VehiclePathAnalysis, ChainageInfo, VideoPlayer, LaneAnalysisTable } from '../components'
import { useMapEvents, useMap } from 'react-leaflet'
import { Marker } from 'react-leaflet'
import { API_ENDPOINTS } from '../config'

// Component to handle map clicks
const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
};

// Component to fit map bounds to path data
const MapBoundsFitter = ({ pathData }: { pathData: PathData[] }) => {
    const map = useMap();

    useEffect(() => {
        if (pathData.length > 0) {
            // Calculate bounds from path data
            const bounds = pathData.reduce((acc, segment) => {
                const lat = segment.l1_start_latitude;
                const lng = segment.l1_start_longitude;
                
                if (lat != null && lng != null) {
                    if (!acc.minLat || lat < acc.minLat) acc.minLat = lat;
                    if (!acc.maxLat || lat > acc.maxLat) acc.maxLat = lat;
                    if (!acc.minLng || lng < acc.minLng) acc.minLng = lng;
                    if (!acc.maxLng || lng > acc.maxLng) acc.maxLng = lng;
                }
                
                return acc;
            }, {} as { minLat?: number; maxLat?: number; minLng?: number; maxLng?: number });

            if (bounds.minLat && bounds.maxLat && bounds.minLng && bounds.maxLng) {
                map.fitBounds([
                    [bounds.minLat, bounds.minLng],
                    [bounds.maxLat, bounds.maxLng]
                ], { padding: [20, 20] });
            }
        }
    }, [pathData, map]);

    return null;
};

export default function MobileView() {
    const [isExpanded, setIsExpanded] = useState(false)
    const [pathData, setPathData] = useState<PathData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSegment, setSelectedSegment] = useState<PathData | null>(null);
    const [segmentLoading, setSegmentLoading] = useState(false);
    const [clickPosition, setClickPosition] = useState<{ lat: number; lng: number } | null>(null);
    
    // Video-related state
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [videoCoordinates, setVideoCoordinates] = useState<FrameData[]>([]);
    const [videoPosition, setVideoPosition] = useState<{ lat: number; lng: number } | null>(null);
    
    // Tab state
    const [activeTab, setActiveTab] = useState("road");
    
    // PWA install prompt state
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallButton, setShowInstallButton] = useState(false);
    
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
            setShowInstallButton(true);
        };

        const handleAppInstalled = () => {
            // Hide the install button after app is installed
            setShowInstallButton(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);
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

    const handleVideoSelect = (videoUrl: string | null, coordinates: FrameData[] = []) => {
        setSelectedVideo(videoUrl);
        setVideoCoordinates(coordinates);
        // Switch to video tab when a video is selected
        if (videoUrl) {
            setActiveTab("video");
        }
    };

    const closeVideoPlayer = () => {
        setSelectedVideo(null);
        setVideoCoordinates([]);
        setVideoPosition(null);
    };

    const handleVideoPositionUpdate = (position: { lat: number; lng: number } | null) => {
        if (position) 
            setVideoPosition(position);
    };

    const toggleExpansion = () => {
        setIsExpanded(!isExpanded)
    }

    return (
        <div style={{ height: '100vh', position: 'relative' }}>
            <div
                className={`map-container ${isExpanded ? 'expanded' : 'collapsed'}`}
                style={{
                    height: isExpanded ? '100vh' : '60vh',
                    transition: 'height 0.3s ease-in-out',
                    position: 'relative'
                }}
            >
                <Map showCoordinates={false} height='100%'>
                    <Hotline
                        data={pathData}
                        getLat={(d) => d.point.l1_start_latitude}
                        getLng={(d) => d.point.l1_start_longitude}
                        getVal={({ point }) => 1 - Math.min(1, (point.overall_quality_score ?? 0))}
                        options={{ min: 0, max: 1 }}
                    ></Hotline>

                    <MapClickHandler onMapClick={handleMapClick} />
                    <MapBoundsFitter pathData={pathData} />
                    
                    {/* Video position marker */}
                    {videoPosition && (
                        <Marker position={[videoPosition.lat, videoPosition.lng]} />
                    )}
                </Map>

                <Button style={{ zIndex: 800, position: 'absolute', bottom: '10px', left: '10px' }} onClick={toggleExpansion}>
                    {!isExpanded ?
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg> :
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.13523 8.84197C3.3241 9.04343 3.64052 9.05363 3.84197 8.86477L7.5 5.43536L11.158 8.86477C11.3595 9.05363 11.6759 9.04343 11.8648 8.84197C12.0536 8.64051 12.0434 8.32409 11.842 8.13523L7.84197 4.38523C7.64964 4.20492 7.35036 4.20492 7.15803 4.38523L3.15803 8.13523C2.95657 8.32409 2.94637 8.64051 3.13523 8.84197Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    }
                </Button>
            </div>

            {!isExpanded && (
                <div className="bottom-content">
                    {/* Add any content you want below the map when collapsed */}
                    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                        <Tabs.List justify={'center'}>
                            <Tabs.Trigger value='road'>Road</Tabs.Trigger>
                            <Tabs.Trigger value='segment'>Segment</Tabs.Trigger>
                            <Tabs.Trigger value='video'>Video</Tabs.Trigger>
                            <Tabs.Trigger value='about'>About</Tabs.Trigger>
                        </Tabs.List>
                        <Tabs.Content value='road'>
                            <ScrollArea type="always" scrollbars="vertical" style={{ maxHeight: '40vh'}}>
                                <VehiclePathAnalysis 
                                    pathData={pathData}
                                    isMobile={true}
                                    handleChartPointClick={setSelectedSegment}
                                    onVideoSelect={handleVideoSelect}
                                />
                            </ScrollArea>
                        </Tabs.Content>
                        <Tabs.Content value='segment'>
                            <ScrollArea type="always" scrollbars="both" style={{ maxHeight: '40vh'}}>
                                <ChainageInfo 
                                    selectedSegment={selectedSegment}
                                    segmentLoading={segmentLoading}
                                    isMobile={true}
                                    clickPosition={clickPosition}
                                    onClose={() => setSelectedSegment(null)}
                                />
                            </ScrollArea>
                        </Tabs.Content>
                        <Tabs.Content value='video'>
                            <ScrollArea type="always" scrollbars="vertical" style={{ maxHeight: '40vh'}}>
                                {selectedVideo ? (
                                    <VideoPlayer
                                        videoUrl={selectedVideo}
                                        videoCoordinates={videoCoordinates}
                                        isMobile={true}
                                        onClose={closeVideoPlayer}
                                        onVideoPositionUpdate={handleVideoPositionUpdate}
                                        isInTab={true}
                                    />
                                ) : (
                                    <Box p="4" style={{ textAlign: 'center', color: '#666' }}>
                                        Select a video from the Road tab to view it here
                                    </Box>
                                )}
                            </ScrollArea>
                        </Tabs.Content>
                        <Tabs.Content value='about'>
                            <ScrollArea type="always" scrollbars="vertical" style={{ maxHeight: '40vh'}}>
                                <Box p="4">
                                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>
                                            NHAI Road Quality Monitor
                                        </h2>
                                        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                                            Real-time road quality assessment and monitoring system
                                        </p>
                                    </div>
                                    
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                                            Features
                                        </h3>
                                        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px', lineHeight: '1.5' }}>
                                            <li>Interactive road quality mapping</li>
                                            <li>Lane-wise detailed analysis</li>
                                            <li>Video-synchronized position tracking</li>
                                            <li>Quality score visualization with color coding</li>
                                            <li>Mobile-optimized interface</li>
                                        </ul>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                                            Install App
                                        </h3>
                                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
                                            Install this app on your device for a better experience
                                        </p>
                                        {showInstallButton ? (
                                            <Button 
                                                size="3" 
                                                style={{ 
                                                    width: '100%', 
                                                    backgroundColor: '#007AFF', 
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={async () => {
                                                    if (deferredPrompt) {
                                                        deferredPrompt.prompt();
                                                        const choiceResult = await deferredPrompt.userChoice;
                                                        if (choiceResult.outcome === 'accepted') {
                                                            console.log('PWA installed successfully');
                                                            setShowInstallButton(false);
                                                        }
                                                        setDeferredPrompt(null);
                                                    }
                                                }}
                                            >
                                                📱 Install App
                                            </Button>
                                        ) : (
                                            <div style={{ 
                                                padding: '12px', 
                                                backgroundColor: '#f0f0f0', 
                                                borderRadius: '8px', 
                                                textAlign: 'center',
                                                fontSize: '14px',
                                                color: '#666'
                                            }}>
                                                {(navigator as any).standalone ? 
                                                    '✅ App already installed!' : 
                                                    'App can be installed from browser menu or is already installed'
                                                }
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ borderTop: '1px solid #eee', paddingTop: '16px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
                                        <p style={{ margin: '0' }}>
                                            Built for NHAI Hackathon 2025 - By David Noronha
                                        </p>
                                        <p style={{ margin: '4px 0 0 0' }}>
                                            Version 1.0.0
                                        </p>
                                    </div>
                                </Box>
                            </ScrollArea>
                        </Tabs.Content>
                    </Tabs.Root>
                </div>
            )}
        </div>
    )
}