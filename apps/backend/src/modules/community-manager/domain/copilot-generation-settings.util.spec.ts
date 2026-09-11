import {
  CM_AUTO_WEEKLY_GENERATION_KEY,
  isAutoWeeklyGenerationEnabled,
} from './copilot-generation-settings.util';

describe('copilot-generation-settings.util', () => {
  it('returns false when setting is missing', () => {
    expect(isAutoWeeklyGenerationEnabled({})).toBe(false);
    expect(isAutoWeeklyGenerationEnabled(null)).toBe(false);
  });

  it('returns false when communityManager block is absent', () => {
    expect(isAutoWeeklyGenerationEnabled({ other: true })).toBe(false);
  });

  it('returns false when autoWeeklyGenerationEnabled is false', () => {
    expect(
      isAutoWeeklyGenerationEnabled({
        communityManager: { [CM_AUTO_WEEKLY_GENERATION_KEY]: false },
      }),
    ).toBe(false);
  });

  it('returns true only when autoWeeklyGenerationEnabled is explicitly true', () => {
    expect(
      isAutoWeeklyGenerationEnabled({
        communityManager: { [CM_AUTO_WEEKLY_GENERATION_KEY]: true },
      }),
    ).toBe(true);
  });
});
