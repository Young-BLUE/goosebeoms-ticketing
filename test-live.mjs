import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setViewportSize({ width: 1280, height: 800 });

const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

// 1. 메인 - 공연 목록 로드
console.log('\n--- 1. 메인 페이지 (공연 목록) ---');
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/live-01-main.png' });
const showCount = await page.locator('[class*="grid"] > div').count();
console.log(`공연 카드 수: ${showCount}`);

// 2. 회원가입
console.log('\n--- 2. 회원가입 ---');
await page.goto(`${BASE}/login`);
await page.click('text=회원가입');
await page.waitForTimeout(500);
const ts = Date.now();
await page.fill('input[placeholder="홍길동"]', '테스트유저');
await page.fill('input[placeholder="010-1234-5678"]', '010-1234-5678');
await page.fill('input[type="email"]', `user${ts}@test.com`);
await page.fill('input[type="password"]', 'test1234');
await page.screenshot({ path: '/tmp/live-02-signup.png' });
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/`);
console.log('회원가입 성공 → 홈으로 리다이렉트');
await page.screenshot({ path: '/tmp/live-03-after-signup.png' });

// 3. 공연 상세
console.log('\n--- 3. 공연 상세 ---');
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.locator('[class*="grid"] > div').first().click();
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/live-04-show-detail.png' });
const scheduleCount = await page.locator('button[class*="border-2"]').count();
console.log(`회차 수: ${scheduleCount}`);

// 4. 예매하기 클릭 → 대기열 or 즉시 좌석선택
console.log('\n--- 4. 대기열 진입 ---');
await page.click('text=예매하기');
// waiting 또는 booking 둘 다 허용
await page.waitForURL(/\/(waiting|booking)/, { timeout: 10000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/live-05-waiting.png' });

let activated = page.url().includes('/booking');
if (activated) {
  console.log('대기열 즉시 통과 → 좌석 선택 페이지');
} else {
  const waitingCnt = await page.locator('text=대기').count();
  const activeCnt = await page.locator('text=입장 준비').count();
  console.log(`대기열 상태: ${activeCnt > 0 ? '입장 준비' : waitingCnt > 0 ? '대기 중' : '알 수 없음'}`);

  // 대기열에서 ACTIVE가 될 때까지 최대 20초 대기
  console.log('ACTIVE 대기 중...');
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(1000);
    if (page.url().includes('/booking')) {
      activated = true;
      console.log('대기열 통과 → 좌석 선택 페이지');
      break;
    }
    const cnt = await page.locator('text=입장 준비').count();
    if (cnt > 0) {
      console.log('ACTIVE 상태 확인');
      await page.waitForTimeout(2000);
      activated = page.url().includes('/booking');
      break;
    }
  }
}
await page.screenshot({ path: '/tmp/live-06-after-waiting.png' });

// 5. 좌석 선택 (이미 /booking에 있으면)
if (page.url().includes('/booking')) {
  console.log('\n--- 5. 좌석 선택 ---');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/live-07-seat-selection.png' });
  const zoneCount = await page.locator('button[class*="px-4"]').count();
  console.log(`구역 탭 수: ${zoneCount}`);
  const seatCount = await page.locator('button[class*="rounded"]').count();
  console.log(`좌석 버튼 수: ${seatCount}`);
}

// 6. 마이페이지 (로그인된 상태)
console.log('\n--- 6. 마이페이지 ---');
await page.goto(`${BASE}/mypage`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/live-08-mypage.png' });
const hasLoggedIn = await page.locator('text=예매 내역').count();
console.log(`마이페이지 로그인 상태: ${hasLoggedIn > 0 ? '로그인됨' : '미로그인'}`);

// 7. 이벤트 페이지 - 쿠폰 목록
console.log('\n--- 7. 이벤트/쿠폰 ---');
await page.goto(`${BASE}/events`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/live-09-events.png' });
const couponCount = await page.locator('[class*="bg-gradient-to-r from-purple-600"]').count();
console.log(`쿠폰 카드 수: ${couponCount}`);

// 콘솔 에러
console.log(`\n콘솔 에러: ${errors.filter(e => !e.includes('favicon')).length}건`);
errors.filter(e => !e.includes('favicon')).forEach(e => console.log(' -', e.slice(0, 100)));

await browser.close();
