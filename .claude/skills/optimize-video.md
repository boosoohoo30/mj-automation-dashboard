---
name: optimize-video
description: ffmpeg로 영상을 768x1152, 음소거, 3MB 이하로 최적화합니다
user_invocable: true
---

# 영상 최적화

ffmpeg를 사용하여 영상을 최종 사양으로 변환합니다.

## 목표 사양
- 해상도: 768 x 1152 (가로2:세로3)
- 코덱: H.264 (libx264)
- 오디오: 음소거 (-an)
- 용량: 3MB 이하
- 프로필: High
- 프리셋: slow (품질 우선)

## 실행 방법
```bash
# 2-pass 인코딩으로 정확한 용량 제어
# 6초 영상 기준: 약 3,900 kbps

# Pass 1
ffmpeg -y -i INPUT \
  -vf "scale=768:1152:force_original_aspect_ratio=decrease,pad=768:1152:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -b:v 3900k -preset slow -profile:v high \
  -an -pass 1 -f null /dev/null

# Pass 2
ffmpeg -y -i INPUT \
  -vf "scale=768:1152:force_original_aspect_ratio=decrease,pad=768:1152:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -b:v 3900k -preset slow -profile:v high \
  -an -pass 2 OUTPUT.mp4
```

## 검증
최적화 후 파일 크기가 3MB를 초과하면 비트레이트를 낮춰서 재인코딩합니다.
