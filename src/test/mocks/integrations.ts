import { vi } from "vitest";

export const mockGemini = {
  generate: vi.fn().mockResolvedValue({ text: "diagnosis" }),
};

export const mockMcp = {
  cloudRun: {
    listServices: vi.fn().mockResolvedValue({ source: "cloud_run", ready: true }),
    getService: vi.fn().mockResolvedValue({ source: "cloud_run", ready: true }),
  },
  logging: {
    query: vi.fn().mockResolvedValue([]),
  },
};

export const mockAuth = {
  getClient: vi.fn().mockResolvedValue({
    getRequestHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer fake" }),
  }),
};
