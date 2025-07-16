// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API endpoints
export const API_ENDPOINTS = {
  roads: `${API_BASE_URL}/roads`,
  roadsByLocation: (lat: number, lng: number, radius = 200) => 
    `${API_BASE_URL}/roads/by-location?lat=${lat}&lng=${lng}&radius=${radius}`,
  path: `${API_BASE_URL}/path`,
  videos: `${API_BASE_URL}/videos`,
  videoFile: (videoId: string) => `${API_BASE_URL}/videos/${videoId}/file`,
  videoById: (videoId: string) => `${API_BASE_URL}/videos/${videoId}`,
};
