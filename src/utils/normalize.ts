export const scale = (x: number, min: number, max: number): number => {
  if (x <= min) return 0;
  if (x >= max) return 100;
  return ((x - min) / (max - min)) * 100;
};

export const inverseScale = (x: number, min: number, max: number): number => {
  if (x <= min) return 100;
  if (x >= max) return 0;
  return 100 - ((x - min) / (max - min)) * 100;
};

export const pctChange = (curr: number, prev: number): number | null => {
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
};

export const safeNumber = (n: unknown): number | null => {
  const num = Number(n);
  return isNaN(num) ? null : num;
};

export const calculateMovingAverage = (data: number[], period: number): number[] => {
  const result: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const roundToDecimal = (value: number, decimals: number = 1): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};
