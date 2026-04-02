---
name: upload-organize
description: 결과물을 Google Drive에 정리된 이름으로 자동 업로드합니다
user_invocable: true
---

# Google Drive 업로드 및 정리

완성된 이미지와 영상을 Google Drive에 체계적으로 업로드합니다.

## 폴더 구조
```
{태스크명}_{YYYYMMDD}/
  images/
    {태스크명}_concept_v{N}.png
  videos/
    {태스크명}_natural_v{N}.mp4
    {태스크명}_happy_v{N}.mp4
    {태스크명}_sad_v{N}.mp4
    {태스크명}_angry_v{N}.mp4
    {태스크명}_shocked_v{N}.mp4
    {태스크명}_loved_v{N}.mp4
```

## 실행 절차
1. Google Drive MCP 도구를 사용하여 대상 폴더 확인/생성
2. 파일명을 네이밍 규칙에 맞게 변환
3. 파일 업로드
4. 업로드된 파일의 공유 URL 반환

## 네이밍 규칙
- 태스크명에서 특수문자 제거, 공백은 언더스코어로 대체
- 날짜는 YYYYMMDD 형식
- 버전 번호는 이터레이션 횟수와 동일
