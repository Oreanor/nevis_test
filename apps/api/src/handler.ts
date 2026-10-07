import { createApp } from './app';
import { createDependencies } from './composition';
import { readConfig } from './config';

/** The app as a request handler for serverless platforms (e.g. Vercel): same wiring as the server, no `listen`. */
export default createApp(createDependencies(readConfig()));
