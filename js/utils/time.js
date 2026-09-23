/* =====================================================================
   FILE: js/utils/time.js
   ОПТИМИЗАЦИЯ: Добавлено форматирование времени (ЧЧ:ММ)
===================================================================== */
export function parseTimeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// НОВАЯ ФУНКЦИЯ: Красивое форматирование времени
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
    
    let diff = targetDayNum - currentDay;
    if (currentDay > 5) diff += 7;
    
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const yyyy = targetDate.getFullYear();
    
    return `${dd}-${mm}-${yyyy}`;
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
            if (currentTotalSeconds >= prevEndSecs) return { status: 'break', nextPair: bell, timeToNext: startMins - currentMinutes };
        }

        if (currentTotalSeconds >= startSecs && currentTotalSeconds <= endSecs) {
            const progressPercent = ((currentTotalSeconds - startSecs) / (endSecs - startSecs)) * 100;
            return { status: 'active', currentPair: bell, timeLeft: endMins - currentMinutes, progressPercent };
        }
    }
    return { status: 'ended' };
}