/* =====================================================================
   FILE: js/views/ScheduleView.js
===================================================================== */
import { ApiService } from '../services/api.js';
import { getCurrentScheduleStatus, getDateStringForDay, formatMinutes } from '../utils/time.js';
import { PrefsManager } from '../utils/prefs.js';
import { Store } from '../store.js';
import { ScheduleTemplate } from '../templates/ScheduleTemplate.js';

export class ScheduleView {
    constructor(container) {
        this.container = container;
        this.liveTimerId = null;
        this.unsubscribeStore = null;
        this.cached = { widgetContainer: null, timeEl: null, progressEl: null, pairCards: [] };
        this.currentWidgetState = null; 
        this.isMounted = false;
        this.state = {
            bells: [], base: {}, currentDayNum: 1, selectedDay: 1,
            selectedDayOverride: null, todayOverride: null, showActual: true
        };
        
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.handleGlobalClick = this.handleGlobalClick.bind(this);
    }

    async mount(params = {}) {
        this.isMounted = true;
        this.container.innerHTML = `
            <div class="skeleton" style="height: 120px; width: 100%; margin-bottom: 24px;"></div>
            <div class="skeleton" style="height: 50px; width: 100%; margin-bottom: 24px;"></div>
            <div class="skeleton" style="height: 80px; width: 100%; margin-bottom: 12px;"></div>
        `;
        
        this.container.addEventListener('click', this.handleGlobalClick);

        this.unsubscribeStore = Store.subscribe((state, changedKey) => {
            if (changedKey === 'pref_subgroup' && this.isMounted) {
                this.fullRenderUI();
            }
        });

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
            
            this.state.selectedDay = params.day ? Number(params.day) : this.state.currentDayNum;

            const todayStr = getDateStringForDay(this.state.currentDayNum);
            this.state.todayOverride = await ApiService.getOverride(todayStr);

            if (!this.isMounted) return;

            this.renderLayout();
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

    async update(params = {}) {
        const targetDay = params.day ? parseInt(params.day) : this.state.currentDayNum;
        if (targetDay !== this.state.selectedDay) {
            const direction = targetDay > this.state.selectedDay ? 'right' : 'left';
            await this.changeDay(targetDay, direction);
        }
    }

    unmount() {
        this.isMounted = false;
        if (this.liveTimerId) clearInterval(this.liveTimerId);
        if (this.unsubscribeStore) this.unsubscribeStore();
        
        this.cached = { widgetContainer: null, timeEl: null, progressEl: null, pairCards: [] };
        this.currentWidgetState = null;
        this.container.removeEventListener('click', this.handleGlobalClick);
    }

    handleGlobalClick(e) {
        const dayTab = e.target.closest('.day-tab');
        if (dayTab) {
            const targetDay = parseInt(dayTab.getAttribute('data-day'));
            if (targetDay !== this.state.selectedDay) {
                window.location.hash = `#/schedule?day=${targetDay}`;
            }
            return;
        }

        const segmentBtn = e.target.closest('.segment-btn');
        if (segmentBtn) {
            PrefsManager.vibrate(15);
            if (!this.state.selectedDayOverride) return;
            this.state.showActual = segmentBtn.dataset.type === 'actual';
            this.fullRenderUI();
            return;
        }
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
        if (newDay < 1 || newDay > 5) return;
        
        PrefsManager.vibrate(15);
        this.state.selectedDay = newDay;

        this.container.querySelectorAll('.day-tab').forEach(t => {
            t.classList.toggle('active', parseInt(t.getAttribute('data-day')) === newDay);
        });

        const listContainer = document.getElementById('schedule-list');
        if (listContainer) listContainer.classList.add('updating');

        await this.loadSelectedDayData();
        if (!this.isMounted) return;

        this.fullRenderUI();

        if (listContainer) {
            listContainer.classList.remove('slide-left', 'slide-right');
            void listContainer.offsetWidth;
            listContainer.classList.add(direction === 'left' ? 'slide-left' : 'slide-right');
            listContainer.classList.remove('updating');
        }
    }

    bindSwipeEvents() {
        const area = document.getElementById('schedule-list'); 
        if (!area) return;
        
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
                    const next = Math.min(this.state.selectedDay + 1, 5);
                    if (next !== this.state.selectedDay) window.location.hash = `#/schedule?day=${next}`;
                } else if (diffX > threshold) {
                    const prev = Math.max(this.state.selectedDay - 1, 1);
                    if (prev !== this.state.selectedDay) window.location.hash = `#/schedule?day=${prev}`;
                }
            }
        }, { passive: true });
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
        if (!listContainer) return;
        
        const userSubgroup = Store.getState().prefs.subgroup;
        listContainer.innerHTML = ScheduleTemplate.renderList(dayScheduleArray, bellsData, userSubgroup);
        this.cached.pairCards = Array.from(listContainer.querySelectorAll('.pair-card'));
    }

    getSmartStatus() {
        let status = getCurrentScheduleStatus(this.state.bells);
        
        let overrideToUse = this.state.todayOverride;
        if (this.state.selectedDay === this.state.currentDayNum) {
            overrideToUse = this.state.selectedDayOverride;
        }
        
        const rawSchedule = overrideToUse ? overrideToUse.lessons : (this.state.base[this.state.currentDayNum] || []);
        if (rawSchedule.length === 0) return { status: 'no_classes' };

        const userSubgroup = Store.getState().prefs.subgroup;
        
        const isVisible = (subjectName) => {
            if (!subjectName) return true; 
            const str = subjectName.toLowerCase();
            if (userSubgroup === '1' && (str.includes('2г') || str.includes('2 п/г') || str.includes('2 группа'))) return false;
            if (userSubgroup === '2' && (str.includes('1г') || str.includes('1 п/г') || str.includes('1 группа'))) return false;
            return true;
        };

        const todaySchedule = rawSchedule.map(pair => {
            const p = { ...pair };
            const l1Subj = p.lesson1 ? p.lesson1.subject : p.subject;
            const l2Subj = p.lesson2 ? p.lesson2.subject : p.subject;
            
            const hasL1 = isVisible(l1Subj);
            const hasL2 = isVisible(l2Subj);
            
            if (!hasL1 && !hasL2) {
                p.subject = null; p.lesson1 = null; p.lesson2 = null;
            } else {
                if (!hasL1) p.lesson1 = { subject: null };
                if (!hasL2) p.lesson2 = { subject: null };
            }
            return p;
        });

        const validPairs = todaySchedule.filter(p => p.subject !== null || (p.lesson1 && p.lesson1.subject !== null) || (p.lesson2 && p.lesson2.subject !== null));
        const maxPair = validPairs.length > 0 ? Math.max(...validPairs.map(l => l.pair)) : 0;

        if (maxPair === 0) return { status: 'no_classes' };

        if ((status.status.startsWith('active') || status.status === 'short_break') && status.currentPair.pair > maxPair) return { status: 'ended' };
        if (status.status === 'break' && status.nextPair.pair > maxPair) return { status: 'ended' };

        if (status.status.startsWith('active') || status.status === 'short_break') {
             const currentPairData = todaySchedule.find(l => l.pair === status.currentPair.pair);
             
             if (!currentPairData || currentPairData.subject === null) {
                 return { ...status, status: 'window', windowType: 'full_pair' };
             }
             
             if (status.status === 'active_lesson1') {
                 const subj = currentPairData.lesson1 ? currentPairData.lesson1.subject : currentPairData.subject;
                 if (subj === null) return { ...status, status: 'window', windowType: 'lesson1', currentPairData };
             }
             if (status.status === 'active_lesson2') {
                 const subj = currentPairData.lesson2 ? currentPairData.lesson2.subject : currentPairData.subject;
                 if (subj === null) return { ...status, status: 'window', windowType: 'lesson2', currentPairData };
             }

             status.currentPairData = currentPairData;
        }

        if (status.status === 'break' || status.status === 'before_classes') {
            status.nextPairData = todaySchedule.find(l => l.pair === status.nextPair.pair);
        }
        
        return status;
    }

    renderWidgetHTML(status) {
        if (!this.cached.widgetContainer) return;
        
        this.cached.widgetContainer.innerHTML = ScheduleTemplate.renderWidget(status);
        this.cached.timeEl = document.getElementById('widget-time');
        this.cached.progressEl = document.getElementById('widget-progress');
    }

    refreshLiveState() {
        if (!this.isMounted) return;
        
        const now = new Date();
        const realDay = now.getDay();
        
        const activeDayNum = (realDay >= 1 && realDay <= 5) ? realDay : 1;
        if (this.state.currentDayNum !== activeDayNum) {
            this.state.currentDayNum = activeDayNum;
            this.state.selectedDay = activeDayNum;
            
            this.container.querySelectorAll('.day-tab').forEach(t => {
                t.classList.toggle('today', parseInt(t.getAttribute('data-day')) === activeDayNum);
                t.classList.toggle('active', parseInt(t.getAttribute('data-day')) === activeDayNum);
            });

            const todayStr = getDateStringForDay(activeDayNum);
            ApiService.getOverride(todayStr).then(res => {
                if (!this.isMounted) return;
                this.state.todayOverride = res;
                this.loadSelectedDayData().then(() => this.fullRenderUI());
            });
            return;
        }

        if (realDay === 0 || realDay === 6) {
            this.renderWidgetHTML({ status: 'weekend' });
            return;
        }
        
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
            
            const hasProgress = status.status.startsWith('active') || status.status === 'window' || status.status === 'short_break' || status.status === 'break';
            if (this.cached.progressEl && hasProgress) {
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