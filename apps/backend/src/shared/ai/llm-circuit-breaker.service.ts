import { Injectable, ServiceUnavailableException } from '@nestjs/common';

/** MDD: 5 consecutive failures → circuit open for 60s. */
const FAILURE_THRESHOLD = 5;
const OPEN_DURATION_MS = 60_000;

type CircuitState = 'closed' | 'open' | 'half_open';

interface CircuitRecord {
  state: CircuitState;
  failureCount: number;
  openedAt: number | null;
  halfOpenProbeInFlight: boolean;
}

@Injectable()
export class LlmCircuitBreakerService {
  private readonly circuits = new Map<string, CircuitRecord>();

  assertAllow(providerId: string, taskType: string): void {
    const circuit = this.getOrCreate(providerId);
    this.refreshOpenState(circuit);

    if (circuit.state === 'closed') {
      return;
    }

    if (circuit.state === 'open') {
      throw new ServiceUnavailableException({
        error: 'LLM provider circuit is open due to repeated failures',
        code: 'LLM_CIRCUIT_OPEN',
        providerId,
        taskType,
        retryAfterSeconds: this.retryAfterSeconds(circuit),
      });
    }

    if (circuit.halfOpenProbeInFlight) {
      throw new ServiceUnavailableException({
        error: 'LLM provider circuit is probing recovery',
        code: 'LLM_CIRCUIT_HALF_OPEN',
        providerId,
        taskType,
        retryAfterSeconds: 5,
      });
    }

    circuit.halfOpenProbeInFlight = true;
  }

  recordSuccess(providerId: string): void {
    const circuit = this.getOrCreate(providerId);
    circuit.state = 'closed';
    circuit.failureCount = 0;
    circuit.openedAt = null;
    circuit.halfOpenProbeInFlight = false;
  }

  /** Returns true when the failure should increment the breaker counter. */
  shouldCountFailure(error: Error): boolean {
    const match = error.message.match(/^LLM request failed \((\d+)\):/);
    if (!match) {
      return true;
    }

    const status = Number(match[1]);
    if (status === 429 || status >= 500) {
      return true;
    }

    return false;
  }

  recordFailure(providerId: string, error: Error): void {
    if (!this.shouldCountFailure(error)) {
      return;
    }

    const circuit = this.getOrCreate(providerId);
    this.refreshOpenState(circuit);

    if (circuit.state === 'half_open') {
      circuit.state = 'open';
      circuit.openedAt = Date.now();
      circuit.failureCount = FAILURE_THRESHOLD;
      circuit.halfOpenProbeInFlight = false;
      return;
    }

    circuit.failureCount += 1;
    if (circuit.failureCount >= FAILURE_THRESHOLD) {
      circuit.state = 'open';
      circuit.openedAt = Date.now();
    }
  }

  reset(providerId: string): void {
    this.circuits.delete(providerId);
  }

  private getOrCreate(providerId: string): CircuitRecord {
    let circuit = this.circuits.get(providerId);
    if (!circuit) {
      circuit = {
        state: 'closed',
        failureCount: 0,
        openedAt: null,
        halfOpenProbeInFlight: false,
      };
      this.circuits.set(providerId, circuit);
    }
    return circuit;
  }

  private refreshOpenState(circuit: CircuitRecord): void {
    if (circuit.state !== 'open' || circuit.openedAt === null) {
      return;
    }

    if (Date.now() - circuit.openedAt >= OPEN_DURATION_MS) {
      circuit.state = 'half_open';
      circuit.halfOpenProbeInFlight = false;
    }
  }

  private retryAfterSeconds(circuit: CircuitRecord): number {
    if (circuit.openedAt === null) {
      return Math.ceil(OPEN_DURATION_MS / 1000);
    }
    const remaining = OPEN_DURATION_MS - (Date.now() - circuit.openedAt);
    return Math.max(1, Math.ceil(remaining / 1000));
  }
}
