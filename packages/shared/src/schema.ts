import { z } from 'zod';

import { MONTH_COUNT } from './period';

const monthlyValues = z.array(z.number().finite()).length(MONTH_COUNT);

const nodeBase = {
  id: z.string().min(1),
  name: z.string().min(1),
  values: monthlyValues,
};

export const channelSchema = z.object(nodeBase);

export const employeeSchema = z.object({
  ...nodeBase,
  /** Not part of the original brief payload: added by our API, which serves the images itself. */
  avatarUrl: z.string().min(1).optional(),
  channels: z.array(channelSchema).optional(),
});

export const branchSchema = z.object({
  ...nodeBase,
  employees: z.array(employeeSchema).optional(),
});

export const companySchema = z.object({
  ...nodeBase,
  branches: z.array(branchSchema).optional(),
});

export type Channel = z.infer<typeof channelSchema>;
export type Employee = z.infer<typeof employeeSchema>;
export type Branch = z.infer<typeof branchSchema>;
export type Company = z.infer<typeof companySchema>;

export const apiErrorSchema = z.object({
  error: z.object({ message: z.string() }),
});

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
