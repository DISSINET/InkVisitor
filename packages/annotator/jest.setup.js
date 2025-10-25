// Jest setup file
// Mock DOM APIs that might be needed for testing

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock getContext for canvas
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 100 })),
  font: '',
  fillStyle: '',
  reset: jest.fn(),
}));

// Mock canvas dimensions
Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
  writable: true,
  value: 800
});

Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
  writable: true,
  value: 600
});

// Mock style properties
Object.defineProperty(HTMLCanvasElement.prototype, 'style', {
  writable: true,
  value: {
    width: '800px',
    height: '600px',
    backgroundColor: 'white',
    color: 'black'
  }
});
