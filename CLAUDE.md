# 업무 자동화 시스템 (Workflow Automation)

## 프로젝트 개요
슬랙 업무 → 컨셉 확인 → Midjourney 이미지 생성 → AI+사람 검증 → 6감정 Grok 영상 생성 → 최적화 → 업로드까지의 전체 워크플로우 자동화 대시보드.

## 기술 스택
- **Frontend**: React + Vite + Tailwind CSS + Zustand
- **Backend**: Node.js + Express + WebSocket (ws) + SQLite (better-sqlite3)
- **자동화**: Playwright (Midjourney), Grok API (영상), ffmpeg (최적화)

## 프로젝트 구조
- `packages/frontend/` - React 대시보드 (Vite)
- `packages/backend/` - Node.js API 서버
- `scripts/` - ffmpeg 래퍼 등 유틸리티

## 핵심 규칙

### 이미지 사양
- 해상도: 768 x 1152 (가로2:세로3 비율)
- Midjourney 파라미터: `--ar 2:3`

### 영상 사양
- 원본: 720P, 2:3 비율, 6초
- 최적화 후: 768x1152, 음소거, 3MB 이하, H.264 MP4

### 6감정 목록
1. natural (기본)
2. happy
3. sad
4. angry
5. shocked
6. loved

### 감정 영상 원칙
- 과한 모션 없이 자연스러운 변화
- 카메라 고정 (줌/패닝 없음)
- 기본 이미지와 동일한 구도 유지

### 네이밍 규칙 (Google Drive)
```
{태스크명}_{YYYYMMDD}/
  images/{태스크명}_concept_v{N}.png
  videos/{태스크명}_{감정}_v{N}.mp4
```

### 워크플로우 상태
pending → fetching_concept → generating_prompts → generating_images → reviewing_images → uploading_images → editing_images → generating_videos → reviewing_videos → optimizing_videos → uploading_videos → completed

## 개발 명령어
```bash
# 전체 설치
npm install

# 개발 서버 실행
npm run dev           # 프론트+백 동시
npm run dev:frontend  # 프론트만 (port 5173)
npm run dev:backend   # 백엔드만 (port 3001)
```

## 환경변수 (.env)
```
GROK_API_KEY=        # xAI Grok API
CONFLUENCE_URL=      # Confluence 인스턴스 URL
CONFLUENCE_EMAIL=    # Confluence 로그인 이메일
CONFLUENCE_TOKEN=    # Confluence API 토큰
GOOGLE_DRIVE_FOLDER= # 업로드 대상 폴더 ID
```

## 학습 로그
- (여기에 발생한 이슈와 해결 방법을 기록)
