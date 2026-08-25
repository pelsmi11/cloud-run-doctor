export const fixtures = {
  cloudRunReady: {
    source: "cloud_run" as const,
    service: "pawpass",
    region: "us-central1",
    ready: true,
    status: "Ready",
    observedAt: "2026-08-24T10:00:00Z",
  },
  reptileLog: {
    source: "logging" as const,
    requestId: "123e4567-e89b-12d3-a456-426614174000",
    event: "PET_REGISTRATION_FAILED",
    httpStatus: 500,
    errorType: "ForeignKeyViolation",
    databaseCode: "23503",
    observedAt: "2026-08-24T10:00:00Z",
  },
  outageLog: {
    source: "logging" as const,
    requestId: "123e4567-e89b-12d3-a456-426614174001",
    httpStatus: 503,
    errorType: "DatabaseUnavailableError",
    observedAt: "2026-08-24T10:00:00Z",
  },
};
