import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import { buildDashboardDataFromApi } from '../utils/dashboardDataBuilder';

export const useDashboardData = () => {
  const [state, setState] = useState({
    ...buildDashboardDataFromApi({
      companiesResponse: { data: [], meta: null },
      domainsResponse: { data: [] },
      insightsResponse: { data: null },
      investorModeResponse: { data: null },
    }),
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
          ...buildDashboardDataFromApi({
            companiesResponse,
            domainsResponse,
            insightsResponse,
            investorModeResponse,
          }),
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

  return useMemo(() => ({ ...state }), [state]);
};
