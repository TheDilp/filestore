/* eslint-disable camelcase */

import { object, string, uuidv4 } from "zod";

export const LoginSchema = object({
  id: uuidv4(),
  username: string(),
  firstName: string(),
  lastName: string(),
});

export const LoginSearchParamsSchema = object({
  auth_url: string().optional(),
  code_challenge: string().optional(),
  state: string().optional(),
});
