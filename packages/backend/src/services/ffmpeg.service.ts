import { spawn } from 'child_process';
import { statSync } from 'fs';
import { broadcast } from '../websocket/handler.js';

export interface OptimizeOptions {
  inputPath: string;
  outputPath: string;
  width?: number;
  height?: number;
  maxSizeMB?: number;
  mute?: boolean;
}

// Optimize video: 768x1152, muted, under 3MB, H.264
export function optimizeVideo(options: OptimizeOptions): Promise<{ outputPath: string; fileSizeBytes: number }> {
  const {
    inputPath,
    outputPath,
    width = 768,
    height = 1152,
    maxSizeMB = 3,
    mute = true,
  } = options;

  // Calculate target bitrate for 6-second video under maxSizeMB
  const duration = 6;
  const targetBits = maxSizeMB * 1024 * 1024 * 8;
  const bitrateKbps = Math.floor((targetBits * 0.95) / duration / 1000);

  return new Promise((resolve, reject) => {
    // Pass 1
    const pass1Args = [
      '-y', '-i', inputPath,
      '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
      '-c:v', 'libx264',
      '-b:v', `${bitrateKbps}k`,
      '-preset', 'slow',
      '-profile:v', 'high',
      ...(mute ? ['-an'] : []),
      '-pass', '1',
      '-f', 'null',
      '/dev/null',
    ];

    broadcast('video:optimizing', { phase: 'pass1', inputPath });

    const p1 = spawn('ffmpeg', pass1Args);

    p1.stderr.on('data', (data: Buffer) => {
      const line = data.toString();
      const timeMatch = line.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
      if (timeMatch) {
        broadcast('video:optimize-progress', { phase: 'pass1', time: timeMatch[1] });
      }
    });

    p1.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg pass 1 failed with code ${code}`));
        return;
      }

      // Pass 2
      const pass2Args = [
        '-y', '-i', inputPath,
        '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
        '-c:v', 'libx264',
        '-b:v', `${bitrateKbps}k`,
        '-preset', 'slow',
        '-profile:v', 'high',
        ...(mute ? ['-an'] : []),
        '-pass', '2',
        outputPath,
      ];

      broadcast('video:optimizing', { phase: 'pass2', inputPath });

      const p2 = spawn('ffmpeg', pass2Args);

      p2.stderr.on('data', (data: Buffer) => {
        const line = data.toString();
        const timeMatch = line.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
        if (timeMatch) {
          broadcast('video:optimize-progress', { phase: 'pass2', time: timeMatch[1] });
        }
      });

      p2.on('close', (code2) => {
        // Clean up pass log files
        try {
          const fs = require('fs');
          fs.unlinkSync('ffmpeg2pass-0.log');
          fs.unlinkSync('ffmpeg2pass-0.log.mbtree');
        } catch {}

        if (code2 !== 0) {
          reject(new Error(`ffmpeg pass 2 failed with code ${code2}`));
          return;
        }

        const stat = statSync(outputPath);
        broadcast('video:optimized', { outputPath, fileSizeBytes: stat.size });
        resolve({ outputPath, fileSizeBytes: stat.size });
      });
    });
  });
}

// Batch optimize all videos
export async function optimizeAllVideos(
  videos: Array<{ id: string; inputPath: string; outputPath: string }>
): Promise<Array<{ id: string; outputPath: string; fileSizeBytes: number }>> {
  const results = [];
  // Process sequentially to avoid CPU overload
  for (const video of videos) {
    const result = await optimizeVideo({
      inputPath: video.inputPath,
      outputPath: video.outputPath,
    });
    results.push({ id: video.id, ...result });
  }
  return results;
}
