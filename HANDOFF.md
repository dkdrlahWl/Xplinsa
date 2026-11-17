# 링구 RPG — 작업 인수인계

XP Hero(Supercent) 방식의 2D 웹 게임. 친구 8명 멀티플레이용.

## 구조
- `server.js` — Node.js 서버 하나(외부 패키지 없음). 정적 파일 + 회원가입/로그인/저장 API + 실시간 WebSocket(`/ws`) + `/version`(자동 업데이트 감지).
  - 계정·저장 데이터: `data/users.json`, 보스 부활 시각: `data/mons.json`
  - 관리자: 아이디 `ehgus` 만 (`/api/me`의 `admin`)
  - 몬스터 체력·처치·리스폰은 서버가 판정, 한 대라도 때린 사람 전원 보상
- `public/index.html` — 로그인/회원가입/닉네임 화면
- `public/game.html` — 게임 전체(캔버스, 한 파일)
- `public/net.js` — 멀티(다른 플레이어 표시, 몬스터 공유, 서버 저장, 중복 로그인 차단, 자동 새로고침)
- `public/assets/*.webp` + `manifest.json` — 이미지. 같은 이름으로 바꾸면 게임에 바로 반영
- `setup.sh` — 서버(Ubuntu) 설치/업데이트 스크립트

## 서버
- AWS Lightsail 서울, 고정 IP `52.78.199.85`, 포트 80, systemd 서비스 `xplinsa`, 설치 위치 `/opt/xplinsa`
- **자동 배포**: 서버가 1분마다 GitHub `main`을 확인해서 바뀌면 자동으로 받아서 재시작함. `main`에 커밋만 하면 끝.
- 접속 중인 폰은 30초 안에 자동 새로고침됨 (진행 상황 저장 후)

## game.html 주요 부분
- `HERO` 영웅 13명, `WT` 무기 8종, `GR` 등급 5개, `MT` 몬스터(보스 지역당 2마리), `Q` 임무 118개
- `UP` 기본 강화(금화), `SPU` 특수 능력(오브 전용)
- `drawPlayer()` / `armPose()` / `IK()` 캐릭터 자세, `gripInfo()`·`handInfo()` 무기 손잡이 자동 인식
- `walk()` 이동 가능 판정(그려진 땅 모양과 일치), `contour()` 지형 외곽선
- 저장 키 `camp_save_v2`(서버 `/api/save`로도 저장)

## 수정 후 꼭 할 것
1. 메뉴의 버전 문구(`버전 1118-xxxx`) 올리기
2. `net.js`를 고쳤으면 game.html의 `net.js?v=숫자`도 올리기
3. `main` 브랜치에 커밋 (1~2분 안에 서버·폰에 자동 반영)
