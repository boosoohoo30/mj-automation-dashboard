# 🎬 Production Agents - 제작팀

> scenario-agent → image-agent → video-agent + voice-agent → edit-agent
> GATE 1 승인 후 순차 실행

---

## 1. Scenario Agent (스토리보드 설계)

### 역할
승인된 아이디어를 기반으로 상세 스토리보드를 설계한다.

### 트리거
- verify-agent 통과 후 자동 실행

### 출력 포맷
```
영상 제목: [제목]
총 길이: [초]
스타일: [애니/실사/캐릭터스토리/밈]

[컷 1] 0:00~0:03
- 화면: [장면 설명]
- 대사/자막: [텍스트]
- 감정: [캐릭터 감정]
- 카메라: [앵글/움직임]
- BGM/효과음: [설명]

[컷 2] 0:03~0:06
...
```

### 고려사항
- 인스타 릴스 기준 15~90초
- 첫 3초 후킹 필수
- 자막 위치/크기 고려
- 9:16 세로 화면 기준 구성

### 사용 도구
- `Claude API`: 스토리보드 생성

### 출력
- 스토리보드 문서 → **⛔ GATE 3** (수환 확인)

---

## 2. Image Agent (캐릭터 이미지 생성)

### 역할
ComfyUI API를 통해 캐릭터/장면 이미지를 생성한다.

### 트리거
- GATE 1 승인 후 (scenario-agent와 병렬 가능)

### ComfyUI 설정
- **서버**: http://127.0.0.1:8188
- **해상도**: 768×1152px
- **모델**: FLUX 2채널
  - CH1: 캐릭터 프롬프트
  - CH2: 스타일+배경 프롬프트

### 프롬프트 규칙
```
고정 태그 (항상 포함):
(masterpiece:1.3),(best quality:1.3),(high quality:1.3),
(waist up shot:1.2),(looking at viewer:1.3)

금지 태그 (절대 포함 금지):
(pentagram,occult symbol,demon sigil,glowing rune)

제거 태그:
Natural expressions (사용하지 않음)
```

### 실행 흐름
```
1. 스토리보드 기반 캐릭터 프롬프트 생성
2. ComfyUI API로 이미지 생성 요청
3. 결과 이미지를 output/YYYY-MM-DD/images/에 저장
4. → ⛔ GATE 2 (수환 확인)
5. 승인 시 video-agent로 전달
6. 재생성 요청 시 프롬프트 수정 후 재실행
```

### 사용 도구
- `ComfyUI API`: 이미지 생성
- `Claude API`: 프롬프트 최적화

### 출력
- 캐릭터 이미지 → **⛔ GATE 2** (수환 확인)

---

## 3. Video Agent (영상 생성)

### 역할
PixVerse V6를 통해 이미지를 영상으로 변환한다.

### 트리거
- GATE 2 + GATE 3 승인 후 실행

### 영상 설정
- **도구**: PixVerse V6 (CLI/API)
- **비율**: 9:16
- **길이**: 컷별 3~6초
- **품질**: 720P 이상

### 영상 원칙
- 과한 모션 없이 자연스러운 변화
- 카메라 고정 (줌/패닝 최소화)
- 기본 이미지와 동일한 구도 유지

### 사용 도구
- `PixVerse V6 API`: 영상 생성

### 출력
- 컷별 영상 클립 → edit-agent로 전달

---

## 4. Voice Agent (음성/음향 생성)

### 역할
ElevenLabs API로 대사 음성과 환경음을 생성한다.

### 트리거
- GATE 3 승인 후 (video-agent와 병렬 실행)

### 음성 설정
- **도구**: ElevenLabs REST API
- **언어**: 한국어(기본) / 영어(자동더빙) / 일본어(필요시)
- **스타일**: 스토리보드 감정에 맞춤

### 생성 항목
1. **대사 음성**: 컷별 대사를 TTS로 생성
2. **환경음**: 장면에 맞는 배경음
3. **BGM**: 분위기에 맞는 배경 음악 (저작권 무료)

### 사용 도구
- `ElevenLabs API`: TTS + 음향

### 출력
- 음성/음향 파일 → edit-agent로 전달

---

## 5. Edit Agent (영상 편집/결합)

### 역할
ffmpeg를 사용하여 영상+음성+자막을 결합하고 플랫폼별 포맷으로 변환한다.

### 트리거
- video-agent + voice-agent 모두 완료 후 실행

### 편집 작업
```
1. 컷별 영상 클립 결합
2. 음성/BGM/효과음 믹싱
3. 자막 오버레이 (자동 생성)
4. 플랫폼별 포맷 변환:
   - Instagram Reels: 9:16, 15~90초, H.264 MP4
   - X: 9:16, 30~140초, H.264 MP4
   - YouTube Shorts: 9:16, 60초, H.264 MP4
5. 최적화: 파일 크기 압축 (3MB 이하)
```

### 크로스플랫폼 ffmpeg
```
Windows: ffmpeg.exe
Mac:     ffmpeg
→ Claude Code가 OS 자동 감지
```

### 사용 도구
- `ffmpeg`: 영상 결합/변환/최적화

### 출력
- 완성 영상 → **⛔ GATE 4** (수환 확인)
- 저장: `output/YYYY-MM-DD/videos/`
