// 브라우저 콘솔에서 실행할 테스트 스크립트
// F12 -> Console 탭에 붙여넣기

console.clear();
console.log('='.repeat(60));
console.log('🧪 1회차 클릭 테스트 시작');
console.log('='.repeat(60));

// 1회차 월요일 찾기
const mondays = document.querySelectorAll('.calendar-day');
let slot1Mondays = [];

mondays.forEach((day, index) => {
  const dayNumber = day.querySelector('.day-number');
  const clickHint = day.querySelector('.click-hint');
  const hasClickable = day.classList.contains('clickable');
  const hasOtherSlot = day.classList.contains('other-slot');
  const hasStartDate = day.classList.contains('start-date');
  const pointerEvents = window.getComputedStyle(day).pointerEvents;

  if (dayNumber && hasStartDate) {
    const info = {
      index,
      date: dayNumber.textContent,
      classes: Array.from(day.classList).filter(c => c !== 'calendar-day'),
      hasClickHint: !!clickHint,
      clickable: hasClickable,
      otherSlot: hasOtherSlot,
      pointerEvents,
      canClick: pointerEvents !== 'none' && hasClickable
    };

    slot1Mondays.push(info);

    console.log(`\n📅 날짜: ${info.date}`);
    console.log(`   클래스: ${info.classes.join(', ')}`);
    console.log(`   pointer-events: ${info.pointerEvents}`);
    console.log(`   clickable: ${info.clickable}`);
    console.log(`   other-slot: ${info.otherSlot}`);
    console.log(`   클릭 힌트: ${info.hasClickHint ? '✅' : '❌'}`);
    console.log(`   클릭 가능: ${info.canClick ? '✅ YES' : '❌ NO'}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`📊 총 ${slot1Mondays.length}개의 시작일 발견`);
console.log(`✅ 클릭 가능: ${slot1Mondays.filter(m => m.canClick).length}개`);
console.log(`❌ 클릭 불가: ${slot1Mondays.filter(m => !m.canClick).length}개`);
console.log('='.repeat(60));

if (slot1Mondays.length === 0) {
  console.error('⚠️ 시작일이 하나도 없습니다! 관리자에서 기간을 설정했는지 확인하세요.');
} else if (slot1Mondays.filter(m => !m.canClick).length > 0) {
  console.error('⚠️ 클릭할 수 없는 날짜가 있습니다!');
  slot1Mondays.filter(m => !m.canClick).forEach(m => {
    console.error(`   날짜 ${m.date}: pointer-events=${m.pointerEvents}, other-slot=${m.otherSlot}`);
  });
}

