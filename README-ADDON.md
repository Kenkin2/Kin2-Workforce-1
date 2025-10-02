# Architecture Overview (Addon)

```mermaid
flowchart LR
  subgraph Client[Client (Web/Mobile)]
    UI[React UI]
  end

  subgraph API[API Server (Node/Express)]
    Auth[Auth & Sessions]
    Jobs[Jobs/Shifts/Timesheets]
    Pay[Payments (Stripe)]
    Reports[Reports/Exports]
    Metrics[/Prometheus Metrics/]
  end

  subgraph DB[(PostgreSQL)]
  end

  Client <--> API
  API --> DB
  API --> Metrics
  Pay -->|Webhooks| API
```

## Endpoints
- Health: `GET /healthz`, `GET /readyz`
- Metrics: `GET /metrics` (Prometheus format)

## Env Validation
See `src/config/env.ts` (Zod). App fails fast on invalid/missing envs.

## Tests
Run `vitest` with coverage. Example integration test in `tests/health.test.ts`.
