import 'dotenv/config';
import { createAppServer } from './app.js';

const port = Number(process.env.PORT ?? 4000);
const server = createAppServer();

server.listen(port, () => {
  console.log(`AI Industry Dashboard API running on port ${port}`);
});
