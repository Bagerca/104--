/* =====================================================================
   FILE: js/utils/time.js
===================================================================== */
export function parseTimeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

export function formatMinutes(totalMinutes) {
    if (totalMinutes < 60) return `${totalMinutes} мин`;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

export function getDateStringForDay(targetDayNum) {
    const now = new Date();
    let currentDay = now.getDay();
    if (currentDay === 0) currentDay = 7; 
    
    const monday = new Date(now);
    
    if (currentDay > 5) {
        monday.setDate(now.getDate() + (8 - currentDay));
    } else {
        monday.setDate(now.getDate() - (currentDay - 1));
    }
    
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + (targetDayNum - 1));
    
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const yyyy = targetDate.getFullYear();
    
    return `${dd}-${mm}-${yyyy}`;
}

export function getPlural(number, one, two, five) {
    let n = Math.abs(number);
    n %= 100;
    if (n >= 5 && n <= 20) return five;
    n %= 10;
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return two;
    return five;
}

// Единый вычислитель для праздников и дней рождений (Формат ДД.ММ)
export function getHolidayStatus(dateStr) {
    const now = new Date();
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Парсим простую строку вида "31.07"
    const [dayStr, monthStr] = dateStr.split('.');
    const month = parseInt(monthStr, 10) - 1; // Месяцы в JS начинаются с 0
    const day = parseInt(dayStr, 10);

    // Создаем дату (текущий год, нужный месяц и день, 00:00:00)
    let target = new Date(now.getFullYear(), month, day, 0, 0, 0);

    // Если дата в этом году УЖЕ прошла — перекидываем событие на следующий год
    if (target.getTime() < nowDay.getTime()) {
        target.setFullYear(now.getFullYear() + 1);
    }

    const isToday = nowDay.getTime() === new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const diffMs = target.getTime() - now.getTime();

    const diffTotalMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffTotalMins / 60);
    const diffMins = diffTotalMins % 60;
    
    // Округляем вверх, так как если осталось 25 часов, это "2 дня"
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let timeText = '';
    
    if (isToday) {
        timeText = 'Сегодня!';
    } else if (diffHours >= 0 && diffHours < 24 && diffDays <= 1) {
        // Осталось меньше 24 часов до полуночи — включаем точные часы и минуты
        timeText = `${diffHours} ч ${diffMins} мин`;
    } else {
        timeText = `${diffDays} ${getPlural(diffDays, 'день', 'дня', 'дней')}`;
    }

    return { isToday, diffMs, diffDays, timeText, targetDate: target };
}

export function getCurrentScheduleStatus(bellsData) {
    const now = new Date();
    const currentTotalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const currentMinutes = Math.floor(currentTotalSeconds / 60);

    for (let i = 0; i < bellsData.length; i++) {
        const bell = bellsData[i];
        const startMins = parseTimeToMinutes(bell.start);
        const endMins = parseTimeToMinutes(bell.end);
        
        const startSecs = startMins * 60;
        const endSecs = endMins * 60;

        if (currentTotalSeconds < startSecs) {
            if (i === 0) return { status: 'before_classes', nextPair: bell, timeToNext: startMins - currentMinutes };
            
            const prevEndSecs = parseTimeToMinutes(bellsData[i - 1].end) * 60;
            if (currentTotalSeconds >= prevEndSecs) {
                const progressPercent = ((currentTotalSeconds - prevEndSecs) / (startSecs - prevEndSecs)) * 100;
                return { status: 'break', nextPair: bell, timeToNext: startMins - currentMinutes, progressPercent };
            }
        }

        if (currentTotalSeconds >= startSecs && currentTotalSeconds <= endSecs) {
            if (bell.lesson1 && bell.lesson2) {
                const l1StartSecs = parseTimeToMinutes(bell.lesson1.start) * 60;
                const l1EndSecs = parseTimeToMinutes(bell.lesson1.end) * 60;
                const l2StartSecs = parseTimeToMinutes(bell.lesson2.start) * 60;
                const l2EndSecs = parseTimeToMinutes(bell.lesson2.end) * 60;

                if (currentTotalSeconds <= l1EndSecs) {
                    const progressPercent = ((currentTotalSeconds - l1StartSecs) / (l1EndSecs - l1StartSecs)) * 100;
                    return { status: 'active_lesson1', currentPair: bell, timeLeft: Math.ceil((l1EndSecs - currentTotalSeconds)/60), progressPercent };
                } 
                else if (currentTotalSeconds < l2StartSecs) {
                    const progressPercent = ((currentTotalSeconds - l1EndSecs) / (l2StartSecs - l1EndSecs)) * 100;
                    return { status: 'short_break', currentPair: bell, timeLeft: Math.ceil((l2StartSecs - currentTotalSeconds)/60), progressPercent };
                } 
                else {
                    const progressPercent = ((currentTotalSeconds - l2StartSecs) / (l2EndSecs - l2StartSecs)) * 100;
                    return { status: 'active_lesson2', currentPair: bell, timeLeft: Math.ceil((l2EndSecs - currentTotalSeconds)/60), progressPercent };
                }
            }
            
            const progressPercent = ((currentTotalSeconds - startSecs) / (endSecs - startSecs)) * 100;
            return { status: 'active', currentPair: bell, timeLeft: endMins - currentMinutes, progressPercent };
        }
    }
    
    return { status: 'ended' };
}