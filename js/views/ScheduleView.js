/* =====================================================================
   FILE: js/views/ScheduleView.js
===================================================================== */
import { ApiService } from '../services/api.js';
import { getCurrentScheduleStatus, getDateStringForDay, parseTimeToMinutes } from '../utils/time.js';

const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(30);
};

export class ScheduleView {
    constructor(container) {
        this.container = container;
        this.liveTimerId = null;
        this.state = {
            bells: [], base: {}, currentDayNum: 1, selectedDay: 1,
            selectedDayOverride: null, todayOverride: null, showActual: true
        };
    }

    async mount() {
        this.container.innerHTML = `
            <div class="skeleton" style="height: 120px; width: 100%; margin-bottom: 24px;"></div>
            <div class="skeleton" style="height: 50px; width: 100%; margin-bottom: 24px;"></div>
            <div class="skeleton" style="height: 80px; width: 100%; margin-bottom: 12px;"></div>
            <div class="skeleton" style="height: 80px; width: 100%;"></div>
        `;
        
        try {
            const [bells, baseSchedule] = await Promise.all([
                ApiService.getBells(),
                ApiService.getSchedule()
            ]);

            this.state.bells = bells || [];
            this.state.base = baseSchedule || {};
            
            const currentDayReal = new Date().getDay();
            this.state.currentDayNum = (currentDayReal >= 1 && currentDayReal <= 5) ? currentDayReal : 1;
            this.state.selectedDay = this.state.currentDayNum;

            const todayStr = getDateStringForDay(this.state.currentDayNum);
            this.state.todayOverride = await ApiService.getOverride(todayStr);

            this.renderLayout();
            this.bindEvents();
            await this.loadSelectedDayData();
            this.fullRenderUI();

            this.liveTimerId = setInterval(() => this.refreshLiveState(), 1000);
        } catch (error) {
            console.error('[ScheduleView] Ошибка монтирования:', error);
            this.container.innerHTML = `<div class="placeholder-card">Ошибка загрузки расписания.</div>`;
        }
    }

    unmount() {
        if (this.liveTimerId) {
            clearInterval(this.liveTimerId);
            this.liveTimerId = null;
        }
    }

    renderLayout() {
        this.container.innerHTML = `
            <section id="live-widget-container"></section>
            
            <div class="schedule-controls-container">
                <nav class="days-wrapper">
                    <div class="days-group" role="tablist">
                        ${[1,2,3,4,5].map(d => `
                            <button class="day-tab ${this.state.selectedDay === d ? 'active' : ''} ${this.state.currentDayNum === d ? 'today' : ''}" 
                                    data-day="${d}" role="tab">
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
    }

    bindEvents() {
        this.container.querySelectorAll('.day-tab').forEach(tab => {
            tab.addEventListener('click', async (e) => {
                triggerHaptic();
                this.container.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                
                const listContainer = document.getElementById('schedule-list');
                listContainer.classList.add('updating');

                this.state.selectedDay = parseInt(target.getAttribute('data-day'));
                await this.loadSelectedDayData();
                this.fullRenderUI();
                
                setTimeout(() => listContainer.classList.remove('updating'), 150);
            });
        });

        this.container.querySelectorAll('.segment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                triggerHaptic();
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
        const { selectedDayOverride, showActual, selectedDay, base, bells } = this.state;
        const toggleContainer = document.getElementById('schedule-toggle-container');
        
        if (selectedDayOverride) {
            toggleContainer.style.display = 'flex';
            toggleContainer.setAttribute('data-active', showActual ? 'actual' : 'base');
            
            this.container.querySelectorAll('.segment-btn').forEach(btn => {
                btn.classList.toggle('active', 
                    (btn.dataset.type === 'actual' && showActual) || 
                    (btn.dataset.type === 'base' && !showActual)
                );
            });
        } else {
            toggleContainer.style.display = 'none';
        }

        const listData = (showActual && selectedDayOverride) ? selectedDayOverride.lessons : (base[selectedDay] || []);
        
        this.generateListDOM(listData, bells);
        this.updateLiveWidget();
        this.refreshLiveState();
    }

    generateListDOM(dayScheduleArray, bellsData) {
        const listContainer = document.getElementById('schedule-list');
        if (!dayScheduleArray || dayScheduleArray.length === 0) {
            listContainer.innerHTML = `<li class="placeholder-card" style="text-align:center; list-style:none; color: var(--text-muted)">Пар нет</li>`;
            return;
        }

        listContainer.innerHTML = dayScheduleArray.map(pairItem => {
            const bell = bellsData.find(b => b.pair === pairItem.pair);
            const l1Time = bell?.lesson1 ? `${bell.lesson1.start} - ${bell.lesson1.end}` : '';
            const l2Time = bell?.lesson2 ? `${bell.lesson2.start} - ${bell.lesson2.end}` : '';

            const hasL1 = pairItem.lesson1 !== null;
            const l1Subj = pairItem.lesson1 ? pairItem.lesson1.subject : (pairItem.subject || '');
            const l1Room = pairItem.lesson1 ? pairItem.lesson1.room : (pairItem.room || '');

            const hasL2 = pairItem.lesson2 !== null;
            const l2Subj = pairItem.lesson2 ? pairItem.lesson2.subject : (pairItem.subject || '');
            const l2Room = pairItem.lesson2 ? pairItem.lesson2.room : (pairItem.room || '');

            const l1Html = hasL1 ? `
                <div class="lesson-row">
                    <div class="lesson-details">
                        <span class="lesson-num">Урок ${pairItem.pair * 2 - 1} &bull; ${l1Time}</span>
                        <span class="pair-subject">${l1Subj}</span>
                    </div>
                    ${l1Room ? `<span class="pair-room">${l1Room}</span>` : ''}
                </div>
            ` : `
                <div class="lesson-row" style="opacity: 0.4;">
                    <div class="lesson-details">
                        <span class="lesson-num">Урок ${pairItem.pair * 2 - 1} &bull; ${l1Time}</span>
                        <span class="pair-subject" style="font-style: italic;">Ко 2-му уроку (окно)</span>
                    </div>
                </div>
            `;

            const l2Html = hasL2 ? `
                <div class="lesson-row">
                    <div class="lesson-details">
                        <span class="lesson-num">Урок ${pairItem.pair * 2} &bull; ${l2Time}</span>
                        <span class="pair-subject">${l2Subj}</span>
                    </div>
                    ${l2Room ? `<span class="pair-room">${l2Room}</span>` : ''}
                </div>
            ` : `
                <div class="lesson-row" style="opacity: 0.4;">
                    <div class="lesson-details">
                        <span class="lesson-num">Урок ${pairItem.pair * 2} &bull; ${l2Time}</span>
                        <span class="pair-subject" style="font-style: italic;">Урока нет</span>
                    </div>
                </div>
            `;

            return `
                <li class="pair-card" data-pair="${pairItem.pair}">
                    <div class="pair-time">
                        <div class="number">${pairItem.pair} пара</div>
                        <div class="hours">${bell ? `${bell.start} - ${bell.end}` : ''}</div>
                    </div>
                    <div class="pair-info">
                        ${l1Html}
                        <div class="lesson-divider"></div>
                        ${l2Html}
                    </div>
                </li>
            `;
        }).join('');
    }

    getSmartStatus() {
        let status = getCurrentScheduleStatus(this.state.bells);
        const todaySchedule = this.state.todayOverride ? this.state.todayOverride.lessons : (this.state.base[this.state.currentDayNum] || []);
        
        if (todaySchedule.length === 0) {
            return { status: 'no_classes' };
        }

        const maxPair = Math.max(...todaySchedule.map(l => l.pair));

        if ((status.status === 'active' && status.currentPair.pair > maxPair) || 
            (status.status === 'break' && status.nextPair.pair > maxPair)) {
            return { status: 'ended' };
        }

        if (status.status === 'active') {
             const currentPairData = todaySchedule.find(l => l.pair === status.currentPair.pair);
             if (!currentPairData) {
                 return { ...status, status: 'window' };
             }
        }

        return status;
    }

    updateLiveWidget() {
        const container = document.getElementById('live-widget-container');
        if (!container) return;

        const currentDayReal = new Date().getDay();
        if (currentDayReal === 0 || currentDayReal === 6) {
            container.innerHTML = `
                <article class="live-widget" style="border-color: rgba(255,255,255,0.1); box-shadow: none;">
                    <div class="live-subject" style="margin:0; text-align:center;">Выходной</div>
                </article>`;
            return;
        }

        const status = this.getSmartStatus();
        const todaySchedule = this.state.todayOverride ? this.state.todayOverride.lessons : (this.state.base[this.state.currentDayNum] || []);

        if (status.status === 'no_classes') {
            container.innerHTML = `
                <article class="live-widget" style="border-color: #4CAF50; box-shadow: 0 0 15px rgba(76, 175, 80, 0.1);">
                    <div class="live-subject" style="margin: 0; text-align: center; color: #4CAF50;">Пар нет</div>
                </article>`;
        } else if (status.status === 'ended') {
            container.innerHTML = `
                <article class="live-widget" style="border-color: #4CAF50; box-shadow: 0 0 15px rgba(76, 175, 80, 0.1);">
                    <div class="live-subject" style="margin: 0; text-align: center; color: #4CAF50;">Пары закончились</div>
                </article>`;
        } else if (status.status === 'window') {
            container.innerHTML = `
                <article class="live-widget" style="border-color: rgba(255,255,255,0.1); box-shadow: none; opacity: 0.8;">
                    <div class="live-header">
                        <span class="live-status" style="color: var(--text-muted);">Окно (Свободная пара)</span>
                        <span class="live-time" id="widget-time">${status.timeLeft} мин</span>
                    </div>
                    <div class="live-subject" style="margin:0;">Свободное время</div>
                    <div class="progress-track" style="margin-top: 16px;">
                        <div class="progress-fill" id="widget-progress" style="width: ${status.progressPercent}%; background: rgba(255,255,255,0.2);"></div>
                    </div>
                </article>`;
        } else if (status.status === 'active') {
            const currentPairData = todaySchedule.find(l => l.pair === status.currentPair.pair);
            let subjectName = currentPairData.subject || 'Урок';

            if (currentPairData.lesson1 !== undefined || currentPairData.lesson2 !== undefined) {
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                const l1End = parseTimeToMinutes(status.currentPair.lesson1.end);

                if (currentMinutes <= l1End) {
                    subjectName = currentPairData.lesson1 ? currentPairData.lesson1.subject : 'Ко 2-му уроку (окно)';
                } else {
                    subjectName = currentPairData.lesson2 ? currentPairData.lesson2.subject : 'Урока нет';
                }
            }

            container.innerHTML = `
                <article class="live-widget">
                    <div class="live-header">
                        <span class="live-status">Идет ${status.currentPair.pair} пара</span>
                        <span class="live-time" id="widget-time">${status.timeLeft} мин</span>
                    </div>
                    <div class="live-subject">${subjectName}</div>
                    <div class="progress-track">
                        <div class="progress-fill" id="widget-progress" style="width: ${status.progressPercent}%"></div>
                    </div>
                </article>`;
        } else if (status.status === 'break') {
            let nextSubj = `Пара ${status.nextPair.pair}`;
            const nextPairData = todaySchedule.find(l => l.pair >= status.nextPair.pair);
            
            if (nextPairData) {
                if (nextPairData.lesson1 || nextPairData.lesson2) {
                    nextSubj = nextPairData.lesson1 ? nextPairData.lesson1.subject : nextPairData.lesson2.subject;
                } else {
                    nextSubj = nextPairData.subject;
                }
            }

            container.innerHTML = `
                <article class="live-widget" style="border-color: #2196F3; box-shadow: 0 0 15px rgba(33, 150, 243, 0.2);">
                    <div class="live-header">
                        <span class="live-status" style="color: #2196F3;">Перемена</span>
                        <span class="live-time" id="widget-time">${status.timeToNext} мин</span>
                    </div>
                    <div class="live-subject" style="margin:0;">След: ${nextSubj}</div>
                </article>`;
        } else {
            container.innerHTML = `
                <article class="live-widget" style="border-color: rgba(255,255,255,0.2); box-shadow: none;">
                    <div class="live-header">
                        <span class="live-status" style="color: #fff;">До начала занятий</span>
                        <span class="live-time" id="widget-time">${status.timeToNext} мин</span>
                    </div>
                </article>`;
        }
    }

    refreshLiveState() {
        if (new Date().getDay() === 0 || new Date().getDay() === 6) return;
        
        const status = this.getSmartStatus();
        const timeEl = document.getElementById('widget-time');
        const progressEl = document.getElementById('widget-progress');
        
        if (timeEl) {
            timeEl.textContent = (status.status === 'active' || status.status === 'window') ? `${status.timeLeft} мин` : `${status.timeToNext} мин`;
        }
        if (progressEl && (status.status === 'active' || status.status === 'window')) {
            progressEl.style.width = `${status.progressPercent}%`;
        }

        if ((status.status === 'active' && !progressEl) || 
            (status.status === 'break' && progressEl) || 
            (status.status === 'ended' && timeEl) ||
            (status.status === 'window' && (!progressEl || progressEl.style.background !== 'rgba(255, 255, 255, 0.2)'))) {
            this.updateLiveWidget();
        }

        if (this.state.selectedDay === this.state.currentDayNum) {
            document.querySelectorAll('.pair-card').forEach(card => {
                const pNum = parseInt(card.getAttribute('data-pair'));
                card.classList.remove('current', 'past');

                if ((status.status === 'active' || status.status === 'window') && status.currentPair.pair === pNum) card.classList.add('current');
                else if ((status.status === 'active' || status.status === 'window') && pNum < status.currentPair.pair) card.classList.add('past');
                else if (status.status === 'ended' || (status.status === 'break' && pNum < status.nextPair.pair)) card.classList.add('past');
            });
        }
    }
}