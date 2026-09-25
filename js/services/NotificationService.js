/* =====================================================================
   FILE: js/services/NotificationService.js
   Локальный планировщик PWA Push-уведомлений
===================================================================== */
import { PrefsManager } from '../utils/prefs.js';
import { ApiService } from './api.js';
import { getDateStringForDay } from '../utils/time.js';

export const NotificationService = {
    timerId: null,

    init() {
        if (this.timerId) clearInterval(this.timerId);
        
        // Запускаем первую проверку через 5 секунд после старта приложения,
        // затем проверяем каждую минуту.
        setTimeout(() => this.checkSchedule(), 5000);
        this.timerId = setInterval(() => this.checkSchedule(), 60000);
        console.log('[NotificationService] Планировщик уведомлений запущен.');
    },

    async checkSchedule() {
        try {
            const prefs = PrefsManager.getPrefs();
            // Если уведомления выключены или нет прав в системе — выходим
            if (!prefs.notifications || Notification.permission !== 'granted') return;

            const now = new Date();
            const currentDayReal = now.getDay();
            
            // На выходных пар нет, не проверяем
            if (currentDayReal === 0 || currentDayReal === 6) return; 

            const todayStr = getDateStringForDay(currentDayReal);
            const notifiedKey = `sh_notified_${todayStr}`;

            // Защита от спама: если сегодня уже уведомляли - пропускаем
            if (localStorage.getItem(notifiedKey) === 'true') return;

            const [bells, baseSchedule, override] = await Promise.all([
                ApiService.getBells(),
                ApiService.getSchedule(),
                ApiService.getOverride(todayStr)
            ]);

            const schedule = override ? override.lessons : (baseSchedule[currentDayReal] || []);
            if (!schedule || schedule.length === 0) return;

            const userSubgroup = prefs.subgroup;
            let firstPair = null;

            // Ищем самую первую пару, на которую нужно идти ЭТОЙ подгруппе
            for (const pair of schedule) {
                const l1Subj = pair.lesson1 ? pair.lesson1.subject : pair.subject;
                const l2Subj = pair.lesson2 ? pair.lesson2.subject : pair.subject;

                const isVisible = (subjectName) => {
                    if (!subjectName) return true;
                    const str = subjectName.toLowerCase();
                    if (userSubgroup === '1' && (str.includes('2г') || str.includes('2 п/г') || str.includes('2 группа'))) return false;
                    if (userSubgroup === '2' && (str.includes('1г') || str.includes('1 п/г') || str.includes('1 группа'))) return false;
                    return true;
                };

                if (isVisible(l1Subj) || isVisible(l2Subj)) {
                    firstPair = pair;
                    break;
                }
            }

            // Пар для этой подгруппы сегодня нет
            if (!firstPair) return;

            const bell = bells.find(b => b.pair === firstPair.pair);
            if (!bell) return;

            const [startH, startM] = bell.start.split(':').map(Number);
            const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM);

            // Разница в минутах между началом пары и текущим временем
            const diffMins = (startTime.getTime() - now.getTime()) / 60000;

            // Если до пары осталось от 29 до 30.5 минут — отправляем Push!
            if (diffMins > 29 && diffMins <= 30.5) {
                let subjName = firstPair.subject || (firstPair.lesson1 ? firstPair.lesson1.subject : 'Занятие');
                
                PrefsManager.sendLocalNotification(
                    'Скоро на пары!', 
                    `Через 30 минут начнется ${firstPair.pair} пара (${subjName}).`
                );
                
                // Записываем, что сегодня уже уведомили
                localStorage.setItem(notifiedKey, 'true');
                console.log(`[NotificationService] Уведомление отправлено для ${todayStr}`);
            }

        } catch (error) {
            console.error('[NotificationService] Ошибка проверки расписания:', error);
        }
    }
};