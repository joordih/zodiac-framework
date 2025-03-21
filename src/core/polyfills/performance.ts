const globalObj = typeof global !== 'undefined' ? global : 
                  typeof window !== 'undefined' ? window : 
                  typeof globalThis !== 'undefined' ? globalThis : {};


const performancePolyfill = {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  clearMarks: () => {},
  clearMeasures: () => {},
  getEntries: () => [],
  getEntriesByName: () => [],
  getEntriesByType: () => [],
  toJSON: () => ({})
};

const performance = (globalObj as any).performance || performancePolyfill;
const PerformanceObserver = (globalObj as any).PerformanceObserver || class {};
const PerformanceEntry = (globalObj as any).PerformanceEntry || class {};
const PerformanceMark = (globalObj as any).PerformanceMark || class {};
const PerformanceMeasure = (globalObj as any).PerformanceMeasure || class {};
const PerformanceNavigationTiming = (globalObj as any).PerformanceNavigationTiming || class {};
const PerformanceResourceTiming = (globalObj as any).PerformanceResourceTiming || class {};

export {
  performance,
  PerformanceObserver,
  PerformanceEntry,
  PerformanceMark,
  PerformanceMeasure,
  PerformanceNavigationTiming,
  PerformanceResourceTiming
};

export default {
  performance,
  PerformanceObserver,
  PerformanceEntry,
  PerformanceMark,
  PerformanceMeasure,
  PerformanceNavigationTiming,
  PerformanceResourceTiming
}; 