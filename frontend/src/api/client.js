const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

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

export const apiClient = {
  async getCompanies() {
    const response = await fetch(`${API_BASE_URL}/companies`);
    return parseJson(response);
  },

  async getDomains() {
    const response = await fetch(`${API_BASE_URL}/domains`);
    return parseJson(response);
  },

  async getInsights() {
    const response = await fetch(`${API_BASE_URL}/insights`);
    return parseJson(response);
  },

  async searchCompanies(query) {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    return parseJson(response);
  },

  async getCompanyInsight(companyId) {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/insight`);
    return parseJson(response);
  },
};
