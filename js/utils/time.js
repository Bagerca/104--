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
    // Считаем время в секундах для идеальной плавности полосы прогресса
    const currentTotalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const currentMinutes = Math.floor(currentTotalSeconds / 60);

    for (let i = 0; i < bellsData.length; i++) {
        const bell = bellsData[i];
        const startMins = parseTimeToMinutes(bell.start);
        const endMins = parseTimeToMinutes(bell.end);
        
        const startSecs = startMins * 60;
        const endSecs = endMins * 60;

        // 1. Состояние: До начала этой пары или большая перемена
        if (currentTotalSeconds < startSecs) {
            if (i === 0) return { status: 'before_classes', nextPair: bell, timeToNext: startMins - currentMinutes };
            
            const prevEndSecs = parseTimeToMinutes(bellsData[i - 1].end) * 60;
            if (currentTotalSeconds >= prevEndSecs) {
                return { status: 'break', nextPair: bell, timeToNext: startMins - currentMinutes };
            }
        }

        // 2. Состояние: Внутри пары (Проверяем 45-минутки и 5-минутную переменку)
        if (currentTotalSeconds >= startSecs && currentTotalSeconds <= endSecs) {
            if (bell.lesson1 && bell.lesson2) {
                const l1StartSecs = parseTimeToMinutes(bell.lesson1.start) * 60;
                const l1EndSecs = parseTimeToMinutes(bell.lesson1.end) * 60;
                const l2StartSecs = parseTimeToMinutes(bell.lesson2.start) * 60;
                const l2EndSecs = parseTimeToMinutes(bell.lesson2.end) * 60;

                // Урок 1
                if (currentTotalSeconds <= l1EndSecs) {
                    const progressPercent = ((currentTotalSeconds - l1StartSecs) / (l1EndSecs - l1StartSecs)) * 100;
                    return { status: 'active_lesson1', currentPair: bell, timeLeft: Math.ceil((l1EndSecs - currentTotalSeconds)/60), progressPercent };
                } 
                // 5-минутная перемена
                else if (currentTotalSeconds < l2StartSecs) {
                    const progressPercent = ((currentTotalSeconds - l1EndSecs) / (l2StartSecs - l1EndSecs)) * 100;
                    return { status: 'short_break', currentPair: bell, timeLeft: Math.ceil((l2StartSecs - currentTotalSeconds)/60), progressPercent };
                } 
                // Урок 2
                else {
                    const progressPercent = ((currentTotalSeconds - l2StartSecs) / (l2EndSecs - l2StartSecs)) * 100;
                    return { status: 'active_lesson2', currentPair: bell, timeLeft: Math.ceil((l2EndSecs - currentTotalSeconds)/60), progressPercent };
                }
            }
            
            // Фолбэк, если в JSON вдруг нет разбивки на lesson1 и lesson2
            const progressPercent = ((currentTotalSeconds - startSecs) / (endSecs - startSecs)) * 100;
            return { status: 'active', currentPair: bell, timeLeft: endMins - currentMinutes, progressPercent };
        }
    }
    
    // Если прошли все циклы и текущее время больше конца последней пары
    return { status: 'ended' };
}