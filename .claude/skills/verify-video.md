---
name: verify-video
description: 생성된 감정 영상이 요구사항에 부합하는지 AI 검증합니다
user_invocable: true
---

# 영상 AI 검증

생성된 감정 영상의 품질과 요구사항 충족도를 평가합니다.

## 검증 기준 (각 항목 0~1점)

1. **감정 정확도** - 해당 감정이 올바르게 표현되었는가
2. **모션 적절성** - 움직임이 과하지 않고 자연스러운가
3. **카메라 고정** - 카메라 움직임(줌/패닝)이 없는가
4. **일관성** - 원본 이미지와 외형/배경이 일치하는가
5. **아티팩트** - 깜빡임, 왜곡 등 비디오 결함이 없는가
6. **시간 적합성** - 6초 동안 자연스럽게 루프 가능한가

## 실행 절차
1. 영상 파일에서 핵심 프레임 추출 (시작, 중간, 끝)
2. 원본 이미지와 비교
3. 감정 라벨과 실제 표현 비교
4. 각 항목별 점수 산출
5. 종합 판단

## 출력 형식
```json
{
  "overall_score": 0.78,
  "emotion": "happy",
  "dimensions": {
    "emotion_accuracy": 0.85,
    "motion_quality": 0.8,
    "camera_stability": 1.0,
    "consistency": 0.7,
    "artifacts": 0.6,
    "loop_quality": 0.75
  },
  "feedback": "미소 표현은 적절하나 3초 부근에서 배경 왜곡 발생",
  "recommendation": "approve"
}
```
