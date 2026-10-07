import { z } from 'zod';

/**
 * `brief` – the payload from the brief, served verbatim (main page).
 * `extended` – the brief extended with advisers and client types everywhere, internally consistent (explorer).
 */
export const datasetSchema = z.enum(['brief', 'extended']);

export type Dataset = z.infer<typeof datasetSchema>;

export const DEFAULT_DATASET: Dataset = 'brief';
