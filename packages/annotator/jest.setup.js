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
  clearRect: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
  font: '',
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
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
