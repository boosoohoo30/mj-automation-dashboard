# AI Media Company - 마스터 오케스트레이터

> 이 파일은 전체 시스템의 중앙 통제 문서입니다.
> Claude Code가 이 파일을 읽고 에이전트를 순서대로 실행합니다.

---

## 프로젝트 개요

SNS 콘텐츠(숏폼/롱폼 영상)를 완전 자동으로 생성하고
배포하고 반응을 분석해서 다시 기획에 반영하는
**선순환 AI 미디어 컴퍼니 시스템**.

사람(수환)이 개입하는 건 **5개 GATE 승인 포인트**뿐.
나머지는 전부 Claude Code + 에이전트가 자동 처리.

---

## 시스템 구조

```
CLAUDE.md (마스터 오케스트레이터)
│
├── agents/tech-update-agent.md    ← 기술 최신화 (매주 월 05:00)
├── agents/01-planning-agents.md   ← 기획팀 (trend/idea/verify)
├── agents/02-production-agents.md ← 제작팀 (scenario/image/video/voice/edit)
└── agents/03-distribution-agents.md ← 배포팀 (publish/analytics/feedback)
```

---

## ⛔ 5 GATE 승인 구조 (절대 규칙)

승인 없이 다음 단계 절대 진행 금지.

| GATE | 내용 | 알림 |
|------|------|------|
| GATE 1 | 아이디어 확인 (3~5개 제시 → 선택) | 슬랙/카카오 |
| GATE 2 | 캐릭터 이미지 확인 (OK 또는 재생성) | 슬랙/카카오 |
| GATE 3 | 스토리보드 확인 (컷/대사/감정) | 슬랙/카카오 |
| GATE 4 | 완성 영상 확인 (OK하면 업로드) | 슬랙/카카오 |
| GATE 5 | 72h 반응 결과 확인 (피드백 반영 승인) | 슬랙/카카오 |

---

## 툴 스택

### 제작
| 툴 | 용도 | 접근 |
|----|------|------|
| ComfyUI | 이미지 생성 | 로컬 127.0.0.1:8188 |
| PixVerse V6 | 영상 생성 | CLI/API |
| ElevenLabs | 음성+환경음 | REST API |
| ffmpeg | 영상 결합 | CLI (OS 자동감지) |

### 배포
| 툴 | 용도 |
|----|------|
| Upload-Post.com | 전 플랫폼 동시 업로드 |
| Instagram Graph API | 반응 수집 |
| X API v2 | 반응 수집 |
| 구글 시트 | 성과 DB |
| n8n (셀프호스팅) | 스케줄 자동실행 |
| 슬랙/카카오톡 | GATE 알림 |

### AI
| 툴 | 용도 |
|----|------|
| Claude Code | 오케스트레이션 |
| Claude API | 분석/판단/텍스트생성 |
| Apify | SNS 스크래핑 |
| web_search | 기술 모니터링 |

---

## 콘텐츠 스펙

### 플랫폼별 사양
| 플랫폼 | 비율 | 길이 | 필수 |
|--------|------|------|------|
| Instagram Reels | 9:16 | 15~90초 | ✅ |
| X | 9:16 | 30~140초 | ✅ |
| YouTube Shorts | 9:16 | 60초 | 선택 |
| TikTok | 9:16 | 15~60초 | 선택 |
| Threads | 9:16 | 90초 | 선택 |
| YouTube 롱폼 | 16:9 | 3분+ | 선택 |

### 스타일/언어
- 스타일: 애니 / 실사 / 캐릭터스토리 / 트렌드밈
- 언어: 한국어(기본) / 영어(자동더빙) / 일본어(필요시)
- 자막: 전 영상 자동 생성

### ComfyUI 프롬프트 규칙
- 해상도: 768×1152px
- FLUX 2채널 (CH1: 캐릭터 / CH2: 스타일+배경)
- 고정태그: `(masterpiece:1.3),(best quality:1.3),(high quality:1.3),(waist up shot:1.2),(looking at viewer:1.3)`
- forbidden: `(pentagram,occult symbol,demon sigil,glowing rune)`
- Natural expressions 태그 제거

---

## 선순환 파이프라인

```
[매주 월 05:00] tech-update-agent → 신기술 감지 → 에이전트 파일 업데이트
         │
[매일 06:00] trend-agent → SNS 바이럴 수집/분석
         ↓
idea-agent → 아이디어 3~5개 생성
         ↓
⛔ GATE 1 → 수환 아이디어 확인
         ↓ (승인)
image-agent → ComfyUI 캐릭터 이미지
         ↓
⛔ GATE 2 → 수환 캐릭터 이미지 확인
         ↓ (승인)
scenario-agent → 스토리보드 설계
         ↓
⛔ GATE 3 → 수환 스토리보드 확인
         ↓ (승인)
video-agent + voice-agent + edit-agent → 영상 제작
         ↓
⛔ GATE 4 → 수환 완성 영상 확인
         ↓ (승인)
publish-agent → 인스타+X 필수 업로드
         ↓
analytics-agent → 1h/6h/24h/72h 수집
         ↓
⛔ GATE 5 → 수환 반응 결과 확인
         ↓ (승인)
feedback-agent → 성과분석 → DB누적 → trend-agent로 피드백 (선순환)
```

---

## 실행 스케줄

| 시간 | 에이전트 | 비고 |
|------|----------|------|
| 매주 월 05:00 | tech-update-agent | 기술 모니터링 |
| 매일 06:00 | trend-agent | SNS 바이럴 수집 |
| 매일 06:30 | idea-agent | 아이디어 생성 → GATE 1 알림 |
| 업로드 후 1h | analytics-agent | 초기 반응 |
| 업로드 후 6h | analytics-agent | 확산 추이 |
| 업로드 후 24h | analytics-agent | 일일 성과 |
| 업로드 후 72h | analytics-agent | 최종 성과 → GATE 5 알림 |

---

## 성과 DB 스키마 (구글 시트)

영상ID / 제목 / 스타일 / 언어 / 타겟플랫폼 / 업로드시간 /
아이디어출처 / 조회수(1h/6h/24h/72h) / 시청완료율 / 평균시청시간 / 이탈구간 /
좋아요 / 저장수 / 공유수 / 댓글수 / 댓글감정(긍정%/부정%) / 주요키워드 /
인스타점수 / X점수 / 성공요인 / 실패요인 / 다음기획반영사항 /
총점(100점) / API비용

---

## 크로스플랫폼 규칙

| | Windows | Mac |
|--|---------|-----|
| ffmpeg | ffmpeg.exe | ffmpeg |
| 경로구분자 | \ | / |
| python | python | python3 |

Claude Code가 현재 OS 자동 감지 후 맞는 명령어 사용.

---

## 시스템 규칙

1. **5개 GATE 없이 절대 다음 단계 진행 금지**
2. 각 에이전트는 자신의 .md 역할만 수행
3. 에러 시 슬랙/카카오 즉시 알림
4. 생성물은 `output/YYYY-MM-DD/` 폴더에 저장
5. API 비용은 구글시트 자동 기록
6. tech-update-agent 승인 없이 에이전트 파일 직접 수정 금지
7. Auto Mode: 파일수정/API호출/ffmpeg 자동 승인, GATE 5개는 반드시 수환 직접 승인
