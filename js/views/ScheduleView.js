/* =====================================================================
   FILE: js/views/ScheduleView.js
   ОПТИМИЗАЦИЯ: Внедрен Dirty Checking, formatMinutes и премиум-дизайн виджета.
===================================================================== */
import { ApiService } from '../services/api.js';
import { getCurrentScheduleStatus, getDateStringForDay, parseTimeToMinutes, formatMinutes } from '../utils/time.js';
import { PrefsManager } from '../utils/prefs.js';

export class ScheduleView {
    constructor(container) {
        this.container = container;
        this.liveTimerId = null;
        
        // Кэшированные элементы DOM для быстрых обновлений без querySelector
        this.cached = {
            widgetContainer: null,
            timeEl: null,
            progressEl: null,
            pairCards: []
        };
        
        // Сигнатура текущего состояния виджета, чтобы не перерисовывать его зря
        this.currentWidgetState = null; 
        
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

            // Таймер 1 сек, логика внутри оптимизирована (Dirty Checking)
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
        // Очищаем кэш ссылок на DOM для предотвращения утечек памяти
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
        
        // Кэшируем контейнер виджета один раз
        this.cached.widgetContainer = document.getElementById('live-widget-container');
    }

    bindEvents() {
        this.container.querySelectorAll('.day-tab').forEach(tab => {
            tab.addEventListener('click', async (e) => {
                PrefsManager.vibrate();
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
        
        // Принудительный сброс стейта виджета для его перерисовки при смене дня
        this.currentWidgetState = null; 
        this.refreshLiveState();
    }

    generateListDOM(dayScheduleArray, bellsData) {
        const listContainer = document.getElementById('schedule-list');
        if (!dayScheduleArray || dayScheduleArray.length === 0) {
            listContainer.innerHTML = `<li class="placeholder-card" style="text-align:center; list-style:none; color: var(--text-muted)">Пар нет</li>`;
            this.cached.pairCards = []; // Обнуляем кэш
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
                        <span class="pair-subject" style="font-style: italic;">Подгруппа отдыхает (Окно)</span>
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
                        <span class="pair-subject" style="font-style: italic;">Подгруппа отдыхает (Окно)</span>
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
        
        // ЕДИНОРАЗОВОЕ кэширование списка пар для подсветки активной
        this.cached.pairCards = Array.from(listContainer.querySelectorAll('.pair-card'));
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
             // Пробрасываем данные о текущей паре
             status.currentPairData = currentPairData;
        }
        
        if (status.status === 'break') {
            status.nextPairData = todaySchedule.find(l => l.pair >= status.nextPair.pair);
        }

        return status;
    }

    renderWidgetHTML(status) {
        if (!this.cached.widgetContainer) return;
        const currentDayReal = new Date().getDay();
        
        if (currentDayReal === 0 || currentDayReal === 6) {
            this.cached.widgetContainer.innerHTML = `
                <article class="live-widget widget-idle">
                    <div class="live-subject" style="margin:0; text-align:center;">Выходной</div>
                </article>`;
            return;
        }

        if (status.status === 'no_classes') {
            this.cached.widgetContainer.innerHTML = `
                <article class="live-widget widget-success">
                    <div class="live-status-group" style="justify-content: center;">
                        <div class="pulse-dot"></div>
                        <span class="live-status">Пар нет</span>
                    </div>
                </article>`;
        } else if (status.status === 'ended') {
            this.cached.widgetContainer.innerHTML = `
                <article class="live-widget widget-success">
                    <div class="live-status-group" style="justify-content: center;">
                        <div class="pulse-dot"></div>
                        <span class="live-status">Пары закончились</span>
                    </div>
                </article>`;
        } else if (status.status === 'window') {
            this.cached.widgetContainer.innerHTML = `
                <article class="live-widget widget-idle">
                    <div class="live-header">
                        <div class="live-status-group">
                            <div class="pulse-dot"></div>
                            <span class="live-status">Окно (Свободно)</span>
                        </div>
                        <span class="live-time" id="widget-time">${formatMinutes(status.timeLeft)}</span>
                    </div>
                    <div class="live-subject" style="margin:0;">Свободное время</div>
                    <div class="progress-track" style="margin-top: 16px;">
                        <div class="progress-fill" id="widget-progress" style="width: ${status.progressPercent}%; background: var(--text-muted);"></div>
                    </div>
                </article>`;
        } else if (status.status === 'active') {
            let subjectName = status.currentPairData.subject || 'Урок';
            if (status.currentPairData.lesson1 !== undefined || status.currentPairData.lesson2 !== undefined) {
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                const l1End = parseTimeToMinutes(status.currentPair.lesson1.end);
                subjectName = (currentMinutes <= l1End) 
                    ? (status.currentPairData.lesson1 ? status.currentPairData.lesson1.subject : 'Окно') 
                    : (status.currentPairData.lesson2 ? status.currentPairData.lesson2.subject : 'Окно');
            }

            this.cached.widgetContainer.innerHTML = `
                <article class="live-widget widget-active">
                    <div class="live-header">
                        <div class="live-status-group">
                            <div class="pulse-dot"></div>
                            <span class="live-status">Идет ${status.currentPair.pair} пара</span>
                        </div>
                        <span class="live-time" id="widget-time">${formatMinutes(status.timeLeft)}</span>
                    </div>
                    <div class="live-subject">${subjectName}</div>
                    <div class="progress-track">
                        <div class="progress-fill" id="widget-progress" style="width: ${status.progressPercent}%"></div>
                    </div>
                </article>`;
        } else if (status.status === 'break') {
            let nextSubj = `Пара ${status.nextPair.pair}`;
            if (status.nextPairData) {
                nextSubj = (status.nextPairData.lesson1 || status.nextPairData.lesson2) 
                    ? (status.nextPairData.lesson1 ? status.nextPairData.lesson1.subject : status.nextPairData.lesson2.subject) 
                    : status.nextPairData.subject;
            }

            this.cached.widgetContainer.innerHTML = `
                <article class="live-widget widget-break">
                    <div class="live-header">
                        <div class="live-status-group">
                            <div class="pulse-dot"></div>
                            <span class="live-status">Перемена</span>
                        </div>
                        <span class="live-time" id="widget-time">${formatMinutes(status.timeToNext)}</span>
                    </div>
                    <div class="live-subject" style="margin:0;">След: ${nextSubj}</div>
                </article>`;
        } else {
            this.cached.widgetContainer.innerHTML = `
                <article class="live-widget widget-idle">
                    <div class="live-header">
                        <div class="live-status-group">
                            <div class="pulse-dot"></div>
                            <span class="live-status">До начала занятий</span>
                        </div>
                        <span class="live-time" id="widget-time">${formatMinutes(status.timeToNext)}</span>
                    </div>
                </article>`;
        }

        // Обновляем ссылки на элементы внутри виджета ПОСЛЕ перерисовки
        this.cached.timeEl = document.getElementById('widget-time');
        this.cached.progressEl = document.getElementById('widget-progress');
    }

    refreshLiveState() {
        if (new Date().getDay() === 0 || new Date().getDay() === 6) return;
        
        const status = this.getSmartStatus();
        
        // Генерация уникальной подписи состояния (Например: "active_2" или "break_3")
        let stateSignature = status.status;
        if (status.currentPair) stateSignature += `_p${status.currentPair.pair}`;
        if (status.nextPair) stateSignature += `_n${status.nextPair.pair}`;
        
        // Вычисляем номер текущего мини-урока (до перемены внутри пары) для точной сигнатуры
        if (status.status === 'active' && status.currentPairData && (status.currentPairData.lesson1 !== undefined || status.currentPairData.lesson2 !== undefined)) {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const l1End = parseTimeToMinutes(status.currentPair.lesson1.end);
            stateSignature += (currentMinutes <= l1End) ? '_L1' : '_L2';
        }

        // DIRTY CHECKING: Если статус кардинально изменился - полностью перерисовываем HTML виджета
        if (this.currentWidgetState !== stateSignature) {
            this.renderWidgetHTML(status);
            this.currentWidgetState = stateSignature;
            this.updatePairCardsHighlight(status); 
        } 
        else {
            // МИКРО-ОБНОВЛЕНИЕ: Если состояние то же самое, просто двигаем полоску и текст таймера
            if (this.cached.timeEl) {
                const newTimeText = (status.status === 'active' || status.status === 'window') ? formatMinutes(status.timeLeft) : formatMinutes(status.timeToNext);
                if (this.cached.timeEl.textContent !== newTimeText) {
                    this.cached.timeEl.textContent = newTimeText;
                }
            }
            if (this.cached.progressEl && (status.status === 'active' || status.status === 'window')) {
                this.cached.progressEl.style.width = `${status.progressPercent}%`;
            }
        }

        // Логика уведомления (выполняется 1 раз)
        if (status.status === 'before_classes' && status.timeToNext === 30) {
            const todayStr = getDateStringForDay(this.state.currentDayNum);
            const notifiedKey = `sh_notified_${todayStr}`;
            if (!localStorage.getItem(notifiedKey)) {
                PrefsManager.sendLocalNotification('Скоро пара! 🎓', `Через 30 минут начнется ${status.nextPair.pair} пара.`);
                localStorage.setItem(notifiedKey, 'true');
            }
        }
    }

    updatePairCardsHighlight(status) {
        if (this.state.selectedDay !== this.state.currentDayNum) return;
        
        // Используем кэшированный массив (нет обращения к DOM через querySelectorAll)
        this.cached.pairCards.forEach(card => {
            const pNum = parseInt(card.getAttribute('data-pair'));
            card.classList.remove('current', 'past');

            if ((status.status === 'active' || status.status === 'window') && status.currentPair.pair === pNum) {
                card.classList.add('current');
            }
            else if ((status.status === 'active' || status.status === 'window') && pNum < status.currentPair.pair) {
                card.classList.add('past');
            }
            else if (status.status === 'ended' || (status.status === 'break' && pNum < status.nextPair.pair)) {
                card.classList.add('past');
            }
        });
    }
}