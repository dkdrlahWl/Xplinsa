# 링구 RPG — 작업 인수인계

XP Hero(Supercent) 방식의 2D 웹 게임. 친구 8명 멀티플레이용.

## 구조
- `server.js` — Node.js 서버 하나(외부 패키지 없음). 정적 파일 + 회원가입/로그인/저장 API + 실시간 WebSocket(`/ws`) + `/version`(자동 업데이트 감지).
  - 계정·저장 데이터: `data/users.json`, 보스 부활 시각: `data/mons.json`
  - 관리자: 아이디 `ehgus` 만 (`/api/me`의 `admin`)
  - 몬스터 체력·처치·리스폰은 서버가 판정, 한 대라도 때린 사람 전원 보상
- `public/index.html` — 로그인/회원가입/닉네임 화면
- `public/game.html` — 게임 전체(캔버스, 한 파일)
- `public/tower.js` + `public/tower.css` — 개인 도전의 탑. 1~100층, 30초 제한, 한국 시간 00시 입장권 2장 충전. 승리/소탕 시 1장 차감, 실패/포기 시 차감 없음. `S.tower.pending` 보상은 수령 전까지 유지하고 중복 지급 방지. 광고 연동은 없으며 2배 보너스는 하루 3회. 10회 클리어마다 보석 60·오브 7·랜덤 전설 무기 1개. 전투는 월드와 분리하고 기존 영웅 렌더러·계산된 능력치를 사용.
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

## 활동도·보상 알림
- `activityClaimable()`과 `collectAllRewards()`로 미수령 보상 판정. 세 줄 메뉴와 도감·일일·주간 항목에 느낌표. 0.5초 간격 및 패널 갱신 시 즉시 갱신. 완료 임무/활동 상자는 초록 버튼, 수령한 활동 점수는 100점 게이지로 표시.
