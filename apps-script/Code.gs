/**
 * 더아카이브 산타의 선물 집계 — SANTA'S DELIVERY 로그 수집 (Google Apps Script)
 *
 * 설치
 *  1) 이 시트에서 확장 프로그램 → Apps Script → Code.gs 내용 전부 지우고 이 코드 붙여넣기 → 저장
 *  2) 위 함수 선택에서 setup 실행 (처음 한 번, 권한 허용) → '로그'·'요약' 시트가 만들어짐
 *  3) 배포 → 새 배포 → 유형: 웹 앱
 *       실행 계정: 나 / 액세스 권한: 모든 사용자  → 배포 → 웹 앱 URL 복사 (…/exec 로 끝남)
 *  4) 그 URL 을 게임 호스트(PC1) 주소에 &sheet=URL 로 넣기 (또는 Claude에게 전달 → 기본값으로 박아줌)
 *  * 코드를 고친 뒤에는 배포 → 배포 관리 → 수정(연필) → 버전: 새 버전 → 배포 (URL 그대로 유지됨)
 *
 * 게임이 보내는 형식: POST body = JSON {rows:[{t,kind,id,text,skin,via,wait,show,stay,online,conns,sents,rejects,note}, ...]}
 */
const LOG_SHEET = '로그';
const SUM_SHEET = '요약';
const HEAD = ['시각', '종류', '연결ID', '문장', '스킨', '배달방식', '대기', '표시까지(초)', '체류(초)',
              '동시 접속', '누적 접속', '누적 문장', '누적 욕설 차단', '비고'];
const KIND_KO = {boot: '화면 시작', connect: '폰 접속', close: '폰 나감', send: '문장 받음',
                 show: '화면 표시', reject: '욕설 차단', test: '테스트'};

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.inbox) return out_(inboxPut_(body.inbox));
    const list = Array.isArray(body.rows) ? body.rows : [body];
    const rows = list.slice(0, 500).map(toRow);
    if (rows.length) {
      const sh = logSheet_();
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEAD.length).setValues(rows);
    }
    return out_({ok: true, n: rows.length});
  } catch (err) {
    return out_({ok: false, error: String(err)});
  } finally {
    lock.releaseLock();
  }
}

/** 브라우저로 URL 열면 연결 확인용 */
function doGet(e) {
  if (e && e.parameter && e.parameter.inbox) return out_(inboxGet_(+e.parameter.after));
  return out_({ok: true, sheet: SpreadsheetApp.getActiveSpreadsheet().getName(), rows: Math.max(0, logSheet_().getLastRow() - 1)});
}

function toRow(r) {
  const v = x => (x === undefined || x === null) ? '' : x;
  const txt = s => {                    // 수식 주입 방지 (=, +, -, @ 로 시작하는 문장)
    s = String(v(s)).slice(0, 200);
    return /^[=+\-@]/.test(s) ? "'" + s : s;
  };
  return [
    r.t ? new Date(r.t) : new Date(),
    v(r.kind),
    v(r.id),
    txt(r.text),
    v(r.skin),
    v(r.via),
    v(r.wait),
    v(r.show),
    v(r.stay),
    v(r.online),
    v(r.conns),
    v(r.sents),
    v(r.rejects),
    txt(r.note || KIND_KO[r.kind] || ''),
  ];
}

function logSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(LOG_SHEET);
  if (!sh) { sh = ss.insertSheet(LOG_SHEET); header_(sh); }
  return sh;
}

function header_(sh) {
  sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#2a1d14');
  sh.setFrozenRows(1);
  sh.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sh.setColumnWidth(1, 150); sh.setColumnWidth(4, 320); sh.setColumnWidth(14, 160);
}

/** 처음 한 번 실행: 로그·요약 시트 만들기 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = logSheet_();
  if (sh.getLastRow() === 0) header_(sh);
  const first = ss.getSheetByName('시트1');
  if (first && first.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(first);

  let s = ss.getSheetByName(SUM_SHEET);
  if (!s) s = ss.insertSheet(SUM_SHEET);
  s.clear();
  const L = "'" + LOG_SHEET + "'!";
  const rows = [
    ['항목', '값', '설명'],
    ['폰 접속 (총)', `=COUNTIF(${L}B:B,"connect")`, 'QR 찍고 리모트가 연결된 횟수'],
    ['보낸 문장 (총)', `=COUNTIF(${L}B:B,"send")`, '화면이 받은 소원'],
    ['화면 표시 (총)', `=COUNTIF(${L}B:B,"show")`, '배달 완료되어 글씨가 뜬 수'],
    ['욕설 차단 (총)', `=COUNTIF(${L}B:B,"reject")`, ''],
    ['고유 연결 수', `=IFERROR(COUNTUNIQUE(FILTER(${L}C2:C,${L}B2:B="connect")),0)`, '연결ID 기준'],
    ['최대 동시 접속', `=MAX(${L}J:J)`, ''],
    ['평균 표시까지(초)', `=IFERROR(ROUND(AVERAGEIF(${L}B:B,"show",${L}H:H),1),"-")`, '문장 받은 뒤 화면에 뜨기까지'],
    ['평균 체류(초)', `=IFERROR(ROUND(AVERAGEIF(${L}B:B,"close",${L}I:I),0),"-")`, '폰 연결 유지 시간'],
    ['', '', ''],
    ['날짜별', '', ''],
    ['날짜', '문장 수', '접속 수'],
  ];
  s.getRange(1, 1, rows.length, 3).setValues(rows);
  s.getRange('A13').setFormula(`=IFERROR(SORT(UNIQUE(FILTER(TO_DATE(INT(${L}A2:A)),${L}A2:A<>""))),"")`);
  s.getRange('B13').setFormula(`=ARRAYFORMULA(IF(A13:A="",,COUNTIFS(${L}B2:B,"send",${L}A2:A,">="&A13:A,${L}A2:A,"<"&(A13:A+1))))`);
  s.getRange('C13').setFormula(`=ARRAYFORMULA(IF(A13:A="",,COUNTIFS(${L}B2:B,"connect",${L}A2:A,">="&A13:A,${L}A2:A,"<"&(A13:A+1))))`);
  s.getRange('A1:C1').setFontWeight('bold').setFontColor('#ffffff').setBackground('#2a1d14');
  s.getRange('A12:C12').setFontWeight('bold').setBackground('#f3e9d6');
  s.getRange('A11').setFontWeight('bold');
  s.getRange('A13:A').setNumberFormat('yyyy-mm-dd');
  s.setColumnWidth(1, 160); s.setColumnWidth(3, 260);
}

/** 연결 테스트: 실행하면 로그에 테스트 한 줄 추가 */
function testRow() {
  doPost({postData: {contents: JSON.stringify({rows: [{kind: 'test', text: '연결 테스트 (지워도 됨)', note: 'Apps Script 테스트'}]})}});
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ================= 폰 → 화면 우회 전달 (수신함) =================
   현장 네트워크에서 폰-PC 직접 연결(PeerJS)이 막힐 때 사용.
   폰: POST {inbox:{text,skin,wall,cid}} → '수신함' 시트에 쌓임
   PC1(호스트): GET ?inbox=1&after=<마지막 번호> 를 2~3초마다 확인해서 새 소원만 가져감 */
const INBOX_SHEET = '수신함';
function inboxSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(INBOX_SHEET);
  if (!sh) { sh = ss.insertSheet(INBOX_SHEET); sh.getRange(1, 1, 1, 6).setValues([['번호', '시각', '문장', '스킨', '벽', '폰ID']]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function inboxPut_(w) {
  const text = String(w.text || '').trim().slice(0, 80);
  if (!text) return {ok: false, error: 'empty'};
  const props = PropertiesService.getScriptProperties();
  const id = (+props.getProperty('inboxLast') || 0) + 1;
  inboxSheet_().appendRow([id, new Date(), /^[=+\-@]/.test(text) ? "'" + text : text, String(w.skin || 'glow').slice(0, 12), +w.wall || 0, String(w.cid || '').slice(0, 12)]);
  props.setProperty('inboxLast', String(id));
  CacheService.getScriptCache().put('inboxLast', String(id), 21600);
  return {ok: true, id: id};
}
function inboxGet_(after) {
  const cache = CacheService.getScriptCache();
  let last = +cache.get('inboxLast');
  if (!last) { last = +PropertiesService.getScriptProperties().getProperty('inboxLast') || 0; cache.put('inboxLast', String(last), 21600); }
  if (!(after >= 0) || after >= last) return {ok: true, last: last, items: []};   // 처음 접속(after=-1)은 번호만 받아감
  const sh = inboxSheet_(), n = sh.getLastRow() - 1;
  if (n <= 0) return {ok: true, last: last, items: []};
  const take = Math.min(n, Math.min(100, last - after + 5));
  const rows = sh.getRange(sh.getLastRow() - take + 1, 1, take, 6).getValues();
  const items = rows.filter(r => +r[0] > after).map(r => ({id: +r[0], text: String(r[2]).replace(/^'/, ''), skin: r[3], wall: +r[4] || 0, cid: r[5]}));
  return {ok: true, last: last, items: items};
}
