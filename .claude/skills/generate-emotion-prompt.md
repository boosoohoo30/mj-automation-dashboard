---
name: generate-emotion-prompt
description: 기본 이미지를 기반으로 6감정 Grok 영상 프롬프트를 생성합니다
user_invocable: true
---

# 6감정 영상 프롬프트 생성

승인된 기본 이미지(natural)를 기반으로 Grok 영상 생성을 위한 6개 감정별 프롬프트를 생성합니다.

## 6감정 목록
1. **natural** - 기본 표정. 미세한 호흡과 눈 깜빡임만 있는 자연스러운 상태
2. **happy** - 살짝 미소. 입꼬리가 올라가고 눈이 약간 좁아짐. 과하지 않게
3. **sad** - 약간 슬픈 표정. 눈썹이 살짝 처지고 입꼬리가 내려감
4. **angry** - 약간 화난 표정. 미간이 좁아지고 눈매가 날카로워짐
5. **shocked** - 살짝 놀란 표정. 눈이 약간 커지고 입이 살짝 벌어짐
6. **loved** - 사랑스러운 표정. 부드러운 미소와 따뜻한 눈빛

## 필수 규칙
- 카메라 고정 (줌/패닝/회전 없음)
- 과한 모션 없음. 미세한 표정 변화만
- 기본 이미지와 동일한 구도/배경/의상 유지
- 머리카락, 옷 등 자연스러운 미세 움직임은 허용
- 6초 길이
- 2:3 세로 비율

## 프롬프트 구조
```
The character [감정 설명]. Camera is fixed, no zoom or pan. Subtle [표정 변화].
Natural micro-movements only - gentle breathing, slight hair movement.
Maintain exact same pose, outfit, and background. 6 seconds.
```

## 출력 형식
JSON 형태로 6개 감정 프롬프트를 출력:
```json
{
  "natural": "prompt...",
  "happy": "prompt...",
  "sad": "prompt...",
  "angry": "prompt...",
  "shocked": "prompt...",
  "loved": "prompt..."
}
```
