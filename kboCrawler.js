/**
 * KBO 2026 정규시즌 일정 크롤러
 * 실행: node kboCrawler.js
 */

const axios = require('axios');
const fs = require('fs');

const SEASON = 2026;
const MONTHS = ['03', '04', '05', '06', '07', '08', '09', '10'];
const API_URL = 'https://www.koreabaseball.com/ws/Schedule.asmx/GetScheduleList';
const PAGE_URL = 'https://www.koreabaseball.com/Schedule/Schedule.aspx';

// HTML 태그 제거 유틸
function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '').trim();
}

// 팀명 정규화: KBO API가 일부 팀은 한글, 일부는 영문으로 혼용해서 반환함
const TEAM_NAME_MAP = {
  '두산': 'Doosan',
  '롯데': 'Lotte',
  '삼성': 'Samsung',
  '키움': 'Kiwoom',
  '한화': 'Hanwha',
  'KIA': 'KIA',
  'KT': 'KT',
  'LG': 'LG',
  'NC': 'NC',
  'SSG': 'SSG',
};

function normalizeTeam(name) {
  return TEAM_NAME_MAP[name] ?? name;
}

// play 셀에서 팀명 추출: "<span>KT</span><em><span>vs</span></em><span>LG</span>"
function parseTeams(playText) {
  const spans = [...playText.matchAll(/<span>([^<]+)<\/span>/g)].map(m => m[1].trim());
  // spans: [away, 'vs', home] 또는 [away, home] 형태
  const teams = spans.filter(s => s.toLowerCase() !== 'vs');
  return {
    away: normalizeTeam(teams[0] || ''),
    home: normalizeTeam(teams[1] || ''),
  };
}

// 날짜 파싱: "03.28(토)" → "2026-03-28"
function parseDate(text, season) {
  const match = text.match(/(\d{2})\.(\d{2})/);
  if (!match) return null;
  return `${season}-${match[1]}-${match[2]}`;
}

async function getSession() {
  const res = await axios.get(`${PAGE_URL}?seriesId=0&date=${SEASON}03`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
  });
  const cookies = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
  return cookies;
}

async function fetchMonth(month, cookies) {
  const params = new URLSearchParams({
    leId: 1,
    srIdList: '0,9,6',  // 정규시즌
    seasonId: String(SEASON),
    gameMonth: month,
    teamId: '',
  });

  const res = await axios.post(API_URL, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${PAGE_URL}?seriesId=0&date=${SEASON}${month}`,
      'Origin': 'https://www.koreabaseball.com',
      'Cookie': cookies,
    },
    timeout: 15000,
  });

  const rows = res.data?.rows || [];
  const games = [];
  let currentDate = null;

  for (const rowObj of rows) {
    const cells = rowObj.row || [];

    // 날짜 셀 갱신 (class="day")
    const dayCell = cells.find(c => c.Class === 'day');
    if (dayCell) {
      const parsed = parseDate(stripHtml(dayCell.Text), SEASON);
      if (parsed) currentDate = parsed;
    }

    // play 셀에서 팀 추출
    const playCell = cells.find(c => c.Class === 'play');
    if (!playCell || !currentDate) continue;

    const { away, home } = parseTeams(playCell.Text);
    if (!away || !home) continue;

    // time 셀
    const timeCell = cells.find(c => c.Class === 'time');
    const time = stripHtml(timeCell?.Text || '');

    // 구장: 날짜 셀 유무에 따라 인덱스가 다름 (8열 vs 9열 행)
    const hasDate = cells.some(c => c.Class === 'day');
    const stadiumIndex = hasDate ? 7 : 6;
    const stadium = cells[stadiumIndex] ? stripHtml(cells[stadiumIndex].Text) : '';

    games.push({ date: currentDate, time, away, home, stadium });
  }

  return games;
}

function dedup(games) {
  const seen = new Set();
  return games.filter(g => {
    const key = `${g.date}|${g.time}|${g.away}|${g.home}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  console.log(`KBO ${SEASON} 정규시즌 일정 크롤링 시작\n`);

  let cookies;
  try {
    cookies = await getSession();
  } catch (e) {
    console.error('세션 획득 실패:', e.message);
    process.exit(1);
  }

  const allGames = [];

  for (const month of MONTHS) {
    try {
      const games = await fetchMonth(month, cookies);
      allGames.push(...games);
      console.log(`${SEASON}-${month}: ${games.length}경기 수집`);
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      console.error(`오류 (${month}):`, e.message);
    }
  }

  const unique = dedup(allGames);
  unique.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const output = { season: SEASON, games: unique };
  const outFile = `kbo-${SEASON}-schedule.json`;
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n완료: 총 ${unique.length}경기 → ${outFile} 저장`);
}

main();
