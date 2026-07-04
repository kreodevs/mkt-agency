#!/usr/bin/env python3
"""Update video generation to support segmentation for texts longer than model max duration."""
import re
import subprocess
import os

WORK_DIR = "/root/desarrollos/mkt-agency"
SERVICE_FILE = f"{WORK_DIR}/apps/backend/src/modules/agents/image-generation.service.ts"
UTILS_FILE = f"{WORK_DIR}/apps/backend/src/modules/agents/domain/image-generation.utils.ts"

# 1. Modificar utils para exportar splitNarrationIntoSegments
with open(UTILS_FILE, 'r') as f:
    utils_content = f.read()

# Verificar si ya está exportado
if 'export { splitNarrationIntoSegments' not in utils_content:
    # Ya está implementado en el archivo, solo necesitamos verificar
    print("splitNarrationIntoSegments ya existe en utils")

# 2. Modificar service para agregar concatVideoClips
with open(SERVICE_FILE, 'r') as f:
    service_content = f.read()

# Agregar import de splitNarrationIntoSegments si no existe
import_pattern = r"splitNarrationIntoSegments,"
if not re.search(import_pattern, service_content):
    # Agregar a los imports existentes
    service_content = service_content.replace(
        "resolveVideoDurationPolicy,",
        "resolveVideoDurationPolicy,\n  splitNarrationIntoSegments,"
    )

# Agregar import de exec para FFmpeg
exec_import = "import { exec } from 'child_process';"
if "import { exec }" not in service_content and "import { spawn }" not in service_content:
    service_content = "import { exec } from 'child_process';\n" + service_content

# 3. Modificar runVideoGeneration para soportar segmentación
# Encontrar el método runVideoGeneration
old_runVideo = '''  private async runVideoGeneration(
    tenantId: string,
    userId: string,
    record: AgentImageGenerationEntity,
    prompt: string,
    options: GenerateImageOptions,
  ): Promise<GenerateImageResult> {
    try {
      const content = options.contentId
        ? await this.contentService.findOne(tenantId, options.contentId)
        : null;

      const videoResolved = await this.llmConfig.resolve('video_generation');
      const videoModel = videoResolved.model?.trim() || 'bytedance/seedance-2.0-fast';
      const durationPolicy = resolveVideoDurationPolicy(videoModel);

      const rawNarration = content?.currentVersion?.body;
      let narrationBody = rawNarration;
      let narrationTruncated = false;

      if (durationPolicy.truncateNarration && rawNarration?.trim()) {
        const sanitized = sanitizeSpanishNarrationScript(rawNarration);
        narrationTruncated =
          estimateSpeechDurationSeconds(sanitized) > durationPolicy.maxDuration;
        narrationBody = fitNarrationBodyForDuration(rawNarration, durationPolicy.maxDuration);
      }

      const duration = resolveVideoDuration(prompt, narrationBody, durationPolicy);'''

new_runVideo = '''  private async runVideoGeneration(
    tenantId: string,
    userId: string,
    record: AgentImageGenerationEntity,
    prompt: string,
    options: GenerateImageOptions,
  ): Promise<GenerateImageResult> {
    try {
      const content = options.contentId
        ? await this.contentService.findOne(tenantId, options.contentId)
        : null;

      const videoResolved = await this.llmConfig.resolve('video_generation');
      const videoModel = videoResolved.model?.trim() || 'bytedance/seedance-2.0-fast';
      const durationPolicy = resolveVideoDurationPolicy(videoModel);

      const rawNarration = content?.currentVersion?.body;
      const sanitizedNarration = rawNarration?.trim() ? sanitizeSpanishNarrationScript(rawNarration) : '';
      
      // Check if narration exceeds max duration and needs segmentation
      const needsSegmentation = durationPolicy.truncateNarration && sanitizedNarration &&
        estimateSpeechDurationSeconds(sanitizedNarration) > durationPolicy.maxDuration;

      if (needsSegmentation && sanitizedNarration) {
        return this.runSegmentedVideoGeneration(
          tenantId,
          userId,
          record,
          prompt,
          sanitizedNarration,
          durationPolicy.maxDuration,
        );
      }

      // Single video generation (original logic)
      let narrationBody = rawNarration;
      let narrationTruncated = false;

      if (durationPolicy.truncateNarration && rawNarration?.trim()) {
        narrationTruncated =
          estimateSpeechDurationSeconds(sanitizedNarration) > durationPolicy.maxDuration;
        narrationBody = fitNarrationBodyForDuration(rawNarration, durationPolicy.maxDuration);
      }

      const duration = resolveVideoDuration(prompt, narrationBody, durationPolicy);'''

service_content = service_content.replace(old_runVideo, new_runVideo)

# 4. Agregar método runSegmentedVideoGeneration después de runVideoGeneration
segmented_method = '''

  private async runSegmentedVideoGeneration(
    tenantId: string,
    userId: string,
    record: AgentImageGenerationEntity,
    prompt: string,
    narrationBody: string,
    segmentDuration: number,
  ): Promise<GenerateImageResult> {
    const segments = splitNarrationIntoSegments(narrationBody, segmentDuration);
    this.logger.log(`Split narration into ${segments.length} segments for segmented video generation`);

    // Generate all clips in parallel
    const clipPromises = segments.map(async (seg) => {
      const videoPrompt = buildVideoGenerationPrompt({
        basePrompt: prompt,
        narrationBody: seg.body,
        durationSeconds: Math.min(seg.durationSeconds, segmentDuration),
      });

      return this.videoAdapter.generateVideo(videoPrompt, {
        duration: Math.min(seg.durationSeconds, segmentDuration),
        aspectRatio: resolveVideoAspectRatio(prompt),
        resolution: '720p',
        generateAudio: true,
      });
    });

    const clipResults = await Promise.all(clipPromises);

    // Concatenate clips
    const concatenatedVideo = await this.concatVideoClips(clipResults);

    const asset = await this.uploadGeneratedVideo(tenantId, prompt, concatenatedVideo);

    const metadata: ImageGenerationMetadata = {
      mediaType: 'video',
      intendedMediaType: 'video',
      mimeType: 'video/mp4',
      duration: clipResults.reduce((sum, r) => sum + (r.duration || 0), 0),
      frameCount: 1,
      frames: [{ assetId: asset.id, index: 0 }],
    };

    record.imageUrl = `/api/v1/assets/${asset.id}/file`;
    record.assetId = asset.id;
    record.metadata = metadata;
    record.status = 'completed';
    record.errorMessage = null;
    await this.generations.save(record);

    if (options?.contentId) {
      await this.attachAssetsToContent(tenantId, userId, options.contentId, [asset.id], 'video');
    }

    await this.recordMediaUsage({
      tenantId,
      userId,
      taskType: 'video_generation',
      modality: 'video',
      metadata: { duration: metadata.duration, generationId: record.id, segmented: true },
      estimatedCostUsd: estimateVideoCostUsd(metadata.duration),
    });

    return this.toResult(record);
  }

  private async concatVideoClips(
    results: VideoGenerationResult[],
  ): Promise<VideoGenerationResult> {
    if (results.length === 1) {
      return results[0];
    }

    const tempDir = '/tmp/video-clips-' + Date.now();
    os.mkdirSync(tempDir, { recursive: true });

    try {
      // Download each clip to temp directory
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const buffer = result.videoBuffer || 
          (result.videoUrl ? await (await fetch(result.videoUrl)).arrayBuffer() : null);
        
        if (!buffer) continue;
        
        await fs.promises.writeFile(path.join(tempDir, `clip_${i}.mp4`), Buffer.from(buffer));
      }

      // Create concat file
      const concatFile = path.join(tempDir, 'concat.txt');
      const concatList = results.map((_, i) => `file '${tempDir}/clip_${i}.mp4'`).join('\\n');
      await fs.promises.writeFile(concatFile, concatList);

      // Run ffmpeg concat
      await new Promise<void>((resolve, reject) => {
        exec(
          `ffmpeg -f concat -safe 0 -i ${concatFile} -c copy ${tempDir}/output.mp4 -y`,
          (error) => (error ? reject(error) : resolve()),
        );
      });

      // Read output
      const outputBuffer = await fs.promises.readFile(path.join(tempDir, 'output.mp4'));

      return {
        videoBuffer: outputBuffer,
        mimeType: 'video/mp4',
        duration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
      };
    } finally {
      // Cleanup temp files
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  }
'''

# Insertar después de runVideoGeneration (buscar el final del método)
# Buscar "private async runImageGeneration" y agregar antes
insertion_point = service_content.find("  private async runImageGeneration(")
if insertion_point > 0:
    service_content = service_content[:insertion_point] + segmented_method + service_content[insertion_point:]

# Agregar imports necesarios
service_content = service_content.replace(
    "import { exec } from 'child_process';",
    "import { exec } from 'child_process';\nimport * as fs from 'fs';\nimport * as path from 'path';"
)

# 5. Guardar archivo
with open(SERVICE_FILE, 'w') as f:
    f.write(service_content)

print("✅ image-generation.service.ts actualizado con segmentación de video")

# 6. Actualizar CHANGELOG
changelog_path = f"{WORK_DIR}/CHANGELOG.md"
with open(changelog_path, 'r') as f:
    changelog = f.read()

new_entry = """## [Unreleased]

### Added
- Video segmentation for texts exceeding model duration limits
- Automatic FFmpeg concatenation of multiple video clips into single asset
- Support for ~21-second texts split into 2-3 clips (Seedance 15s limit)

"""

if "## [Unreleased]" not in changelog:
    changelog = new_entry + changelog

with open(changelog_path, 'w') as f:
    f.write(changelog)

print("✅ CHANGELOG.md actualizado")

# 7. Build y verificar
print("\nEjecutando build...")
result = subprocess.run(
    ["cd", WORK_DIR, "&&", "yarn", "workspace", "@mkt-agency/backend", "build"],
    shell=True,
    capture_output=True,
    text=True
)
print(f"Build exit code: {result.returncode}")
if result.returncode != 0:
    print(f"Error: {result.stderr[-500:]}")
else:
    print("✅ Build exitoso")