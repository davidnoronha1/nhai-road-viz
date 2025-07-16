
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { latLng, LatLng } from 'leaflet';
import { Card, Text, Flex } from '@radix-ui/themes';

// Component to handle mouse events and display coordinates
const LocationDisplay = ({ setCoordinates }: { setCoordinates: (coords: { lat: number; lng: number } | null) => void }) => {
  useMapEvents({
    mousemove(e) {
      setCoordinates({
        lat: parseFloat(e.latlng.lat.toFixed(6)),
        lng: parseFloat(e.latlng.lng.toFixed(6))
      });
    },
    mouseout() {
      setCoordinates(null);
    }
  });
  return null;
};

const Map: React.FC<{ children?: React.ReactNode, position?: number[], showCoordinates?: boolean, height?: string, markerPosition?: { lat: number; lng: number } | null }> = ({ children, position = [28.6139, 77.2090], showCoordinates = true, height = '100vh', markerPosition }) => {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>({ lat: position[0], lng: position[1] });

  if (!position || position.length !== 2) {
    throw new Error('Position must be an array with two numbers [latitude, longitude]');
  }

  return (
    <div style={{ position: 'relative', height: height, width: '100%' }}>
      <MapContainer center={latLng(position[0], position[1])} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationDisplay setCoordinates={setCoordinates} />
        {markerPosition && (
          <Marker position={latLng(markerPosition.lat, markerPosition.lng)} />
        )}
        {children}
      </MapContainer>
      
      {/* Coordinates display */}
      {coordinates && showCoordinates && (
        <Card style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          zIndex: 1000,
          minWidth: '180px',
        }}>
          <Flex direction="column" gap="1">
            <Text size="2">
              <strong>Latitude:</strong> {coordinates.lat}
            </Text>
            <Text size="2">
              <strong>Longitude:</strong> {coordinates.lng}
            </Text>
          </Flex>
        </Card>
      )}
    </div>
  );
};

export default Map;
