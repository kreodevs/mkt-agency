import { splitTextIntoChunks } from './text-chunk.util';

describe('splitTextIntoChunks', () => {
  it('splits long markdown into bounded chunks', () => {
    const paragraph = 'A'.repeat(500);
    const text = `${paragraph}\n\n${paragraph}\n\n${paragraph}`;
    const chunks = splitTextIntoChunks(text, 900);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 900)).toBe(true);
  });
});
