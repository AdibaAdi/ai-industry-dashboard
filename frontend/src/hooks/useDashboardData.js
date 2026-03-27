import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import {
  toComparisonData,
  toDomainChartData,
  toGrowthTrendData,
  toTopCompanies,
} from '../utils/transformers';

export const useDashboardData = () => {
  const [state, setState] = useState({
    companies: [],
    domains: [],
    insights: null,
    investorMode: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [companiesResponse, domainsResponse, insightsResponse, investorModeResponse] = await Promise.all([
          apiClient.getCompanies(),
          apiClient.getDomains(),
          apiClient.getInsights(),
          apiClient.getInvestorMode(),
        ]);

        if (!isMounted) {
          return;
        }

        setState({
          companies: companiesResponse.data,
          domains: domainsResponse.data,
          insights: insightsResponse.data,
          investorMode: investorModeResponse.data,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load intelligence data.',
        }));
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return useMemo(
    () => ({
      ...state,
      domainChartData: toDomainChartData(state.domains),
      topCompanies: toTopCompanies(state.companies),
      companyComparisonData: toComparisonData(state.companies),
      growthTrendData: toGrowthTrendData(state.companies),
      kpis: {
        totalCompanies: state.companies.length,
        topDomain: state.domains[0]?.domain ?? 'N/A',
        topScore: state.companies[0]?.power_score ?? 0,
        topCompany: state.companies[0]?.name ?? 'N/A',
      },
    }),
    [state],
  );
};
