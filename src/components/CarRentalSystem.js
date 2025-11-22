import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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

  // 신청자 목록 모달
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [applicantsModalData, setApplicantsModalData] = useState(null);

  // 신청 목록
  const [applications, setApplications] = useState([]);

  // 당첨 이력 관리 (연간 차종별 최대 2회 제한)
  const [winningHistory, setWinningHistory] = useState([]);

  // 달력 뷰 필터
  const [selectedCarView, setSelectedCarView] = useState('porsche');
  const [selectedSlotView, setSelectedSlotView] = useState('slot1');

  const cars = [
    {
      id: 'porsche',
      name: '포르쉐 타이칸 4S',
      image: '🏎️',
      specs: {
        type: '전기차',
        range: '407km',
        seats: '4인승',
        transmission: '자동'
      },
      color: '#FF6B6B'
    },
    {
      id: 'benz',
      name: '벤츠 EQS 450+',
      image: '🚗',
      specs: {
        type: '전기차',
        range: '625km',
        seats: '5인승',
        transmission: '자동'
      },
      color: '#4ECDC4'
    }
  ];

  // 로컬 스토리지에서 데이터 불러오기
  useEffect(() => {
    const savedPeriod = localStorage.getItem('rentalPeriod');
    const savedApplications = localStorage.getItem('applications');
    const savedWinningHistory = localStorage.getItem('winningHistory');

    if (savedPeriod) {
      setRentalPeriod(JSON.parse(savedPeriod));
    }
    if (savedApplications) {
      setApplications(JSON.parse(savedApplications));
    }
    if (savedWinningHistory) {
      setWinningHistory(JSON.parse(savedWinningHistory));
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

  useEffect(() => {
    localStorage.setItem('winningHistory', JSON.stringify(winningHistory));
  }, [winningHistory]);

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
      toast.error('시작 날짜와 종료 날짜를 모두 입력해주세요.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('종료 날짜는 시작 날짜보다 이후여야 합니다.');
      return;
    }

    setRentalPeriod({
      startDate,
      endDate,
      createdAt: new Date().toISOString()
    });

    toast.success('대여 기간이 설정되었습니다!');
    setMode('calendar');
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
      toast.error('이름과 아이디를 입력해주세요.');
      return;
    }

    // 연간 차종별 당첨 제한 체크
    const winningCheck = checkAnnualWinningLimit(englishId, modalCarId);
    if (winningCheck.isLimitReached) {
      const carName = cars.find(c => c.id === modalCarId).name;
      toast.error(
        `${carName}은(는) 이미 올해 2회 당첨되셨습니다.\n연간 차종별 최대 2회까지만 당첨 가능합니다. (2025.1.6~2026.1.5)`,
        { autoClose: 5000 }
      );
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
      toast.warning('이미 해당 차량과 시간대에 신청하셨습니다.');
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

    // 신청 성공 시 안내 메시지
    if (winningCheck.count === 1) {
      const carName = cars.find(c => c.id === modalCarId).name;
      toast.success(
        `신청이 완료되었습니다! 🎉\n${carName}은(는) 올해 1회 더 신청 가능합니다.`,
        { autoClose: 4000 }
      );
    } else {
      toast.success('신청이 완료되었습니다! 🎉');
    }

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

  // 연간 차종별 당첨 횟수 체크 (2025.1.6 ~ 2026.1.5 기준)
  const checkAnnualWinningLimit = (englishId, carId) => {
    const currentYear = 2025; // 기준 년도
    const annualStart = new Date(2025, 0, 6); // 2025년 1월 6일
    const annualEnd = new Date(2026, 0, 5);   // 2026년 1월 5일

    // 해당 사용자의 차종별 당첨 이력 조회
    const userCarWinnings = winningHistory.filter(record =>
      record.englishId === englishId &&
      record.carId === carId &&
      new Date(record.winningDate) >= annualStart &&
      new Date(record.winningDate) <= annualEnd
    );

    return {
      count: userCarWinnings.length,
      isLimitReached: userCarWinnings.length >= 2,
      records: userCarWinnings
    };
  };

  // 당첨 이력 추가 (관리자가 추첨 완료 후 호출)
  const addWinningRecord = (englishId, koreanName, carId, carName, date) => {
    const newRecord = {
      id: Date.now(),
      englishId,
      koreanName,
      carId,
      carName,
      winningDate: date,
      createdAt: new Date().toISOString()
    };

    setWinningHistory([...winningHistory, newRecord]);
    return newRecord;
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
          </div>
        )}
      </div>

      {/* 당첨 이력 관리 */}
      <div className="admin-card">
        <h3>🏆 당첨 이력 관리 (연간 차종별 최대 2회)</h3>
        <p className="admin-description">
          추첨 완료 후 당첨자를 등록하면 자동으로 차종별 당첨 횟수가 관리됩니다.<br/>
          <strong>기준 기간:</strong> 2025년 1월 6일 ~ 2026년 1월 5일
        </p>

        <div className="winning-history-section">
          <h4>📊 당첨 이력 ({winningHistory.length}건)</h4>
          {winningHistory.length > 0 ? (
            <div className="winning-history-list">
              <table className="winning-table">
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>이름</th>
                    <th>ID</th>
                    <th>차량</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {winningHistory
                    .sort((a, b) => new Date(b.winningDate) - new Date(a.winningDate))
                    .map(record => (
                      <tr key={record.id}>
                        <td>{new Date(record.winningDate).toLocaleDateString('ko-KR')}</td>
                        <td>{record.koreanName}</td>
                        <td><code>{record.englishId}</code></td>
                        <td>{record.carName}</td>
                        <td>
                          <button
                            className="delete-btn-small"
                            onClick={() => {
                              if (window.confirm('이 당첨 이력을 삭제하시겠습니까?')) {
                                setWinningHistory(winningHistory.filter(r => r.id !== record.id));
                                toast.success('당첨 이력이 삭제되었습니다.');
                              }
                            }}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">등록된 당첨 이력이 없습니다.</p>
          )}

          <details className="add-winning-section">
            <summary className="add-winning-summary">➕ 당첨자 수동 등록</summary>
            <form
              className="add-winning-form"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = {
                  koreanName: formData.get('koreanName'),
                  englishId: formData.get('englishId'),
                  carId: formData.get('carId'),
                  winningDate: formData.get('winningDate')
                };

                const carName = cars.find(c => c.id === data.carId)?.name;
                const check = checkAnnualWinningLimit(data.englishId, data.carId);

                if (check.isLimitReached) {
                  toast.error(`${data.englishId}님은 ${carName} 차종으로 이미 2회 당첨되었습니다.`);
                  return;
                }

                addWinningRecord(data.englishId, data.koreanName, data.carId, carName, data.winningDate);
                toast.success('당첨 이력이 등록되었습니다!');
                e.target.reset();
              }}
            >
              <div className="form-row">
                <div className="form-group">
                  <label>한글 이름</label>
                  <input type="text" name="koreanName" placeholder="홍길동" required />
                </div>
                <div className="form-group">
                  <label>영어 ID</label>
                  <input type="text" name="englishId" placeholder="hong.gildong" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>차량</label>
                  <select name="carId" required>
                    <option value="">선택</option>
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>{car.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>당첨 날짜</label>
                  <input type="date" name="winningDate" required />
                </div>
              </div>
              <button type="submit" className="submit-btn">등록하기</button>
            </form>
          </details>
        </div>
      </div>
    </div>
  );


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

    // 기간 내에 있는지 먼저 확인
    if (!isDateInPeriod(year, month, date)) {
      return null;
    }

    // 주차 번호 계산
    const weekNum = getWeekNumber(targetDate);
    return `${targetDate.getFullYear()}-W${weekNum}`;
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
    const debugInfo = {
      startDate: `${year}/${month+1}/${date}`,
      slotId,
      checks: []
    };

    if (slotId === 'slot1') {
      // 1회차: 월화수목 (4일) 모두 포함되어야 함
      // 월요일부터 목요일까지 확인
      for (let i = 0; i < 4; i++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(startDate.getDate() + i);

        const inPeriod = isDateInPeriod(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
        debugInfo.checks.push({
          day: i,
          date: `${checkDate.getFullYear()}/${checkDate.getMonth()+1}/${checkDate.getDate()}`,
          dayOfWeek: ['일','월','화','수','목','금','토'][checkDate.getDay()],
          inPeriod
        });

        // 각 날짜가 기간 내에 있는지 확인
        if (!inPeriod) {
          console.log('❌ 1회차 불완전:', debugInfo);
          return false;
        }
      }
      console.log('✅ 1회차 완전:', debugInfo);
      return true;
    } else {
      // 2회차: 금토일월 (4일) 모두 포함되어야 함
      // 금요일부터 다음 월요일까지 확인
      for (let i = 0; i < 4; i++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(startDate.getDate() + i);

        const inPeriod = isDateInPeriod(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
        debugInfo.checks.push({
          day: i,
          date: `${checkDate.getFullYear()}/${checkDate.getMonth()+1}/${checkDate.getDate()}`,
          dayOfWeek: ['일','월','화','수','목','금','토'][checkDate.getDay()],
          inPeriod
        });

        // 각 날짜가 기간 내에 있는지 확인
        if (!inPeriod) {
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

  // 특정 날짜가 2회차 종료일인지 확인 (월요일이면서 3일 전이 금요일)
  const isSlot2EndDate = (year, month, date) => {
    const d = new Date(year, month, date);
    if (d.getDay() !== 1) return false; // 월요일이 아니면 false

    // 3일 전 날짜 확인
    const threeDaysBefore = new Date(d);
    threeDaysBefore.setDate(d.getDate() - 3);

    // 3일 전이 금요일이고 기간 내에 있으면 2회차 종료일
    return threeDaysBefore.getDay() === 5 &&
           isDateInPeriod(threeDaysBefore.getFullYear(), threeDaysBefore.getMonth(), threeDaysBefore.getDate());
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
      // 단, 월요일은 2회차 종료일인 경우만 (3일 전이 금요일)
      if (dayOfWeek === 1) {
        // 월요일인 경우 3일 전이 금요일인지 확인
        return isSlot2EndDate(year, month, date);
      }
      return dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
    }
  };

  // 특정 월에 완전한 회차가 있는지 확인
  const hasCompleteSlotInMonth = (year, month) => {
    if (!rentalPeriod) return false;

    // 해당 월의 모든 날짜를 확인
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let date = 1; date <= lastDay; date++) {
      // 1회차 시작일 확인 (월요일)
      if (isSlot1StartDate(year, month, date)) {
        if (isCompleteSlot(year, month, date, 'slot1')) {
          return true;
        }
      }

      // 2회차 시작일 확인 (금요일)
      if (isSlot2StartDate(year, month, date)) {
        if (isCompleteSlot(year, month, date, 'slot2')) {
          return true;
        }
      }
    }

    return false;
  };

  // 달력용 월별 데이터 생성
  const getMonthsInPeriod = () => {
    if (!rentalPeriod) return [];

    const start = new Date(rentalPeriod.startDate);
    const end = new Date(rentalPeriod.endDate);

    // 모든 월을 수집
    const allMonths = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      allMonths.push({
        year: current.getFullYear(),
        month: current.getMonth(),
        key: `${current.getFullYear()}-${current.getMonth()}`
      });
      current.setMonth(current.getMonth() + 1);
    }

    // 완전한 회차가 있는 월만 필터링
    return allMonths.filter(({ year, month }) => {
      return hasCompleteSlotInMonth(year, month);
    });
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
                    // 단순화: 1회차 선택 시 금요일만, 2회차 선택 시 (2회차 종료일이 아닌) 월요일만
                    let isOtherSlotStart = false;
                    if (selectedSlotView === 'slot1') {
                      // 1회차 선택: 금요일만 비활성화
                      isOtherSlotStart = isSlot2Start;
                    } else {
                      // 2회차 선택: 월요일 중에서 2회차 종료일이 아닌 것만 비활성화
                      isOtherSlotStart = isSlot1Start && !isSlot2End;
                    }

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

                    // 디버깅: 월요일이거나 금요일인 경우 상세 정보 출력
                    if ((isSlot1Start || isSlot2Start) && day.isCurrentMonth) {
                      console.log(`🔍 디버깅 [${selectedSlotView}] - ${day.year}/${day.month+1}/${day.date} (${['일','월','화','수','목','금','토'][dayOfWeek]}):`, {
                        선택회차: selectedSlotView,
                        월요일: isSlot1Start,
                        금요일: isSlot2Start,
                        시작일인식: isStartDate,
                        주차ID: weekId,
                        기간내: isInPeriod,
                        완전회차: isComplete,
                        회차2종료일: isSlot2End,
                        다른회차시작일: isOtherSlotStart,
                        클릭가능: isClickable
                      });
                    }

                    // 다른 날짜 비활성화 (시작일, 종료일, 기간 내가 아닌 경우)
                    const isInactive = isInPeriod && day.isCurrentMonth && !isStartDate && !isEndDate && !isInSlotRange;

                    return (
                      <div
                        key={idx}
                        className={`calendar-day 
                          ${!day.isCurrentMonth ? 'other-month' : ''} 
                          ${!isInPeriod ? 'out-of-period' : ''} 
                          ${isWeekend ? 'weekend' : ''} 
                          ${isOtherSlotStart && isInPeriod && !isClickable ? 'other-slot' : ''}
                          ${isStartDate && isInPeriod && isComplete ? 'start-date' : ''} 
                          ${isStartDate && isInPeriod && !isComplete ? 'incomplete-slot' : ''}
                          ${isEndDate && isInPeriod && isCompleteEnd ? 'end-date' : ''}
                          ${isInSlotRange && isInPeriod ? 'in-range' : ''}
                          ${isClickable ? 'clickable' : ''} 
                          ${isInactive ? 'inactive-date' : ''}`}
                        onClick={() => {
                          console.log('🖱️ 클릭 이벤트 발생!', {
                            날짜: `${day.year}/${day.month+1}/${day.date}`,
                            isClickable,
                            weekId,
                            회차: selectedSlotView
                          });
                          if (isClickable) {
                            console.log('✅ 모달 열기 시도...');
                            handleDateClick(weekId, selectedSlotView, selectedCarView, new Date(day.year, day.month, day.date));
                          } else {
                            console.warn('❌ 클릭 불가 - isClickable이 false입니다');
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
                          <div
                            className="day-content"
                            onClick={() => {
                              if (applicants.length > 0) {
                                // 신청자가 있으면 목록 모달 표시
                                setApplicantsModalData({
                                  weekId: week.id,
                                  slotId: selectedSlotView,
                                  carId: selectedCarView,
                                  carName: cars.find(c => c.id === selectedCarView)?.name,
                                  slotName: selectedSlotView === 'slot1' ? '1회차' : '2회차',
                                  startDate: slotStartDate,
                                  applicants: applicants
                                });
                                setShowApplicantsModal(true);
                              } else {
                                // 신청자가 없으면 신청 모달 열기
                                handleDateClick(week.id, selectedSlotView, selectedCarView, slotStartDate);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {applicants.length > 0 ? (
                              <>
                                <div className={`applicant-count ${
                                  applicants.length >= 5 ? 'high-competition' : 
                                  applicants.length >= 3 ? 'medium-competition' : 
                                  'low-competition'
                                }`}>
                                  {applicants.length >= 5 ? '🔥' :
                                   applicants.length >= 3 ? '⚡' :
                                   '✨'} {applicants.length}명 신청
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
          <div className="legend-competition">
            <h5>🎯 신청자 수 표시</h5>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-badge high">🔥 5명 이상</span>
                <span>높은 경쟁 (빨강)</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge medium">⚡ 3-4명</span>
                <span>중간 경쟁 (주황)</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge low">✨ 1-2명</span>
                <span>낮은 경쟁 (초록)</span>
              </div>
            </div>
          </div>
          <p className="legend-note">
            * <strong>1회차</strong>: 월화수목 4일 모두 포함되어야 신청 가능<br/>
            * <strong>2회차</strong>: 금토일월 4일 모두 포함되어야 신청 가능<br/>
            * <strong>선발</strong>: 각 시간대당 1명만 선발됩니다
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="car-rental-container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <header className="header">
        <div className="logo-section">
          <div className="kakao-logo">🚕</div>
          <div className="header-text">
            <h1>카카오모빌리티</h1>
            <p className="header-subtitle">차량 대여 시스템</p>
          </div>
        </div>
        <div className="nav-buttons">
          <button
            className={`nav-btn ${mode === 'admin' ? 'active' : ''}`}
            onClick={() => setMode('admin')}
          >
            ⚙️ 관리자
          </button>
          <button
            className={`nav-btn ${mode === 'calendar' ? 'active' : ''}`}
            onClick={() => setMode('calendar')}
          >
            📅 대여 신청
          </button>
        </div>
      </header>

      <div className="main-content">
        {mode === 'admin' && renderAdminPage()}
        {mode === 'calendar' && renderCalendarPage()}
      </div>

      {/* 신청 모달 */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            onClick={handleCloseModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="modal-header">
                <h2>🚗 차량 신청하기</h2>
                <button className="modal-close" onClick={handleCloseModal}>×</button>
              </div>

              <div className="modal-body">
                <div className="modal-info">
                  <div className="modal-info-item">
                    <span className="info-label">차량</span>
                    <span className="info-value">{cars.find(c => c.id === modalCarId)?.image} {cars.find(c => c.id === modalCarId)?.name}</span>
                  </div>
                  <div className="modal-info-item">
                    <span className="info-label">회차</span>
                    <span className="info-value">{modalSlotId === 'slot1' ? '1회차 (월 18:00 ~ 목 18:00)' : '2회차 (금 10:00 ~ 월 10:00)'}</span>
                  </div>
                  <div className="modal-info-item">
                    <span className="info-label">날짜</span>
                    <span className="info-value">{selectedDate ? new Date(selectedDate).toLocaleDateString('ko-KR') : ''}</span>
                  </div>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 신청자 목록 모달 */}
      <AnimatePresence>
        {showApplicantsModal && applicantsModalData && (
          <motion.div
            className="modal-overlay"
            onClick={() => setShowApplicantsModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content applicants-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="modal-header">
                <h2>📋 신청자 목록</h2>
                <button className="modal-close" onClick={() => setShowApplicantsModal(false)}>×</button>
              </div>

              <div className="modal-body">
                <div className="modal-info">
                  <div className="modal-info-item">
                    <span className="info-label">차량</span>
                    <span className="info-value">
                      {cars.find(c => c.id === applicantsModalData.carId)?.image} {applicantsModalData.carName}
                    </span>
                  </div>
                  <div className="modal-info-item">
                    <span className="info-label">회차</span>
                    <span className="info-value">
                      {applicantsModalData.slotName} ({applicantsModalData.slotId === 'slot1' ? '월 18:00 ~ 목 18:00' : '금 10:00 ~ 월 10:00'})
                    </span>
                  </div>
                  <div className="modal-info-item">
                    <span className="info-label">시작일</span>
                    <span className="info-value">
                      {new Date(applicantsModalData.startDate).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className="modal-info-item">
                    <span className="info-label">신청 인원</span>
                    <span className="info-value">
                      <strong>{applicantsModalData.applicants.length}명</strong>
                    </span>
                  </div>
                </div>

                <div className="applicants-list">
                  <h4>신청자 명단</h4>
                  <div className="applicants-table-wrapper">
                    <table className="applicants-table">
                      <thead>
                        <tr>
                          <th>번호</th>
                          <th>영어 ID</th>
                          <th>신청 시간</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applicantsModalData.applicants
                          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                          .map((app, index) => (
                            <tr key={app.id}>
                              <td>{index + 1}</td>
                              <td><code>{app.englishId}</code></td>
                              <td>{new Date(app.createdAt).toLocaleString('ko-KR')}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="submit-btn"
                    onClick={() => {
                      setShowApplicantsModal(false);
                      handleDateClick(
                        applicantsModalData.weekId,
                        applicantsModalData.slotId,
                        applicantsModalData.carId,
                        applicantsModalData.startDate
                      );
                    }}
                  >
                    나도 신청하기
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowApplicantsModal(false)}
                  >
                    닫기
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="info-section">
        <h3>📋 이용 안내</h3>
        <div className="info-highlight">
          <div className="info-row">
            <span className="info-label">👥 이용대상</span>
            <span className="info-value">카카오모빌리티 크루</span>
          </div>
          <div className="info-row">
            <span className="info-label">📅 이용기간</span>
            <span className="info-value">4일 (1회차: 월 18:00~목 18:00 / 2회차: 금 10:00~월 10:00)</span>
          </div>
          <div className="info-row">
            <span className="info-label">💰 이용료</span>
            <span className="info-value">회차당 30,000원 (급여공제)</span>
          </div>
          <div className="info-row">
            <span className="info-label">🎲 선정방법</span>
            <span className="info-value">추첨제 (연간 차종별 최대 2회 당첨)</span>
          </div>
        </div>

        <details className="info-details">
          <summary className="info-summary">📖 상세 이용규정 보기</summary>
          <div className="info-content">
            <div className="info-section-detail">
              <h4>💵 비용 안내</h4>
              <ul>
                <li><strong>회사 부담:</strong> 전기 충전비용, 하이패스 요금</li>
                <li><strong>사용자 부담:</strong> 주차요금, 충전 후 점거수수료, 교통위반 벌금/과태료</li>
                <li><strong>차량사고:</strong> 수리비 200만원 이상 시 자기부담금 최대 50만원, 200만원 미만은 수리비의 20%, 랩핑비용 100%</li>
                <li className="warning">⚠️ 충전 후 즉시 출차하지 않으면 고액의 점거수수료가 발생합니다</li>
              </ul>
            </div>

            <div className="info-section-detail">
              <h4>📌 이용 제한</h4>
              <ul>
                <li><strong>연간 이용기간:</strong> 2025년 1월 6일 ~ 2026년 1월 5일</li>
                <li className="warning">⚠️ <strong>차종별 최대 2회까지만 당첨 가능</strong> (예: 포르쉐 2회 당첨 시 해당 연도 내 포르쉐 신청 불가, 벤츠는 가능)</li>
                <li>당첨 후 8일 이내 취소 시 연간 이용횟수 차감</li>
                <li>타인 양도 불가 (반납은 경영지원팀에 신청)</li>
              </ul>
            </div>

            <div className="info-section-detail">
              <h4>🚗 운전 자격</h4>
              <ul>
                <li><strong>만 24세 이상</strong> 카카오모빌리티 임직원만 운전 가능</li>
                <li><strong>실제 운전 경력 1년 이상</strong> 권장</li>
                <li className="warning">⚠️ 임직원 외 동승자 운전 절대 불가 (사고 시 보험 미적용)</li>
                <li className="warning">⚠️ 안전운전에 자신이 없으면 신청하지 마세요</li>
              </ul>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default CarRentalSystem;

