import '@testing-library/jest-dom';
import { vi } from 'vitest';

// --- BROWSER GLOBALS ---

// Mock ResizeObserver for Recharts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo
global.scrollTo = vi.fn();

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock getComputedStyle
const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);

// Mock Canvas
HTMLCanvasElement.prototype.getContext = vi.fn();

// --- GOOGLE MAPS DEEP MOCK ---

const google = {
  maps: {
    Map: vi.fn().mockImplementation(() => ({
      setTilt: vi.fn(),
      mapTypeId: 'roadmap',
      controls: {
        forEach: vi.fn(),
      },
      setOptions: vi.fn(),
      panTo: vi.fn(),
      setZoom: vi.fn(),
      addListener: vi.fn(),
    })),
    Marker: vi.fn().mockImplementation(() => ({
      setMap: vi.fn(),
      setPosition: vi.fn(),
    })),
    LatLng: vi.fn().mockImplementation((lat, lng) => ({ lat, lng })),
    LatLngBounds: vi.fn().mockImplementation(() => ({
      extend: vi.fn(),
      getCenter: vi.fn(),
    })),
    InfoWindow: vi.fn().mockImplementation(() => ({
      open: vi.fn(),
      close: vi.fn(),
      setContent: vi.fn(),
    })),
    visualization: {
      HeatmapLayer: vi.fn().mockImplementation(() => ({
        setMap: vi.fn(),
        setData: vi.fn(),
        setOptions: vi.fn(),
      })),
    },
    event: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      trigger: vi.fn(),
    },
    ControlPosition: {
      TOP_LEFT: 1,
      LEFT_TOP: 5,
    },
    MapTypeId: {
      ROADMAP: 'roadmap',
      SATELLITE: 'satellite',
    }
  }
};

// Mock API Client
vi.mock('../api/client', () => ({
  default: {
    get: vi.fn().mockImplementation((url) => {
      if (url.includes('/api/events')) return Promise.resolve({ data: [] });
      if (url.includes('/api/tickets')) return Promise.resolve({ data: [] });
      if (url.includes('/api/orders/menu')) return Promise.resolve({ data: [] });
      if (url.includes('/api/orders/my')) return Promise.resolve({ data: [] });
      if (url.includes('/api/analytics/kpis')) return Promise.resolve({ data: { 
        avg_queue_time: 0, queue_time_delta: 0, throughput_per_minute: 0, 
        throughput_delta: 0, nps_score: 0, nps_delta: 0, orders_fulfilled: 0 
      }});
      if (url.includes('/api/analytics/density-trend')) return Promise.resolve({ data: [] });
      if (url.includes('/api/analytics/history')) return Promise.resolve({ data: [] });
      if (url.includes('/api/analytics/zone-performance')) return Promise.resolve({ data: [] });
      if (url.includes('/api/analytics/incidents')) return Promise.resolve({ data: [] });
      if (url.includes('/api/media')) return Promise.resolve({ data: [] });
      if (url.includes('/narrative')) return Promise.resolve({ data: { narrative: 'AI Event Insight generated.' } });
      return Promise.resolve({ data: [] });
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  }
}));

global.google = google;

// Mock @googlemaps/js-api-loader
vi.mock('@googlemaps/js-api-loader', () => ({
  Loader: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue(google.maps),
  })),
}));
