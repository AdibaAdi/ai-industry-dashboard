export const getHealthHandler = () => ({
  statusCode: 200,
  payload: { status: 'ok', service: 'ai-industry-dashboard-api' },
});
