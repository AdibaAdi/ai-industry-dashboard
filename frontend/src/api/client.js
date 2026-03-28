const DEFAULT_DEV_API_BASE_URL = 'http://localhost:4000';

const normalizeBaseUrl = (value) => value.replace(/\/$/, '');

const resolveApiBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return normalizeBaseUrl(configuredBaseUrl);
  }

  if (import.meta.env.DEV) {
    return DEFAULT_DEV_API_BASE_URL;
  }

  return '';
};

const API_BASE_URL = resolveApiBaseUrl();

const buildApiUrl = (path, queryParams) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  if (queryParams) {
    const params = new URLSearchParams(queryParams);
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  return url;
};

const parseJson = async (response) => {
  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) {
        message = body.error;
      }
    } catch (_error) {
      // ignore JSON parse errors and keep status-based message
    }
    throw new Error(message);
  }

  return response.json();
};

const requestJson = async (path, queryParams) => {
  const response = await fetch(buildApiUrl(path, queryParams));
  return parseJson(response);
};

export const apiClient = {
  async getCompanies() {
    return requestJson('/companies');
  },

  async getCompanyById(companyId) {
    const payload = await requestJson(`/companies/${companyId}`);
    return payload.data;
  },

  async getDomains() {
    return requestJson('/domains');
  },

  async getInsights() {
    return requestJson('/insights');
  },

  async getInvestorMode() {
    return requestJson('/investor-mode');
  },

  async searchCompanies(query) {
    return requestJson('/search', { q: query });
  },

  async getCompanyInsight(companyId) {
    const payload = await requestJson(`/companies/${companyId}/insight`);
    return payload.data;
  },
};
