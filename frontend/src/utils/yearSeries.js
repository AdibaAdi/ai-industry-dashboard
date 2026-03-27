export const buildYearSeries = (startYear, endYear) => {
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear) || startYear > endYear) {
    return [];
  }

  return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
};
