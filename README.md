# TA_CH_PC1 — 더아카이브 크리스마스 · 마스터 PC1 (벽 1 · 3952×1200)

PC1 = MadSync 마스터 + 게임 릴레이 + 게임 호스트 + 1벽 출력.
PC2~4 는 이 PC의 릴레이(포트 8090)에서 게임 파일을 받아가므로, **이 저장소만 업데이트되면 4대 모두 새 버전**이 됩니다.

| 파일 | 내용 |
|---|---|
| `START.bat` | 매번 실행: git pull → (처음이면 npm install) → 릴레이 창 + 1벽 크롬 전체화면 |
| `run.bat` | START가 호출 (직접 실행해도 됨) |
| `TEST_one_pc.bat` | PC 한 대로 4화면 테스트 (test.html) |
| `santa_split.html` | SANTA'S DELIVERY 게임 (분할 화면 · 락스텝) |
| `relay.js` | 로컬 WebSocket 릴레이 + 파일 서버 |
| `apps-script/Code.gs` | 구글 시트 로그용 Apps Script (시트에 붙여넣는 원본) |
| `remote/fur_remote.html` | 폰 리모트 원본 (현재 QR은 s1hampoo.github.io/SANTA/fur_remote 사용) |

## 처음 한 번
1. Node.js LTS 설치 → https://nodejs.org/ko/download
2. Git for Windows 설치 → https://git-scm.com/download/win
3. `git clone https://github.com/aplan-company/TA_CH_PC1.git C:\TA_CH_PC1`
4. 방화벽: 첫 실행 때 node 허용 (포트 8090)

## 벽 구성
| PC | 벽 | 해상도 | 역할 |
|---|---|---|---|
| PC1 | 1 | 3952×1200 | 마스터 · 릴레이 · 호스트 |
| PC2 | 2 | 6200×1200 | 뷰어 |
| PC3 | 3 | 4400×1200 | 뷰어 |
| PC4 | 4 | 6100×1200 | 뷰어 |

## 주소 파라미터 (santa_split.html)
`screen=1~4` · `host=1` · `ws=ws://IP:8090` · `walls=3952,6200,4400,6100` · `main=2` · `hud=0` · `cull=0` · `buddy=0`(동행 드론 끄기) · `sheet=0`(시트 기록 끄기) · `ban=단어,단어`(금칙어 추가) · `bgm=1`

## 운영 메모
- 업데이트는 쇼 시작 전 START.bat 실행 때만 (쇼 중 자동 변경 없음)
- 인터넷 없으면 업데이트 건너뛰고 마지막 파일로 실행
- 상태: `http://192.168.5.20:8090/status` · 명령: `/cmd/reset` `/cmd/demo` `/cmd/reload`

## 컴퓨터 켜질 때 자동 실행
1. `AUTOSTART_ON.bat` 한 번 실행 → Windows 시작프로그램에 `START.bat` 등록 (끄기: `AUTOSTART_OFF.bat`)
2. 로그인 화면에서 멈추지 않게 **Windows 자동 로그인** 설정: `Win+R` → `netplwiz` → "사용자 이름과 암호를 입력해야…" 체크 해제 → 암호 입력
3. (권장) 절전·화면 꺼짐 '안 함', Windows 업데이트 자동 재시작 시간 조정

부팅 순서: 네트워크 대기(최대 20초) → git pull → 실행. 인터넷이 없으면 마지막 파일로 실행.
크롬 복구 팝업(비정상 종료 후)과 첫 실행 안내는 뜨지 않게 설정돼 있음.
※ `START.bat` 자체는 되도록 수정하지 않음 (실행 중 자기 파일이 바뀌면 cmd가 꼬일 수 있어서 — 바뀌는 내용은 `run.bat`에)
