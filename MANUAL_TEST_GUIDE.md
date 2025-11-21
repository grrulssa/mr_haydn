# 🧪 1회차 클릭 수동 테스트 가이드
## 📋 준비사항
- 브라우저: Chrome, Safari, Firefox 등
- URL: http://localhost:8081
- 개발자 도구: F12 (Mac: Cmd+Opt+I)
---
## ✅ 테스트 절차
### 1단계: 기간 설정
```
1. http://localhost:8081 접속
2. "⚙️ 관리자" 버튼 클릭
3. 시작 날짜: 2025-12-01 입력
4. 종료 날짜: 2025-12-31 입력
5. "기간 설정하기" 버튼 클릭
6. 초록색 토스트 알림 확인
```
### 2단계: 달력 확인
```
1. "📅 대여 신청" 버튼 클릭
2. 차량: 포르쉐 타이칸 4S 선택 (기본값)
3. 회차: 1회차 (월~목) 선택 (기본값)
4. 달력에서 월요일 찾기
```
### 3단계: 시각적 확인
월요일이 다음과 같이 표시되어야 합니다:
```
✅ 오렌지/핑크 그라데이션 배경
✅ 빨간 테두리
✅ "클릭하여 신청" 텍스트
✅ 마우스 올리면 확대 효과
✅ cursor: pointer (손가락 모양)
```
❌ 다음과 같으면 문제:
```
❌ 회색 배경
❌ 점선 테두리
❌ "클릭하여 신청" 텍스트 없음
❌ cursor: not-allowed (금지 표시)
❌ opacity 낮음 (흐림)
```
### 4단계: 클릭 테스트
```
1. 월요일 날짜 클릭
2. 모달(팝업) 열려야 함
3. 모달 제목: "🚗 차량 신청하기"
4. 차량 정보 표시 확인
```
---
## 🔍 디버깅 방법
### 방법 1: 콘솔 로그 확인
```
1. F12 눌러서 개발자 도구 열기
2. Console 탭 선택
3. 1회차 선택하면 자동으로 로그 출력
4. 다음 정보 확인:
   - ✅ 1회차 완전: {...}
   - 🔍 1회차 월요일 디버깅: {...}
```
**isClickable이 false인 경우 원인:**
- `isStartDate: false` → 월요일 감지 실패
- `weekId: null` → 주차 ID 생성 실패
- `isInPeriod: false` → 기간 설정 오류
- `isComplete: false` → 월화수목 중 누락된 날짜
- `isOtherSlotStart: true` → 다른 회차로 잘못 인식
### 방법 2: 브라우저 테스트 스크립트
```
1. F12 → Console 탭
2. test-slot1-click.js 파일 내용 복사
3. 콘솔에 붙여넣기
4. Enter 키
5. 결과 확인
```
출력 예시:
```
📅 날짜: 1
   클래스: start-date, clickable, in-period
   pointer-events: auto
   clickable: true
   other-slot: false
   클릭 힌트: ✅
   클릭 가능: ✅ YES
```
### 방법 3: Elements 탭 검사
```
1. 월요일 날짜 우클릭
2. "검사" 또는 "Inspect" 선택
3. Elements 탭에서 클래스 확인
```
**정상적인 클래스:**
```html
<div class="calendar-day start-date clickable">
```
**문제가 있는 클래스:**
```html
<div class="calendar-day other-slot">  ← 문제!
<div class="calendar-day inactive-date">  ← 문제!
```
### 방법 4: Computed Styles 확인
```
1. Elements 탭에서 월요일 선택
2. Styles 또는 Computed 탭 확인
3. pointer-events 값 확인
```
- ✅ `pointer-events: auto` → 정상
- ❌ `pointer-events: none` → 문제!
---
## 🐛 문제 해결
### 문제 1: 월요일이 회색으로 표시
**원인**: `other-slot` 클래스 적용됨
**해결**: JavaScript 로직 수정 필요
```javascript
// 콘솔에서 확인
document.querySelectorAll('.calendar-day.other-slot').forEach(el => {
  console.log('other-slot 날짜:', el.querySelector('.day-number').textContent);
});
```
### 문제 2: 클릭해도 반응 없음
**원인**: `pointer-events: none`
**해결**: CSS 우선순위 문제
```javascript
// 콘솔에서 확인
document.querySelectorAll('.calendar-day.start-date').forEach(el => {
  const style = window.getComputedStyle(el);
  console.log('pointer-events:', style.pointerEvents);
});
```
### 문제 3: 모달이 안 열림
**원인**: `isClickable: false`
**해결**: 콘솔 로그에서 어떤 조건이 false인지 확인
---
## 📊 체크리스트
테스트 완료 시 체크:
- [ ] 관리자에서 기간 설정 완료
- [ ] 달력에 월요일 표시됨
- [ ] 월요일이 오렌지/핑크 색상
- [ ] "클릭하여 신청" 텍스트 보임
- [ ] 마우스 올리면 확대됨
- [ ] 클릭하면 모달 열림
- [ ] 모달에서 신청 가능
---
## 💡 팁
1. **캐시 문제**: Cmd+Shift+R (Mac) 또는 Ctrl+Shift+R (Windows)로 강력 새로고침
2. **포트 확인**: 8081 포트 맞는지 확인
3. **기간 설정**: 반드시 월요일부터 시작하거나 월요일 포함
4. **완전한 회차**: 월화수목 4일 모두 기간에 포함되어야 함
---
**문서 버전**: 1.0  
**작성일**: 2025-11-21  
**대상**: 개발자 / QA
