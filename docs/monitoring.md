# Web3 Creator OS (WCOS) — Observability & Alerting

Guidance for monitoring system health, indexing logs, tracing errors, and configuring alert thresholds.

## Centralized Logging
* **GCP Cloud Logging**: The backend uses NestJS structured logging, writing console logs in JSON format. Cloud Run captures stdout/stderr and aggregates them into Cloud Logging automatically.
* **Sensitive Data Scrubbing**: No user private keys, wallet mnemonic phrases, API secrets, or passwords should be printed to logs.

## Error Tracking
* **Sentry / Google Error Reporting**: Integrates automatically with the NestJS gateway global exception filter (`AllExceptionsFilter`) to capture stack traces on HTTP 500 responses.
* **Frontend Error Boundary**: Standard Next.js error page captures client-side errors and forwards them to Sentry.

## Alerting Thresholds
We configure alarms for:
1. **API Latency**: Trigger warning if `p95` response latency exceeds `1500ms` for 5 consecutive minutes.
2. **Error Rate**: Trigger alert if HTTP `5xx` responses exceed `2%` of total traffic over a 5-minute interval.
3. **Database Capacity**: Warn if CPU usage of Cloud SQL exceeds `80%` or storage capacity falls below `15%`.
4. **Indexer Lag**: Warn if the standalone indexer's last synced block lags behind the chain head by more than `50` blocks.
