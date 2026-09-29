import { formatMinutes } from '../utils/time.js';

export const ScheduleTemplate = {
    renderList(dayScheduleArray, bellsData, userSubgroup) {
        if (!dayScheduleArray || dayScheduleArray.length === 0) {
            return `<li class="placeholder-card" style="text-align:center; list-style:none; color: var(--text-muted)">Пар нет</li>`;
        }

        const isSubjectVisible = (subjectName) => {
            if (!subjectName) return true; 
            const str = subjectName.toLowerCase();
            if (userSubgroup === '1' && (str.includes('2г') || str.includes('2 п/г') || str.includes('2 группа'))) return false;
            if (userSubgroup === '2' && (str.includes('1г') || str.includes('1 п/г') || str.includes('1 группа'))) return false;
            return true;
        };

        return dayScheduleArray.map(pairItem => {
            const bell = bellsData.find(b => b.pair === pairItem.pair);
            const l1Time = bell?.lesson1 ? `${bell.lesson1.start} - ${bell.lesson1.end}` : '';
            const l2Time = bell?.lesson2 ? `${bell.lesson2.start} - ${bell.lesson2.end}` : '';
            const l1Subj = pairItem.lesson1 ? pairItem.lesson1.subject : (pairItem.subject || '');
            const l2Subj = pairItem.lesson2 ? pairItem.lesson2.subject : (pairItem.subject || '');

            const hasL1 = (pairItem.lesson1 !== null && pairItem.subject !== null) && isSubjectVisible(l1Subj);
            const hasL2 = (pairItem.lesson2 !== null && pairItem.subject !== null) && isSubjectVisible(l2Subj);

            const l1Room = pairItem.lesson1 ? pairItem.lesson1.room : (pairItem.room || '');
            const l2Room = pairItem.lesson2 ? pairItem.lesson2.room : (pairItem.room || '');

            const renderRow = (hasLesson, num, time, subj, room) => hasLesson ? `
                <div class="lesson-row">
                    <div class="lesson-details">
                        <span class="lesson-num">Урок ${num} &bull; ${time}</span>
                        <span class="pair-subject">${subj}</span>
                    </div>
                    ${room ? `<span class="pair-room">${room}</span>` : ''}
                </div>` : `
                <div class="lesson-row" style="opacity: 0.4;">
                    <div class="lesson-details">
                        <span class="lesson-num">Урок ${num} &bull; ${time}</span>
                        <span class="pair-subject" style="font-style: italic;">Окно (Отдых)</span>
                    </div>
                </div>`;

            return `
                <li class="pair-card" data-pair="${pairItem.pair}">
                    <div class="pair-time">
                        <div class="number">${pairItem.pair} пара</div>
                        <div class="hours">${bell ? `${bell.start} - ${bell.end}` : ''}</div>
                    </div>
                    <div class="pair-info">
                        ${renderRow(hasL1, pairItem.pair * 2 - 1, l1Time, l1Subj, l1Room)}
                        <div class="lesson-divider"></div>
                        ${renderRow(hasL2, pairItem.pair * 2, l2Time, l2Subj, l2Room)}
                    </div>
                </li>
            `;
        }).join('');
    },

    getLessonDetails(pairData, lessonNum) {
        if (!pairData) return { subj: 'Урок', room: '' };
        if (lessonNum === 1 && pairData.lesson1) return { subj: pairData.lesson1.subject, room: pairData.lesson1.room || '' };
        if (lessonNum === 2 && pairData.lesson2) return { subj: pairData.lesson2.subject, room: pairData.lesson2.room || '' };
        return { subj: pairData.subject || 'Урок', room: pairData.room || '' };
    },

    renderWidget(status) {
        if (status.status === 'weekend') {
            return `<article class="live-widget widget-idle"><div class="live-subject" style="margin:0; text-align:center;">Выходной</div></article>`;
        }
        if (status.status === 'no_classes' || status.status === 'ended') {
            const txt = status.status === 'ended' ? 'Пары закончились' : 'Пар нет';
            return `<article class="live-widget widget-success"><div class="live-status-group" style="justify-content: center;"><div class="pulse-dot"></div><span class="live-status">${txt}</span></div></article>`;
        } 
        if (status.status === 'window') {
            return `<article class="live-widget widget-idle"><div class="live-header"><div class="live-status-group"><div class="pulse-dot"></div><span class="live-status">Окно (Свободно)</span></div><span class="live-time" id="widget-time">${formatMinutes(status.timeLeft)}</span></div><div class="live-subject" style="margin:0;">Свободное время</div><div class="progress-track" style="margin-top: 16px;"><div class="progress-fill" id="widget-progress" style="width: ${status.progressPercent}%; background: var(--text-muted);"></div></div></article>`;
        } 
        if (status.status === 'short_break') {
            const nextLsn = this.getLessonDetails(status.currentPairData, 2);
            return `<article class="live-widget widget-break"><div class="live-header"><div class="live-status-group"><div class="pulse-dot"></div><span class="live-status">Мини-перемена</span></div><span class="live-time" id="widget-time">${formatMinutes(status.timeLeft)}</span></div><div class="live-subject" style="margin-bottom: 16px; font-size: 1rem; color: var(--text-secondary);">След: <span style="color:var(--text-primary);">${nextLsn.subj}</span>${nextLsn.room ? ` &bull; ${nextLsn.room}` : ''}</div><div class="progress-track"><div class="progress-fill" id="widget-progress" style="width: ${status.progressPercent}%; background: #2196F3;"></div></div></article>`;
        } 
        if (status.status.startsWith('active')) {
            const num = status.status === 'active_lesson1' ? 1 : 2;
            const lsn = this.getLessonDetails(status.currentPairData, num);
            return `<article class="live-widget widget-active"><div class="live-header"><div class="live-status-group"><div class="pulse-dot"></div><span class="live-status">Урок ${num} (Пара ${status.currentPair.pair})</span></div><span class="live-time" id="widget-time">${formatMinutes(status.timeLeft)}</span></div><div class="live-subject" style="margin-bottom: 6px;">${lsn.subj}</div><div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">${lsn.room ? `Аудитория: ${lsn.room}` : ''}</div><div class="progress-track"><div class="progress-fill" id="widget-progress" style="width: ${status.progressPercent}%"></div></div></article>`;
        } 
        if (status.status === 'break') {
            const nextLsn = this.getLessonDetails(status.nextPairData, 1);
            return `<article class="live-widget widget-break"><div class="live-header"><div class="live-status-group"><div class="pulse-dot"></div><span class="live-status">Перемена</span></div><span class="live-time" id="widget-time">${formatMinutes(status.timeToNext)}</span></div><div class="live-subject" style="margin-bottom: 16px; font-size: 1rem; color: var(--text-secondary);">След: <span style="color:var(--text-primary);">${nextLsn.subj}</span>${nextLsn.room ? ` &bull; ${nextLsn.room}` : ''}</div><div class="progress-track"><div class="progress-fill" id="widget-progress" style="width: ${status.progressPercent}%; background: #2196F3;"></div></div></article>`;
        } 
        
        const nextLsn = this.getLessonDetails(status.nextPairData, 1);
        return `<article class="live-widget widget-idle"><div class="live-header"><div class="live-status-group"><div class="pulse-dot"></div><span class="live-status">До начала</span></div><span class="live-time" id="widget-time">${formatMinutes(status.timeToNext)}</span></div>${nextLsn.subj !== 'Урок' ? `<div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 8px;">Первая: ${nextLsn.subj}</div>` : ''}</article>`;
    }
};