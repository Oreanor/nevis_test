import { createApp } from './app';
import { createDependencies } from './composition';
import { readConfig } from './config';

const config = readConfig();

const server = createApp(createDependencies(config)).listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

function shutdown(signal: NodeJS.Signals) {
  console.log(`${signal} received, closing server`);
  server.close((error) => {
    if (error) console.error(error);
    process.exit(error ? 1 : 0);
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
