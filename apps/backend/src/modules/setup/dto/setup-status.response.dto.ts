export class SetupStatusResponseDto {
  isConfigured!: boolean;
  message!: string;
  /** Diagnóstico de runtime (FFmpeg para video segmentado en worker). */
  runtime?: {
    ffmpegAvailable: boolean;
    ffmpegPath: string | null;
  };
}
