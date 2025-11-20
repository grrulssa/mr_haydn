const d = new Date(2025, 10, 3);
const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
console.log('2025년 11월 3일:', days[d.getDay()]);
console.log('요일 번호:', d.getDay());

// 11월 1일부터 7일까지
for (let i = 1; i <= 7; i++) {
  const date = new Date(2025, 10, i);
  console.log(`11월 ${i}일: ${days[date.getDay()]}`);
}

