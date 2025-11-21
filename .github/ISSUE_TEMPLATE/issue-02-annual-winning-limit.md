---
title: "연간 차종별 최대 2회 당첨 제한 시스템 구축"
labels: enhancement, high-priority
assignees: iron.man1011
---

## 📋 이슈 개요

차량 대여 시스템에서 공정한 기회 분배를 위해 **연간 차종별 최대 2회 당첨 제한**을 구현해야 합니다.

## 🎯 요구사항

### 핵심 규칙
- **연간 기준**: 2025년 1월 6일 ~ 2026년 1월 5일
- **차종별 독립 카운팅**: 
  - 포르쉐 타이칸 4S: 최대 2회
  - 벤츠 EQS 450+: 최대 2회
  - 예: 포르쉐 2회 당첨 → 포르쉐 신청 불가, 벤츠는 가능
- **실시간 체크**: 신청 시 자동으로 당첨 이력 확인
- **관리자 기능**: 당첨자 등록 및 이력 관리

## 🐛 현재 문제

- ❌ 당첨 이력 관리 시스템 없음
- ❌ 무제한 신청 가능
- ❌ 특정 사용자가 독점 가능
- ❌ 공정성 문제 발생

## ✅ 해결 방안

### 1. 데이터 구조

LocalStorage 기반 JSON 형태로 당첨 이력 관리:

```json
[
  {
    "id": 1700000000000,
    "englishId": "hong.gildong",
    "koreanName": "홍길동",
    "carId": "porsche",
    "carName": "포르쉐 타이칸 4S",
    "winningDate": "2025-03-15",
    "createdAt": "2025-03-15T10:30:00.000Z"
  }
]
```

### 2. 핵심 기능

#### 신청 시 자동 체크
```javascript
const checkAnnualWinningLimit = (englishId, carId) => {
  const annualStart = new Date(2025, 0, 6);
  const annualEnd = new Date(2026, 0, 5);
  
  const userCarWinnings = winningHistory.filter(record => 
    record.englishId === englishId && 
    record.carId === carId &&
    new Date(record.winningDate) >= annualStart &&
    new Date(record.winningDate) <= annualEnd
  );

  return {
    count: userCarWinnings.length,
    isLimitReached: userCarWinnings.length >= 2
  };
};
```

#### 관리자 페이지 UI
- 📊 당첨 이력 테이블 (날짜, 이름, ID, 차량)
- ➕ 당첨자 수동 등록 폼
- 🗑️ 삭제 기능
- 📈 통계 표시

#### 사용자 알림
- ❌ 2회 도달: "이미 올해 2회 당첨되셨습니다" (에러 차단)
- ⚠️ 1회 당첨: "1회 더 신청 가능합니다" (안내)

## 🧪 테스트 시나리오

### Case 1: 정상 신청
- 사용자: hong.gildong (포르쉐 0회)
- 신청: 포르쉐
- **결과**: ✅ 신청 성공

### Case 2: 1회 당첨 후 재신청
- 사용자: hong.gildong (포르쉐 1회)
- 신청: 포르쉐
- **결과**: ✅ 신청 성공 "1회 더 신청 가능"

### Case 3: 2회 당첨 후 차단
- 사용자: hong.gildong (포르쉐 2회)
- 신청: 포르쉐
- **결과**: ❌ 신청 차단 "이미 2회 당첨"

### Case 4: 다른 차종 신청
- 사용자: hong.gildong (포르쉐 2회, 벤츠 0회)
- 신청: 벤츠
- **결과**: ✅ 신청 성공 (차종별 독립)

## 📝 구현 체크리스트

### Backend Logic
- [ ] `winningHistory` State 추가
- [ ] LocalStorage 연동 (저장/로드)
- [ ] `checkAnnualWinningLimit()` 함수 구현
- [ ] `addWinningRecord()` 함수 구현
- [ ] 신청 시 당첨 제한 체크 로직
- [ ] 에러 메시지 처리

### UI/UX
- [ ] 관리자 - 당첨 이력 테이블
- [ ] 관리자 - 당첨자 수동 등록 폼
- [ ] 관리자 - 삭제 기능
- [ ] 사용자 - 토스트 알림 개선
- [ ] 이용안내 - 당첨 제한 규정 강조

### Styling
- [ ] `.winning-history-section` 스타일
- [ ] `.winning-table` 테이블 스타일
- [ ] `.add-winning-section` 접기/펼치기
- [ ] 반응형 디자인

## 💡 기술 결정

### 왜 LocalStorage?
- ✅ 즉시 구현 가능 (DB 오버스펙)
- ✅ 별도 서버 불필요
- ✅ 간단한 시스템에 적합
- ⚠️ 제약: 브라우저별 독립 저장

### 향후 개선
- JSON Export/Import 기능
- 서버 API 연동 (Node.js)
- 데이터베이스 마이그레이션

## 🔗 관련 이슈

- #1 카카오모빌리티 브랜드 리브랜딩 (완료)

## 📌 우선순위

**🔴 High** - 공정성 확보를 위한 필수 기능

## 👤 담당자

@iron.man1011

