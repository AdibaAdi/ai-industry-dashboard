import 'dotenv/config';
import { createAppServer } from './app.js';

const classificationDebugEnabled = ['1', 'true', 'yes', 'on'].includes(String(process.env.CLASSIFICATION_DEBUG ?? '').toLowerCase());
const huggingFaceModel = process.env.HUGGINGFACE_MODEL ?? process.env.HUGGING_FACE_CLASSIFICATION_MODEL ?? 'facebook/bart-large-mnli';

const parsedPort = Number.parseInt(process.env.PORT ?? '4000', 10);
const port = Number.isNaN(parsedPort) ? 4000 : parsedPort;
const server = createAppServer();

server.listen(port, () => {
  if (classificationDebugEnabled) {
    console.log(
      '[classification] Server env check:',
      `HUGGINGFACE_API_KEY loaded=${Boolean(process.env.HUGGINGFACE_API_KEY)}`,
      `HUGGINGFACE_MODEL=${huggingFaceModel}`,
    );
  }
  console.log(`AI Industry Dashboard API running on port ${port}`);
});
