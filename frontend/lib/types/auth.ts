export type AccResponse = {
  message?: string;
  data?: { user: Record<string, unknown>; token: string };
  error?: string;
};
