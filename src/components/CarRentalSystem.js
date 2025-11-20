import React, { useState, useEffect } from 'react';
import './CarRentalSystem.css';

const CarRentalSystem = () => {
  // 모드: 'admin' | 'calendar'
  const [mode, setMode] = useState('calendar');

  // 관리자 설정
  const [rentalPeriod, setRentalPeriod] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 사용자 신청 (모달용)
  const [koreanName, setKoreanName] = useState('');
  const [englishId, setEnglishId] = useState('');

  // 모달 관련
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalWeekId, setModalWeekId] = useState('');
  const [modalSlotId, setModalSlotId] = useState('');
  const [modalCarId, setModalCarId] = useState('');

  // 신청 목록
  const [applications, setApplications] = useState([]);

  // 달력 뷰 필터
  const [selectedCarView, setSelectedCarView] = useState('porsche');
  const [selectedSlotView, setSelectedSlotView] = useState('slot1');

  const cars = [
    { id: 'porsche', name: '포르쉐 타이칸 4S', image: '🏎️' },
    { id: 'benz', name: '벤츠 EQS 450+', image: '🚗' }
  ];

  // 로컬 스토리지에서 데이터 불러오기
  useEffect(() => {
    const savedPeriod = localStorage.getItem('rentalPeriod');
    const savedApplications = localStorage.getItem('applications');

    if (savedPeriod) {
      setRentalPeriod(JSON.parse(savedPeriod));
    }
    if (savedApplications) {
      setApplications(JSON.parse(savedApplications));
    }
  }, []);

  // 데이터 저장
  useEffect(() => {
    if (rentalPeriod) {
      localStorage.setItem('rentalPeriod', JSON.stringify(rentalPeriod));
    }
  }, [rentalPeriod]);

  useEffect(() => {
    localStorage.setItem('applications', JSON.stringify(applications));
  }, [applications]);

  // 주차 정보 생성
  const getWeeksInPeriod = () => {
    if (!rentalPeriod) return [];

    const start = new Date(rentalPeriod.startDate);
    const end = new Date(rentalPeriod.endDate);
    const weeks = [];

    let current = new Date(start);
    current.setDate(current.getDate() - current.getDay() + 1); // 월요일로 조정

    while (current <= end) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);

      weeks.push({
        id: `${weekStart.getFullYear()}-W${getWeekNumber(weekStart)}`,
        weekNumber: getWeekNumber(weekStart),
        year: weekStart.getFullYear(),
        startDate: weekStart,
        endDate: weekEnd,
        display: `${weekStart.getMonth() + 1}/${weekStart.getDate()} ~ ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
      });

      current.setDate(current.getDate() + 7);
    }

    return weeks;
  };

  function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  // 관리자: 기간 설정
  const handleSetPeriod = (e) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      alert('시작 날짜와 종료 날짜를 모두 입력해주세요.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('종료 날짜는 시작 날짜보다 이후여야 합니다.');
      return;
    }

    setRentalPeriod({
      startDate,
      endDate,
      createdAt: new Date().toISOString()
    });

    alert('대여 기간이 설정되었습니다!');
    setMode('user');
  };

  // 달력 날짜 클릭 핸들러
  const handleDateClick = (weekId, slotId, carId, date) => {
    setModalWeekId(weekId);
    setModalSlotId(slotId);
    setModalCarId(carId);
    setSelectedDate(date);
    setShowModal(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowModal(false);
    setKoreanName('');
    setEnglishId('');
    setSelectedDate(null);
    setModalWeekId('');
    setModalSlotId('');
    setModalCarId('');
  };

  // 모달에서 신청하기
  const handleSubmitFromModal = (e) => {
    e.preventDefault();

    if (!koreanName || !englishId) {
      alert('이름과 아이디를 입력해주세요.');
      return;
    }

    // 중복 신청 확인
    const duplicate = applications.find(
      app => app.englishId === englishId &&
             app.weekId === modalWeekId &&
             app.slotId === modalSlotId &&
             app.carId === modalCarId
    );

    if (duplicate) {
      alert('이미 해당 차량과 시간대에 신청하셨습니다.');
      return;
    }

    const newApplication = {
      id: Date.now(),
      koreanName,
      englishId,
      carId: modalCarId,
      carName: cars.find(c => c.id === modalCarId).name,
      weekId: modalWeekId,
      slotId: modalSlotId,
      slotName: modalSlotId === 'slot1' ? '1회차' : '2회차',
      createdAt: new Date().toISOString()
    };

    setApplications([...applications, newApplication]);
    alert('신청이 완료되었습니다!');
    handleCloseModal();
  };

  // 경쟁률 계산
  const getCompetitionRate = (weekId, slotId, carId) => {
    const count = applications.filter(
      app => app.weekId === weekId && app.slotId === slotId && app.carId === carId
    ).length;
    return count;
  };

  // 신청자 목록
  const getApplicants = (weekId, slotId, carId) => {
    return applications.filter(
      app => app.weekId === weekId && app.slotId === slotId && app.carId === carId
    );
  };

  // 가장 가까운 이전 월요일 또는 금요일 찾기
  const findPreviousMondayOrFriday = (date) => {
    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0: 일, 1: 월, 2: 화, 3: 수, 4: 목, 5: 금, 6: 토

    if (dayOfWeek === 1 || dayOfWeek === 5) {
      return d; // 이미 월요일 또는 금요일
    }

    // 이전 금요일 찾기
    let daysToFriday;
    if (dayOfWeek === 0) daysToFriday = 2; // 일요일
    else if (dayOfWeek === 6) daysToFriday = 1; // 토요일
    else if (dayOfWeek < 5) daysToFriday = dayOfWeek; // 화~목
    else daysToFriday = 0;

    const previousFriday = new Date(d);
    previousFriday.setDate(d.getDate() - daysToFriday);

    // 이전 월요일 찾기
    let daysToMonday;
    if (dayOfWeek === 0) daysToMonday = 6; // 일요일
    else daysToMonday = dayOfWeek - 1; // 나머지

    const previousMonday = new Date(d);
    previousMonday.setDate(d.getDate() - daysToMonday);

    // 더 가까운 날짜 반환 (금요일이 월요일보다 가까우면 금요일)
    return daysToFriday < daysToMonday ? previousFriday : previousMonday;
  };

  // 가장 가까운 다음 월요일 또는 목요일 찾기
  const findNextMondayOrThursday = (date) => {
    const d = new Date(date);
    const dayOfWeek = d.getDay();

    if (dayOfWeek === 1 || dayOfWeek === 4) {
      return d; // 이미 월요일 또는 목요일
    }

    // 다음 월요일까지 일수
    let daysToMonday;
    if (dayOfWeek === 0) daysToMonday = 1; // 일요일
    else daysToMonday = 8 - dayOfWeek; // 나머지

    // 다음 목요일까지 일수
    let daysToThursday;
    if (dayOfWeek === 0) daysToThursday = 4; // 일요일
    else if (dayOfWeek < 4) daysToThursday = 4 - dayOfWeek; // 월~수
    else daysToThursday = 11 - dayOfWeek; // 금~토

    const nextMonday = new Date(d);
    nextMonday.setDate(d.getDate() + daysToMonday);

    const nextThursday = new Date(d);
    nextThursday.setDate(d.getDate() + daysToThursday);

    // 더 가까운 날짜 반환
    return daysToThursday < daysToMonday ? nextThursday : nextMonday;
  };

  // 추천 날짜 생성
  const getRecommendedDates = () => {
    if (!startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const recommendedStart = findPreviousMondayOrFriday(start);
    const recommendedEnd = findNextMondayOrThursday(end);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(recommendedStart),
      endDate: formatDate(recommendedEnd),
      startDay: ['일', '월', '화', '수', '목', '금', '토'][recommendedStart.getDay()],
      endDay: ['일', '월', '화', '수', '목', '금', '토'][recommendedEnd.getDay()]
    };
  };

  const recommended = getRecommendedDates();

  // 관리자 페이지
  const renderAdminPage = () => (
    <div className="admin-container">
      <h2>🔐 관리자 페이지</h2>
      <div className="admin-card">
        <h3>대여 기간 설정</h3>
        <form onSubmit={handleSetPeriod} className="period-form">
          <div className="form-group">
            <label>시작 날짜</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>종료 날짜</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          {/* 추천 날짜 표시 */}
          {recommended && (startDate !== recommended.startDate || endDate !== recommended.endDate) && (
            <div className="recommendation-box">
              <h4>💡 추천 날짜</h4>
              <p className="recommendation-reason">
                1회차(월~목)와 2회차(금~월)를 완전하게 운영하기 위한 최적의 날짜입니다.
              </p>
              <div className="recommendation-dates">
                <div className="recommendation-item">
                  <span className="recommendation-label">시작:</span>
                  <span className="recommendation-date">
                    {new Date(recommended.startDate).toLocaleDateString('ko-KR')} ({recommended.startDay})
                  </span>
                </div>
                <div className="recommendation-item">
                  <span className="recommendation-label">종료:</span>
                  <span className="recommendation-date">
                    {new Date(recommended.endDate).toLocaleDateString('ko-KR')} ({recommended.endDay})
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="apply-recommendation-btn"
                onClick={() => {
                  setStartDate(recommended.startDate);
                  setEndDate(recommended.endDate);
                }}
              >
                추천 날짜 적용
              </button>
            </div>
          )}

          <button type="submit" className="submit-btn">
            기간 설정하기
          </button>
        </form>

        {rentalPeriod && (
          <div className="current-period">
            <h4>현재 설정된 기간</h4>
            <p>
              {new Date(rentalPeriod.startDate).toLocaleDateString('ko-KR')}
              ({['일', '월', '화', '수', '목', '금', '토'][new Date(rentalPeriod.startDate).getDay()]})
              {' ~ '}
              {new Date(rentalPeriod.endDate).toLocaleDateString('ko-KR')}
              ({['일', '월', '화', '수', '목', '금', '토'][new Date(rentalPeriod.endDate).getDay()]})
            </p>
            <p style={{fontSize: '0.9em', color: '#666', marginTop: '10px'}}>
              디버그: 시작일 {rentalPeriod.startDate} / 종료일 {rentalPeriod.endDate}
            </p>
          </div>
        )}
      </div>
    </div>
  );


  // 달력용 월별 데이터 생성
  const getMonthsInPeriod = () => {
    if (!rentalPeriod) return [];

    const start = new Date(rentalPeriod.startDate);
    const end = new Date(rentalPeriod.endDate);

    // 시작일과 종료일이 같은 달인지 확인
    const isSameMonth = start.getFullYear() === end.getFullYear() &&
                        start.getMonth() === end.getMonth();

    // 같은 달이면 해당 달만 반환
    if (isSameMonth) {
      return [{
        year: start.getFullYear(),
        month: start.getMonth(),
        key: `${start.getFullYear()}-${start.getMonth()}`
      }];
    }

    // 다른 달이지만, 시작 달의 달력에 종료일이 포함되는지 확인
    // 달력은 6주(42일) 구조이므로, 다음 달 첫 주까지 표시됨
    const startMonthLastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const startMonthLastDayOfWeek = startMonthLastDay.getDay();

    // 시작 달 달력에서 마지막으로 표시되는 다음 달 날짜 계산
    const daysFromNextMonth = startMonthLastDayOfWeek === 6 ? 0 : (6 - startMonthLastDayOfWeek);
    const lastVisibleDate = new Date(start.getFullYear(), start.getMonth() + 1, daysFromNextMonth);

    // 종료일이 시작 달 달력에 표시되는 범위 내에 있으면 시작 달만 표시
    if (end <= lastVisibleDate) {
      return [{
        year: start.getFullYear(),
        month: start.getMonth(),
        key: `${start.getFullYear()}-${start.getMonth()}`
      }];
    }

    // 다른 달이면 모든 달 반환
    const months = [];

    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth(),
        key: `${current.getFullYear()}-${current.getMonth()}`
      });
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  };

  // 특정 월의 캘린더 날짜들 생성
  const getCalendarDays = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayOfWeek = firstDay.getDay();
    const lastDate = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();

    const days = [];

    // 이전 달 날짜들
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevLastDate - i,
        month: month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false
      });
    }

    // 현재 달 날짜들
    for (let i = 1; i <= lastDate; i++) {
      days.push({
        date: i,
        month: month,
        year: year,
        isCurrentMonth: true
      });
    }

    // 다음 달 날짜들 (6주 완성)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false
      });
    }

    return days;
  };

  // 특정 날짜의 주차 ID 가져오기
  const getWeekIdForDate = (year, month, date) => {
    const targetDate = new Date(year, month, date);
    const weeks = getWeeksInPeriod();

    for (const week of weeks) {
      if (targetDate >= week.startDate && targetDate <= week.endDate) {
        return week.id;
      }
    }
    return null;
  };

  // 관리자 설정 기간 내의 날짜인지 확인
  const isDateInPeriod = (year, month, date) => {
    if (!rentalPeriod) return false;

    // 시간을 00:00:00으로 초기화하여 날짜만 비교
    const targetDate = new Date(year, month, date);
    targetDate.setHours(0, 0, 0, 0);

    const startDate = new Date(rentalPeriod.startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(rentalPeriod.endDate);
    endDate.setHours(0, 0, 0, 0);

    return targetDate >= startDate && targetDate <= endDate;
  };

  // 특정 날짜가 1회차 시작일인지 확인 (월요일)
  const isSlot1StartDate = (year, month, date) => {
    const d = new Date(year, month, date);
    return d.getDay() === 1; // 월요일
  };

  // 특정 날짜가 2회차 시작일인지 확인 (금요일)
  const isSlot2StartDate = (year, month, date) => {
    const d = new Date(year, month, date);
    return d.getDay() === 5; // 금요일
  };

  // 특정 주차의 회차가 완전한지 확인
  const isCompleteSlot = (year, month, date, slotId) => {
    if (!rentalPeriod) return false;

    const startDate = new Date(year, month, date);

    if (slotId === 'slot1') {
      // 1회차: 월화수목 (4일) 모두 포함되어야 함
      // 월요일부터 목요일까지 확인
      for (let i = 0; i < 4; i++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(startDate.getDate() + i);

        // 각 날짜가 기간 내에 있는지 확인
        if (!isDateInPeriod(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate())) {
          return false;
        }
      }
      return true;
    } else {
      // 2회차: 금토일월 (4일) 모두 포함되어야 함
      // 금요일부터 다음 월요일까지 확인
      for (let i = 0; i < 4; i++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(startDate.getDate() + i);

        // 각 날짜가 기간 내에 있는지 확인
        if (!isDateInPeriod(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate())) {
          return false;
        }
      }
      return true;
    }
  };

  // 특정 날짜가 1회차 종료일인지 확인 (목요일)
  const isSlot1EndDate = (year, month, date) => {
    const d = new Date(year, month, date);
    return d.getDay() === 4; // 목요일
  };

  // 특정 날짜가 2회차 종료일인지 확인 (월요일)
  const isSlot2EndDate = (year, month, date) => {
    const d = new Date(year, month, date);
    return d.getDay() === 1; // 월요일
  };

  // 특정 날짜가 선택된 회차의 기간 내에 있는지 확인
  const isInSlotPeriod = (year, month, date, slotId) => {
    const targetDate = new Date(year, month, date);
    const dayOfWeek = targetDate.getDay();

    if (slotId === 'slot1') {
      // 1회차: 월(1) ~ 목(4)
      return dayOfWeek >= 1 && dayOfWeek <= 4;
    } else {
      // 2회차: 금(5) ~ 일(0) + 월(1)
      return dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0 || dayOfWeek === 1;
    }
  };

  // 달력 페이지
  const renderCalendarPage = () => {
    if (!rentalPeriod) {
      return (
        <div className="no-period">
          <h2>⏳ 대여 기간이 설정되지 않았습니다</h2>
        </div>
      );
    }

    const months = getMonthsInPeriod();

    return (
      <div className="calendar-container">
        <h2>📅 신청 현황 달력</h2>

        {/* 차량 및 회차 필터 */}
        <div className="calendar-filters">
          <div className="filter-group">
            <label>차량 선택:</label>
            <div className="filter-buttons">
              {cars.map(car => (
                <button
                  key={car.id}
                  className={`filter-btn ${selectedCarView === car.id ? 'active' : ''}`}
                  onClick={() => setSelectedCarView(car.id)}
                >
                  {car.image} {car.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>회차 선택:</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${selectedSlotView === 'slot1' ? 'active' : ''}`}
                onClick={() => setSelectedSlotView('slot1')}
              >
                1회차 (월~목)
              </button>
              <button
                className={`filter-btn ${selectedSlotView === 'slot2' ? 'active' : ''}`}
                onClick={() => setSelectedSlotView('slot2')}
              >
                2회차 (금~월)
              </button>
            </div>
            <p className="filter-hint">
              💡 선택한 회차의 시작일만 달력에 표시됩니다
            </p>
          </div>
        </div>

        {/* 월별 캘린더 */}
        <div className="months-container">
          {months.map(({ year, month, key }) => {
            const days = getCalendarDays(year, month);

            return (
              <div key={key} className="month-calendar">
                <div className="month-header">
                  <h3>{year}년 {month + 1}월</h3>
                </div>

                <div className="calendar-grid">
                  {/* 요일 헤더 */}
                  <div className="day-header">일</div>
                  <div className="day-header">월</div>
                  <div className="day-header">화</div>
                  <div className="day-header">수</div>
                  <div className="day-header">목</div>
                  <div className="day-header">금</div>
                  <div className="day-header">토</div>

                  {/* 날짜 셀 */}
                  {days.map((day, idx) => {
                    const isInPeriod = isDateInPeriod(day.year, day.month, day.date);
                    const weekId = getWeekIdForDate(day.year, day.month, day.date);

                    // 1회차 시작일/종료일인지 (월요일/목요일)
                    const isSlot1Start = isSlot1StartDate(day.year, day.month, day.date);
                    const isSlot1End = isSlot1EndDate(day.year, day.month, day.date);

                    // 2회차 시작일/종료일인지 (금요일/월요일)
                    const isSlot2Start = isSlot2StartDate(day.year, day.month, day.date);
                    const isSlot2End = isSlot2EndDate(day.year, day.month, day.date);

                    // 선택된 회차의 시작일/종료일인지
                    const isStartDate = selectedSlotView === 'slot1' ? isSlot1Start : isSlot2Start;
                    const isEndDate = selectedSlotView === 'slot1' ? isSlot1End : isSlot2End;

                    // 회차가 완전한지 확인 (월화수목 또는 금토일월 모두 포함)
                    const isComplete = isStartDate ? isCompleteSlot(day.year, day.month, day.date, selectedSlotView) : false;

                    // 종료일이 완전한 회차에 속하는지 확인 (시작일로부터 3일 후)
                    let isCompleteEnd = false;
                    if (isEndDate && isInPeriod) {
                      // 3일 전 날짜가 시작일인지 확인
                      const startDateCandidate = new Date(day.year, day.month, day.date);
                      startDateCandidate.setDate(startDateCandidate.getDate() - 3);

                      const candidateIsStartDate = selectedSlotView === 'slot1'
                        ? isSlot1StartDate(startDateCandidate.getFullYear(), startDateCandidate.getMonth(), startDateCandidate.getDate())
                        : isSlot2StartDate(startDateCandidate.getFullYear(), startDateCandidate.getMonth(), startDateCandidate.getDate());

                      if (candidateIsStartDate) {
                        isCompleteEnd = isCompleteSlot(startDateCandidate.getFullYear(), startDateCandidate.getMonth(), startDateCandidate.getDate(), selectedSlotView);
                      }
                    }

                    // 선택된 회차의 기간 내에 있는지 (시작일과 종료일 제외한 중간 날짜)
                    const isInSlotRange = isInSlotPeriod(day.year, day.month, day.date, selectedSlotView) && !isStartDate && !isEndDate;

                    // 선택되지 않은 회차의 시작일인지 (비활성화용)
                    const isOtherSlotStart = selectedSlotView === 'slot1' ? isSlot2Start : isSlot1Start;

                    const applicants = weekId
                      ? getApplicants(weekId, selectedSlotView, selectedCarView)
                      : [];
                    const rate = weekId
                      ? getCompetitionRate(weekId, selectedSlotView, selectedCarView)
                      : 0;

                    const dayOfWeek = new Date(day.year, day.month, day.date).getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    // 클릭 가능: 선택된 회차의 시작일이고, 기간 내이고, 현재 달이고, 회차가 완전한 경우만
                    const isClickable = isStartDate && weekId && day.isCurrentMonth && isInPeriod && isComplete;

                    // 다른 날짜 비활성화 (시작일, 종료일, 기간 내가 아닌 경우)
                    const isInactive = isInPeriod && day.isCurrentMonth && !isStartDate && !isEndDate && !isInSlotRange;

                    return (
                      <div
                        key={idx}
                        className={`calendar-day 
                          ${!day.isCurrentMonth ? 'other-month' : ''} 
                          ${!isInPeriod ? 'out-of-period' : ''} 
                          ${isWeekend ? 'weekend' : ''} 
                          ${isStartDate && isInPeriod && isComplete ? 'start-date' : ''} 
                          ${isStartDate && isInPeriod && !isComplete ? 'incomplete-slot' : ''}
                          ${isEndDate && isInPeriod && isCompleteEnd ? 'end-date' : ''}
                          ${isInSlotRange && isInPeriod ? 'in-range' : ''}
                          ${isClickable ? 'clickable' : ''} 
                          ${isInactive ? 'inactive-date' : ''}
                          ${isOtherSlotStart && isInPeriod ? 'other-slot' : ''}`}
                        onClick={() => {
                          if (isClickable) {
                            handleDateClick(weekId, selectedSlotView, selectedCarView, new Date(day.year, day.month, day.date));
                          }
                        }}
                      >
                        <div className="day-number">{day.date}</div>

                        {/* 종료일 표시 - 완전한 회차의 종료일만 */}
                        {isEndDate && isInPeriod && isCompleteEnd && (
                          <div className="end-marker">종료</div>
                        )}

                        {/* 시작일 내용 - 완전한 회차만 표시 */}
                        {isStartDate && isInPeriod && isComplete && (
                          <div className="day-content">
                            {applicants.length > 0 ? (
                              <>
                                <div className="competition-badge">{rate}:1</div>
                                <div className="applicants-preview">
                                  {applicants.slice(0, 3).map((app, i) => (
                                    <div key={app.id} className="applicant-mini">
                                      {app.koreanName}
                                    </div>
                                  ))}
                                  {applicants.length > 3 && (
                                    <div className="more-applicants">+{applicants.length - 3}</div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="click-hint">클릭하여 신청</div>
                            )}
                          </div>
                        )}


                        {/* 화살표 표시 (기간 내 날짜) */}
                        {isInSlotRange && isInPeriod && (
                          <div className="range-arrow">→</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="calendar-legend">
          <h4>📌 범례</h4>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-box start-date"></div>
              <span>시작일 (클릭하여 신청)</span>
            </div>
            <div className="legend-item">
              <div className="legend-box in-range"></div>
              <span>대여 기간 (→ 화살표)</span>
            </div>
            <div className="legend-item">
              <div className="legend-box end-date"></div>
              <span>종료일</span>
            </div>
            <div className="legend-item">
              <div className="legend-box incomplete"></div>
              <span>불완전한 회차 (회색)</span>
            </div>
          </div>
          <p className="legend-note">
            * <strong>1회차</strong>: 월화수목 4일 모두 포함되어야 신청 가능<br/>
            * <strong>2회차</strong>: 금토일월 4일 모두 포함되어야 신청 가능<br/>
            * 불완전한 회차는 회색 처리되며 신청할 수 없습니다
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="car-rental-container">
      <header className="header">
        <h1>🚗 회사 차량 대여 시스템</h1>
        <div className="nav-buttons">
          <button
            className={`nav-btn ${mode === 'admin' ? 'active' : ''}`}
            onClick={() => setMode('admin')}
          >
            🔐 관리자
          </button>
          <button
            className={`nav-btn ${mode === 'calendar' ? 'active' : ''}`}
            onClick={() => setMode('calendar')}
          >
            📅 달력 보기
          </button>
        </div>
      </header>

      <div className="main-content">
        {mode === 'admin' && renderAdminPage()}
        {mode === 'calendar' && renderCalendarPage()}
      </div>

      {/* 신청 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚗 차량 신청하기</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-info">
                <p><strong>차량:</strong> {cars.find(c => c.id === modalCarId)?.image} {cars.find(c => c.id === modalCarId)?.name}</p>
                <p><strong>회차:</strong> {modalSlotId === 'slot1' ? '1회차 (월 18:00 ~ 목 18:00)' : '2회차 (금 10:00 ~ 월 10:00)'}</p>
                <p><strong>날짜:</strong> {selectedDate ? new Date(selectedDate).toLocaleDateString('ko-KR') : ''}</p>
              </div>

              <form onSubmit={handleSubmitFromModal}>
                <div className="form-group">
                  <label>한글 이름 *</label>
                  <input
                    type="text"
                    value={koreanName}
                    onChange={(e) => setKoreanName(e.target.value)}
                    placeholder="홍길동"
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>영어 아이디 *</label>
                  <input
                    type="text"
                    value={englishId}
                    onChange={(e) => setEnglishId(e.target.value)}
                    placeholder="hong.gildong"
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                    취소
                  </button>
                  <button type="submit" className="submit-btn">
                    신청하기
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="info-section">
        <h3>📋 이용 안내</h3>
        <ul>
          <li><strong>관리자</strong>: 대여 시작/종료 날짜를 설정합니다</li>
          <li><strong>달력 클릭</strong>: 원하는 날짜를 클릭하여 바로 신청할 수 있습니다</li>
          <li><strong>1회차</strong>: 월 18:00 ~ 목 18:00 (월요일 클릭)</li>
          <li><strong>2회차</strong>: 금 10:00 ~ 월 10:00 (금요일 클릭)</li>
          <li>차량/회차 필터를 선택 후 해당 시작일을 클릭하세요</li>
        </ul>
      </div>
    </div>
  );
};

export default CarRentalSystem;

