const compareValues = (a, b, order) => {
  if (typeof a === 'string' && typeof b === 'string') {
    return order === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
  }

  return order === 'desc' ? (b ?? 0) - (a ?? 0) : (a ?? 0) - (b ?? 0);
};

export const buildCompanyFilters = (searchParams) => ({
  domain: searchParams.get('domain'),
  search: searchParams.get('search')?.trim().toLowerCase() ?? '',
  sortBy: searchParams.get('sortBy') ?? 'power_score',
  order: searchParams.get('order') === 'asc' ? 'asc' : 'desc',
});

export const filterAndSortCompanies = (companies, filters) => {
  const filtered = companies
    .filter((company) => (filters.domain ? company.domain === filters.domain : true))
    .filter((company) =>
      filters.search
        ? company.name.toLowerCase().includes(filters.search) ||
          company.description.toLowerCase().includes(filters.search) ||
          company.tags.some((tag) => tag.toLowerCase().includes(filters.search))
        : true,
    );

  return [...filtered].sort((a, b) => compareValues(a[filters.sortBy], b[filters.sortBy], filters.order));
};
