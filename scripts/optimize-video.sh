#!/bin/bash
# 영상 최적화 스크립트
# 사용법: ./optimize-video.sh INPUT OUTPUT
# 목표: 768x1152, 음소거, 3MB 이하, H.264

INPUT="$1"
OUTPUT="$2"

if [ -z "$INPUT" ] || [ -z "$OUTPUT" ]; then
  echo "Usage: $0 <input> <output>"
  exit 1
fi

TARGET_SIZE_KB=3072  # 3MB
DURATION=6
BITRATE=$(( (TARGET_SIZE_KB * 8 * 95 / 100) / DURATION ))

echo "Target bitrate: ${BITRATE}k"
echo "Pass 1..."

ffmpeg -y -i "$INPUT" \
  -vf "scale=768:1152:force_original_aspect_ratio=decrease,pad=768:1152:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -b:v "${BITRATE}k" -preset slow -profile:v high \
  -an -pass 1 -f null /dev/null 2>/dev/null

echo "Pass 2..."

ffmpeg -y -i "$INPUT" \
  -vf "scale=768:1152:force_original_aspect_ratio=decrease,pad=768:1152:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -b:v "${BITRATE}k" -preset slow -profile:v high \
  -an -pass 2 "$OUTPUT" 2>/dev/null

# Cleanup pass logs
rm -f ffmpeg2pass-0.log ffmpeg2pass-0.log.mbtree

# Verify size
SIZE=$(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT" 2>/dev/null)
SIZE_MB=$(echo "scale=2; $SIZE / 1048576" | bc)
echo "Output: $OUTPUT ($SIZE_MB MB)"

if [ "$SIZE" -gt 3145728 ]; then
  echo "WARNING: File exceeds 3MB limit!"
  exit 1
fi

echo "Done!"
