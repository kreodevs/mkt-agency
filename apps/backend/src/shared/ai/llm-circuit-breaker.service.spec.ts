import { ServiceUnavailableException } from '@nestjs/common';
import { LlmCircuitBreakerService } from './llm-circuit-breaker.service';

describe('LlmCircuitBreakerService', () => {
  let breaker: LlmCircuitBreakerService;

  beforeEach(() => {
    breaker = new LlmCircuitBreakerService();
  });

  it('opens after five counted failures', () => {
    const error = new Error('LLM request failed (503): unavailable');

    for (let i = 0; i < 4; i += 1) {
      breaker.recordFailure('provider-1', error);
      expect(() => breaker.assertAllow('provider-1', 'brand_interview')).not.toThrow();
    }

    breaker.recordFailure('provider-1', error);

    expect(() => breaker.assertAllow('provider-1', 'brand_interview')).toThrow(
      ServiceUnavailableException,
    );
  });

  it('does not count 400 client errors toward the breaker', () => {
    const clientError = new Error('LLM request failed (400): bad request');

    for (let i = 0; i < 10; i += 1) {
      breaker.recordFailure('provider-1', clientError);
    }

    expect(() => breaker.assertAllow('provider-1', 'brand_interview')).not.toThrow();
  });

  it('allows a probe after open window and closes on success', () => {
    const error = new Error('LLM request failed (502): bad gateway');

    for (let i = 0; i < 5; i += 1) {
      breaker.recordFailure('provider-1', error);
    }

    const internal = breaker as unknown as {
      circuits: Map<
        string,
        { state: string; openedAt: number | null; halfOpenProbeInFlight: boolean }
      >;
    };
    const record = internal.circuits.get('provider-1');
    expect(record?.state).toBe('open');
    if (record) {
      record.openedAt = Date.now() - 61_000;
    }

    breaker.assertAllow('provider-1', 'brand_interview');
    breaker.recordSuccess('provider-1');

    expect(() => breaker.assertAllow('provider-1', 'brand_interview')).not.toThrow();
  });
});
