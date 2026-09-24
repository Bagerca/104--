/* =====================================================================
   FILE: js/views/ScheduleView.js
===================================================================== */
import { ApiService } from '../services/api.js';
import { getCurrentScheduleStatus, getDateStringForDay, formatMinutes } from '../utils/time.js';
import { PrefsManager } from '../utils/prefs.js';

export class ScheduleView {
    constructor(container) {
        this.container = container;
        this.liveTimerId = null;
        this.cached = { widgetContainer: null, timeEl: null, progressEl: null, pairCards: [] };
        this.currentWidgetState = null; 
        this.isMounted = false;
        this.state = {
            bells: [], base: {}, currentDayNum: 1, selectedDay: 1,
            selectedDayOverride: null, todayOverride: null, showActual: true
        };
        
        this.touchStartX = 0;
        this.touchStartY = 0;
    }

    async mount() {
        this.isMounted = true;
        this.container.innerHTML = `
            <div class="skeleton" style="height: 120px; width: 100%; margin-bottom: 24px;"></div>
            <div class="skeleton" style="height: 50px; width: 100%; margin-bottom: 24px;"></div>
            <div class="skeleton" style="height: 80px; width: 100%; margin-bottom: 12px;"></div>
        `;
        
        try {
            const [bells, baseSchedule] = await Promise.all([
                ApiService.getBells(),
                ApiService.getSchedule()
            ]);

            if (!this.isMounted) return;

            this.state.bells = bells || [];
            this.state.base = baseSchedule || {};
            
            const currentDayReal = new Date().getDay();
            this.state.currentDayNum = (currentDayReal >= 1 && currentDayReal <= 5) ? currentDayReal : 1;
            this.state.selectedDay = this.state.currentDayNum;

            const todayStr = getDateStringForDay(this.state.currentDayNum);
            this.state.todayOverride = await ApiService.getOverride(todayStr);

            if (!this.isMounted) return;

            this.renderLayout();
            this.bindEvents();
            this.bindSwipeEvents();
            
            await this.loadSelectedDayData();
            if (!this.isMounted) return;

            this.fullRenderUI();
            this.liveTimerId = setInterval(() => this.refreshLiveState(), 1000);
            
        } catch (error) {
            if (!this.isMounted) return;
            console.error('[ScheduleView] Ошибка:', error);
            this.container.innerHTML = `<div class="placeholder-card">Ошибка загрузки расписания.</div>`;
        }
    }

    unmount() {
        this.isMounted = false;
        if (this.liveTimerId) clearInterval(this.liveTimerId);
        this.cached = { widgetContainer: null, timeEl: null, progressEl: null, pairCards: [] };
        this.currentWidgetState = null;
    }

    renderLayout() {
        this.container.innerHTML = `
            <section id="live-widget-container"></section>
            
            <div class="schedule-controls-container">
                <nav class="days-wrapper">
                    <div class="days-group" role="tablist">
                        ${[1,2,3,4,5].map(d => `
                            <button class="day-tab ${this.state.selectedDay === d ? 'active' : ''} ${this.state.currentDayNum === d ? 'today' : ''}" data-day="${d}">
                                ${['ПН','ВТ','СР','ЧТ','ПТ'][d-1]}
                            </button>
                        `).join('')}
                    </div>
                </nav>

                <div class="segmented-control" id="schedule-toggle-container" data-active="actual" style="display: none;">
                    <div class="segment-slider"></div>
                    <button class="segment-btn" data-type="base">Обычное</button>
                    <button class="segment-btn active" data-type="actual">Фактическое</button>
                </div>
            </div>

            <ul id="schedule-list" class="schedule-list"></ul>
        `;
        this.cached.widgetContainer = document.getElementById('live-widget-container');
    }

    async changeDay(newDay, direction) {
        if (newDay < 1 || newDay > 5 || newDay === this.state.selectedDay) return;
        
        PrefsManager.vibrate(15);
        this.state.selectedDay = newDay;

        this.container.querySelectorAll('.day-tab').forEach(t => {
            t.classList.toggle('active', parseInt(t.getAttribute('data-day')) === newDay);
        });

        const listContainer = document.getElementById('schedule-list');
        listContainer.classList.add('updating');

        await this.loadSelectedDayData();
        if (!this.isMounted) return;

        this.fullRenderUI();

        listContainer.classList.remove('slide-left', 'slide-right');
        void listContainer.offsetWidth;
        listContainer.classList.add(direction === 'left' ? 'slide-left' : 'slide-right');
        listContainer.classList.remove('updating');
    }

    bindSwipeEvents() {
        const area = document.getElementById('schedule-list'); 
        
        area.addEventListener('touchstart', e => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        area.addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            
            const diffX = touchEndX - this.touchStartX;
            const diffY = touchEndY - this.touchStartY;
            const threshold = 50; 
            
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
                if (diffX < -threshold) {
                    this.changeDay(this.state.selectedDay + 1, 'right'); 
                } else if (diffX > threshold) {
                    this.changeDay(this.state.selectedDay - 1, 'left');
                }
            }
        }, { passive: true });
    }

    bindEvents() {
        this.container.querySelectorAll('.day-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetDay = parseInt(e.currentTarget.getAttribute('data-day'));
                const direction = targetDay > this.state.selectedDay ? 'right' : 'left';
                this.changeDay(targetDay, direction);
            });
        });

        this.container.querySelectorAll('.segment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                PrefsManager.vibrate();
                if (!this.state.selectedDayOverride) return;
                this.state.showActual = e.currentTarget.dataset.type === 'actual';
                this.fullRenderUI();
            });
        });
    }

    async loadSelectedDayData() {
        const dateStr = getDateStringForDay(this.state.selectedDay);
        this.state.selectedDayOverride = await ApiService.getOverride(dateStr);
        this.state.showActual = !!this.state.selectedDayOverride;
    }

    fullRenderUI() {
        if (!this.isMounted) return;
        const { selectedDayOverride, showActual, selectedDay, base, bells } = this.state;
        const toggleContainer = document.getElementById('schedule-toggle-container');
        
        if (selectedDayOverride) {
            toggleContainer.style.display = 'flex';
            toggleContainer.setAttribute('data-active', showActual ? 'actual' : 'base');
            this.container.querySelectorAll('.segment-btn').forEach(btn => {
                btn.classList.toggle('active', (btn.dataset.type === 'actual' && showActual) || (btn.dataset.type === 'base' && !showActual));
            });
        } else {
            toggleContainer.style.display = 'none';
        }

        const listData = (showActual && selectedDayOverride) ? selectedDayOverride.lessons : (base[selectedDay] || []);
        this.generateListDOM(listData, bells);
        
        this.currentWidgetState = null; 
        this.refreshLiveState();
    }

    generateListDOM(dayScheduleArray, bellsData) {
        const listContainer = document.getElementById('schedule-list');
        if (!dayScheduleArray || dayScheduleArray.length === 0) {
            listContainer.innerHTML = `<li class="placeholder-card" style="text-align:center; list-style:none; color: var(--text-muted)">Пар нет</li>`;
            this.cached.pairCards = [];
            return;
        }

        const userSubgroup = PrefsManager.getPrefs().subgroup;
        const isSubjectVisible = (subjectName) => {
            if (!subjectName) return true; 
            const str = subjectName.toLowerCase();
            if (userSubgroup === '1' && (str.includes('2г') || str.includes('2 п/г') || str.includes('2 группа'))) return false;
            if (userSubgroup === '2' && (str.includes('1г') || str.includes('1 п/г') || str.includes('1 группа'))) return false;
            return true;
        };

        listContainer.innerHTML = dayScheduleArray.map(pairItem => {
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
                        <span class="pair-subject" style="font-style: italic;">Подгруппа отдыхает (Окно)</span>
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
        
        this.cached.pairCards = Array.from(listContainer.querySelectorAll('.pair-card'));
    }

    getSmartStatus() {
        let status = getCurrentScheduleStatus(this.state.bells);
        const todaySchedule = this.state.todayOverride ? this.state.todayOverride.lessons : (this.state.base[this.state.currentDayNum] || []);
        
        if (todaySchedule.length === 0) return { status: 'no_classes' };
        const maxPair = Math.max(...todaySchedule.map(l => l.pair));

        if ((status.status.startsWith('active') || status.status === 'short_break') && status.currentPair.pair > maxPair) return { status: 'ended' };
        if (status.status === 'break' && status.nextPair.pair > maxPair) return { status: 'ended' };

        if (status.status.startsWith('active') || status.status === 'short_break') {
             const currentPairData = todaySchedule.find(l => l.pair === status.currentPair.pair);
             if (!currentPairData) return { ...status, status: 'window', windowType: 'full_pair' };
             
             if (status.status === 'active_lesson1' && (currentPairData.lesson1 === null || currentPairData.subject === null)) {
                 return { ...status, status: 'window', windowType: 'lesson1', currentPairData };
             }
             if (status.status === 'active_lesson2' && (currentPairData.lesson2 === null || currentPairData.subject === null)) {
                 return { ...status, status: 'window', windowType: 'lesson2', currentPairData };
             }
             status.currentPairData = currentPairData;
        }

        if (status.status === 'break' || status.status === 'before_classes') {
            status.nextPairData = todaySchedule.find(l => l.pair === status.nextPair.pair);
        }
        
        return status;
    }

    getLessonDetails(pairData, lessonNum) {
        if (!pairData) return { subj: 'Урок', room: '' };
        if (lessonNum === 1 && pairData.lesson1) return { subj: pairData.lesson1.subject, room: pairData.lesson1.room || '' };
        if (lessonNum === 2 && pairData.lesson2) return { subj: pairData.lesson2.subject, room: pairData.lesson2.room || '' };
        return { subj: pairData.subject || 'Урок', room: pairData.room || '' };
    }

    renderWidgetHTML(status) {
        if (!this.cached.widgetContainer) return;
        const currentDayReal = new Date().getDay();
        if (currentDayReal === 0 || currentDayReal === 6) {
            this.cached.widgetContainer.innerHTML = `<article class="live-widget widget-idle"><div class="live-subject" style="margin:0; text-align:center;">Выходной</div></article>`;
            return;
        }

        if (status.status === 'no_classes' || status.status === 'ended') {
            const txt = status.status === 'ended' ? 'Пары закончились' : 'Пар нет';
            this.cached.widgetContainer.innerHTML = `<article class="live-widget widget-success"><div class="live-status-group" style="justify-content: center;"><div class="pulse-dot"></div><span class="live-status">${txt}</span></div></article>`;
        } 
        else if (status.status === 'window') {
            this.cached.widgetContainer.innerHTML = `<article class="live-widget widget-idle"><div class="live-header"><div class="live-status-group"><div class="pulse-dot"></div><span class="live-status">Окно (Свободно)</span></div><span class="live-time" id="widget-time">${formatMinutes(status.timeLeft)}</span></div><div class="live-subject" style="margin:0;">Свободное время</div><div class="progress-track" style="margin-top: 16px;"><div class="progress-fill" id="widget-progress" style="width: ${status.progressPercent}%; background: var(--text-muted);"></div></div></article>`;
        } 
        else if (status.status === 'short_break') {
            const nextLsn = this.getLessonDetails(status.currentPairData, 2);
            const roomTxt = nextLsn.room ? ` &bull; ${nextLsn.room}` : '';
            this.cached.widgetContainer.innerHTML = `<article class="live-widget widget-break"><div class="live-header"><div class="live-status-group"><div class="pulse-dot"></div><span class="live-status">Мини-перемена</span></div><span class="live-time" id="widget-time">${formatMinutes(status.timeLeft)}</span></div><div class="live-subject" style="margin-bottom: 16px; font-size: 1rem; color: var(--text-secondary);">След: <span style="color:var(--text-primary);">${nextLsn.subj}</span>${roomTxt}</div><div class="progress-track"><div class="progress-fill" id="widget-progress" style="width: ${status.progressPercent}%; background: #2196F3;"></div></div></article>`;
        } 
        else if (status.status.startsWith('active')) {
            const isLsn1 = status.status === 'active_lesson1';
            const num = isLsn1 ? 1 : 2;
            const lsn = this.getLessonDetails(status.currentPairData, num);
            const roomTxt = lsn.room ? ` &bull; ${lsn.room}` : '';
            this.cached.widgetContainer.innerHTML = `<article class="live-widget widget-active"><div class="live-header"><div class="live-status-group"><div class="pulse-dot"></div><span class="live-status">Урок ${num} (Пара ${status.currentPair.pair})</span></div><span class="live-time" id="widget-time">${formatMinutes(status.timeLeft)}</span></div><div class="live-subject" style="margin-bottom: 6px;">${lsn.subj}</div><div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">${roomTxt ? `Аудитория: ${lsn.room}` : ''}</div><div class="progress-track"><div class="progress-fill" id="widget-progress" style="width: ${status.progressPercent}%"></div></div></article>`;
        } 
        else if (status.status === 'break') {
            const nextLsn = this.getLessonDetails(status.nextPairData, 1);
            const roomTxt = nextLsn.room ? ` &bull; ${nextLsn.room}` : '';
            this.cached.widgetContainer.innerHTML = `<article class="live-widget widget-break"><div class="live-header"><div class="live-status-group"><div class="pulse-dot"></div><span class="live-status">Перемена</span></div><span class="live-time" id="widget-time">${formatMinutes(status.timeToNext)}</span></div><div class="live-subject" style="margin:0; font-size: 1rem; color: var(--text-secondary);">След: <span style="color:var(--text-primary);">${nextLsn.subj}</span>${roomTxt}</div></article>`;
        } 
        else {
            const nextLsn = this.getLessonDetails(status.nextPairData, 1);
            const roomTxt = nextLsn.room ? ` &bull; ${nextLsn.room}` : '';
            this.cached.widgetContainer.innerHTML = `<article class="live-widget widget-idle"><div class="live-header"><div class="live-status-group"><div class="pulse-dot"></div><span class="live-status">До начала занятий</span></div><span class="live-time" id="widget-time">${formatMinutes(status.timeToNext)}</span></div>${nextLsn.subj !== 'Урок' ? `<div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 8px;">Первая: ${nextLsn.subj}${roomTxt}</div>` : ''}</article>`;
        }
        
        this.cached.timeEl = document.getElementById('widget-time');
        this.cached.progressEl = document.getElementById('widget-progress');
    }

    refreshLiveState() {
        if (!this.isMounted) return;
        if (new Date().getDay() === 0 || new Date().getDay() === 6) return;
        
        const status = this.getSmartStatus();
        let stateSignature = status.status;
        if (status.currentPair) stateSignature += `_p${status.currentPair.pair}`;
        if (status.nextPair) stateSignature += `_n${status.nextPair.pair}`;
        if (status.windowType) stateSignature += `_w${status.windowType}`;
        
        if (this.currentWidgetState !== stateSignature) {
            this.renderWidgetHTML(status);
            this.currentWidgetState = stateSignature;
            this.updatePairCardsHighlight(status); 
        } else {
            if (this.cached.timeEl) {
                const newTimeText = (status.status.startsWith('active') || status.status === 'window' || status.status === 'short_break') ? formatMinutes(status.timeLeft) : formatMinutes(status.timeToNext);
                if (this.cached.timeEl.textContent !== newTimeText) this.cached.timeEl.textContent = newTimeText;
            }
            if (this.cached.progressEl && (status.status.startsWith('active') || status.status === 'window' || status.status === 'short_break')) {
                this.cached.progressEl.style.width = `${status.progressPercent}%`;
            }
        }
    }

    updatePairCardsHighlight(status) {
        if (this.state.selectedDay !== this.state.currentDayNum) return;
        this.cached.pairCards.forEach(card => {
            const pNum = parseInt(card.getAttribute('data-pair'));
            card.classList.remove('current', 'past');
            const isActiveBlock = status.status.startsWith('active') || status.status === 'window' || status.status === 'short_break';
            
            if (isActiveBlock && status.currentPair && status.currentPair.pair === pNum) card.classList.add('current');
            else if (isActiveBlock && status.currentPair && pNum < status.currentPair.pair) card.classList.add('past');
            else if (status.status === 'ended' || (status.status === 'break' && status.nextPair && pNum < status.nextPair.pair)) card.classList.add('past');
        });
    }
}