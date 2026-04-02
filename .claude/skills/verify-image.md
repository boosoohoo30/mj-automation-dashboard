---
name: verify-image
description: 생성된 이미지가 컨셉에 부합하는지 AI 검증합니다
user_invocable: true
---

# 이미지 AI 검증

생성된 이미지를 원본 컨셉과 비교하여 품질과 일치도를 평가합니다.

## 검증 기준 (각 항목 0~1점)

1. **컬러 일치도** - 컨셉에서 지정한 색상이 잘 반영되었는가
2. **구도/포즈** - 요청한 구도와 일치하는가
3. **스타일 일치도** - 아트 스타일이 컨셉과 맞는가
4. **디테일 정확도** - 의상, 액세서리, 특징 등이 정확한가
5. **품질** - 아티팩트, 왜곡, 해상도 문제가 없는가
6. **감정 적합성** - 중립적 표정으로 6감정 변환이 가능한가

## 실행 절차
1. 이미지 파일 경로를 받아 이미지를 확인
2. 컨셉 설명과 비교
3. 각 항목별 점수 산출
4. 종합 점수와 피드백 제공
5. 승인/재생성 추천

## 출력 형식
```json
{
  "overall_score": 0.82,
  "dimensions": {
    "color_match": 0.9,
    "composition": 0.7,
    "style_match": 0.85,
    "detail_accuracy": 0.8,
    "quality": 0.95,
    "emotion_suitability": 0.7
  },
  "feedback": "구도가 약간 측면으로 치우쳐 있어 감정 변환 시 부자연스러울 수 있습니다.",
  "recommendation": "regenerate",
  "suggested_prompt_changes": "정면 구도를 강조하는 키워드 추가 필요"
}
```
