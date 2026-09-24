const cache = new Map();

async function fetchJson(url, useCache = true, fetchOptions = {}) {
    if (useCache && cache.has(url)) {
        return cache.get(url);
    }
    
    try {
        const response = await fetch(url, fetchOptions);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        if (useCache) cache.set(url, data);
        
        return data;
    } catch (error) {
        return null; 
    }
}

export const ApiService = {
    clearCache: () => cache.clear(),
    
    getBells: () => fetchJson('data/bells.json'),
    getSchedule: () => fetchJson('data/schedule.json'),
    getStudents: () => fetchJson('data/students.json'),
    getTeachers: () => fetchJson('data/teachers.json'),
    getEvents: () => fetchJson('data/events.json', true, { cache: 'no-cache' }),
    
    getOverride: (dateStr) => fetchJson(`data/overrides/${dateStr}.json`, true, { cache: 'no-cache' }),

    getHomework: async () => {
        const getMonday = (date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(d.setDate(diff));
        };

        const formatDate = (date) => {
            const dd = String(date.getDate()).padStart(2, '0');
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const yyyy = date.getFullYear();
            return `${dd}-${mm}-${yyyy}`;
        };

        const today = new Date();
        const currentMonday = getMonday(today);
        
        const prevMonday1 = new Date(currentMonday);
        prevMonday1.setDate(prevMonday1.getDate() - 7);
        
        const prevMonday2 = new Date(currentMonday);
        prevMonday2.setDate(prevMonday2.getDate() - 14);

        const [dataWeek0, dataWeek1, dataWeek2] = await Promise.all([
            fetchJson(`data/homework/${formatDate(currentMonday)}.json`, true, { cache: 'no-cache' }),
            fetchJson(`data/homework/${formatDate(prevMonday1)}.json`, true, { cache: 'no-cache' }),
            fetchJson(`data/homework/${formatDate(prevMonday2)}.json`, true, { cache: 'no-cache' })
        ]);

        const combinedTasks = [];
        if (Array.isArray(dataWeek2)) combinedTasks.push(...dataWeek2);
        if (Array.isArray(dataWeek1)) combinedTasks.push(...dataWeek1);
        if (Array.isArray(dataWeek0)) combinedTasks.push(...dataWeek0);

        return combinedTasks;
    }
};