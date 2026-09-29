export const Store = {
    state: {
        isOffline: !navigator.onLine,
        prefs: {}, 
        currentTheme: 'burgundy',
        homeworkTasks: JSON.parse(localStorage.getItem('sh_homework_state') || '{}'),
        modalState: null
    },
    
    listeners: [],

    init(initialState = {}) {
        this.state = { ...this.state, ...initialState };
        console.log('[Store] Инициализирован:', this.state);
    },

    getState() { return this.state; },

    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notify('all');
    },

    updatePref(key, value) {
        if (this.state.prefs[key] !== value) {
            this.state.prefs = { ...this.state.prefs, [key]: value };
            this.notify(`pref_${key}`);
        }
    },

    setHomeworkTask(id, isDone) {
        this.state.homeworkTasks[id] = isDone;
        localStorage.setItem('sh_homework_state', JSON.stringify(this.state.homeworkTasks));
        this.notify('homework');
    },

    subscribe(listener) {
        this.listeners.push(listener);
        return () => { this.listeners = this.listeners.filter(l => l !== listener); };
    },

    notify(changedKey = 'all') {
        this.listeners.forEach(listener => listener(this.state, changedKey));
    }
};