import axios from 'axios';

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  bbox: string;
  zoom: number;
}

export interface BoundingBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

/**
 * Forward geocoding: Convert address to coordinates using Nominatim API
 * Returns coordinates and bounding box for the given address and zoom level
 */
export async function forwardGeocode(address: string, zoom: number = 16): Promise<GeocodeResult> {
  const url = 'https://nominatim.openstreetmap.org/search';
  
  try {
    const response = await axios.get(url, {
      params: {
        q: address,
        format: 'jsonv2',
        addressdetails: 1,
        limit: 1,
        bounded: 1,
        viewbox: '7.5,45.2,7.8,44.9' // Turin area bounding box
      },
      headers: {
        'User-Agent': 'Participium-Report-App/1.0 (Contact: user@domain.com)'
      },
      timeout: 5000
    });

    if (response.status === 200 && response.data.length > 0) {
      const result = response.data[0];
      const latitude = parseFloat(result.lat);
      const longitude = parseFloat(result.lon);
      
      // Calculate bounding box based on zoom level
      const bbox = calculateBoundingBox(latitude, longitude, zoom);
      
      return {
        address: result.display_name,
        latitude,
        longitude,
        bbox,
        zoom
      };
    } else {
      throw new Error('Address not found');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Geocoding service temporarily unavailable');
      }
      if (error.response?.status === 404) {
        throw new Error('Address not found by geocoding service');
      }
    }
    throw new Error('Geocoding service error');
  }
}

/**
 * Calculate bounding box based on coordinates and zoom level
 * Zoom levels mapping:
 * - 18-19: Street level (~100m radius)
 * - 16-17: Neighborhood level (~500m radius)  
 * - 14-15: District level (~2km radius)
 * - 12-13: City area level (~5km radius)
 */
function calculateBoundingBox(lat: number, lon: number, zoom: number): string {
  // Calculate radius in degrees based on zoom level
  const radiusInMeters = getRadiusFromZoom(zoom);
  
  // Convert meters to degrees (approximate)
  // 1 degree latitude ≈ 111,320 meters
  // 1 degree longitude ≈ 111,320 * cos(latitude) meters
  const latDegPerMeter = 1 / 111320;
  const lonDegPerMeter = 1 / (111320 * Math.cos(lat * Math.PI / 180));
  
  const latRadius = radiusInMeters * latDegPerMeter;
  const lonRadius = radiusInMeters * lonDegPerMeter;
  
  const minLon = lon - lonRadius;
  const minLat = lat - latRadius;
  const maxLon = lon + lonRadius;
  const maxLat = lat + latRadius;
  
  // Return in format "minLon,minLat,maxLon,maxLat"
  return `${minLon.toFixed(6)},${minLat.toFixed(6)},${maxLon.toFixed(6)},${maxLat.toFixed(6)}`;
}

/**
 * Get radius in meters based on zoom level
 */
function getRadiusFromZoom(zoom: number): number {
  switch (true) {
    case zoom >= 18: // Street level
      return 100;
    case zoom >= 16: // Neighborhood level
      return 500;
    case zoom >= 14: // District level
      return 2000;
    case zoom >= 12: // City area level
      return 5000;
    default:
      return 500; // Default to neighborhood level
  }
}

/**
 * Parse bbox string to BoundingBox object
 * Format: "minLon,minLat,maxLon,maxLat"
 */
export function parseBoundingBox(bboxStr: string): BoundingBox {
  const parts = bboxStr.split(',');
  if (parts.length !== 4) {
    throw new Error('Invalid bounding box format. Expected: "minLon,minLat,maxLon,maxLat"');
  }
  
  const [minLon, minLat, maxLon, maxLat] = parts.map(p => {
    const num = parseFloat(p.trim());
    if (isNaN(num)) {
      throw new Error('Invalid bounding box coordinates');
    }
    return num;
  });
  
  // Validate bounds
  if (minLon >= maxLon || minLat >= maxLat) {
    throw new Error('Invalid bounding box: min values must be less than max values');
  }
  
  return { minLon, minLat, maxLon, maxLat };
}

/**
 * Validate zoom level
 */
export function validateZoom(zoom: any): number {
  const zoomNum = parseInt(zoom);
  if (isNaN(zoomNum) || zoomNum < 12 || zoomNum > 19) {
    throw new Error('Zoom level must be between 12 and 19');
  }
  return zoomNum;
}

/**
 * Validate address string
 */
export function validateAddress(address: any): string {
  if (!address || typeof address !== 'string') {
    throw new Error('Address is required');
  }
  
  const trimmed = address.trim();
  if (trimmed.length < 3 || trimmed.length > 200) {
    throw new Error('Address must be between 3 and 200 characters');
  }
  
  return trimmed;
}