/* =====================================================================
   FILE: js/store.js
   Единое реактивное хранилище состояния приложения (Pub/Sub)
===================================================================== */

export const Store = {
    state: {
        isOffline: !navigator.onLine,
        prefs: {}, 
        currentTheme: 'burgundy',
        homeworkCache: {}
    },
    
    listeners: [],

    /**
     * Инициализация стартового состояния
     */
    init(initialState = {}) {
        this.state = { ...this.state, ...initialState };
        console.log('[Store] Инициализирован с состоянием:', this.state);
    },

    /**
     * Получить текущее состояние целиком
     */
    getState() {
        return this.state;
    },

    /**
     * Обновить состояние (полностью или частично) и уведомить подписчиков
     */
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notify('all');
    },

    /**
     * Обновить конкретную настройку (preference)
     */
    updatePref(key, value) {
        if (this.state.prefs[key] !== value) {
            this.state.prefs = { ...this.state.prefs, [key]: value };
            this.notify(`pref_${key}`);
        }
    },

    /**
     * Подписаться на изменения Store.
     * Возвращает функцию для отписки (unsubscribe).
     */
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    },

    /**
     * Уведомить всех подписчиков об изменении
     */
    notify(changedKey = 'all') {
        this.listeners.forEach(listener => listener(this.state, changedKey));
    }
};