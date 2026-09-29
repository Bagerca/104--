/* =====================================================================
   FILE: js/views/GamesView.js
===================================================================== */
import { GamesTemplate } from '../templates/GamesTemplate.js';
import { PrefsManager } from '../utils/prefs.js';

export class GamesView {
    constructor(container) {
        this.container = container;
        this.isMounted = false;
        
        this.gamesList = [
            {
                id: 'minesweeper',
                title: 'Сапёр',
                genre: 'Логика',
                description: 'Классическая головоломка. Найди все мины на поле, используя цифры-подсказки. Удобный мобильный режим с переключателем лопаты и флага!',
                cover: 'img/games/minesweeper.webp', 
                status: 'ready'
            },
            {
                id: 'tictactoe',
                title: 'Крестики-нолики',
                genre: 'Настольная',
                description: 'Классическая игра против умного бота. Сможешь ли ты перехитрить его и собрать линию из трёх крестиков?',
                cover: 'img/games/tictactoe.webp', // Закинь картинку в папку
                status: 'ready'
            },
            {
                id: 'snake',
                title: 'Змейка',
                genre: 'Аркада',
                description: 'Классическая ретро-игра. Управление свайпами, сбор яблок и растущий хвост. Попробуй побить рекорд группы!',
                cover: 'img/games/snake.webp', 
                status: 'ready'
            },
            {
                id: '2048',
                title: '2048',
                genre: 'Головоломка',
                description: 'Сдвигай плитки, чтобы объединить одинаковые цифры. Собери заветную 2048!',
                cover: 'img/games/2048.webp', 
                status: 'ready'
            },
            {
                id: 'flappy',
                title: 'Flappy Bird',
                genre: 'Хардкор',
                description: 'Лети сквозь трубы, не касаясь их. Кажется простым? Попробуй набрать хотя бы 10 очков!',
                cover: 'img/games/flappy.webp', 
                status: 'ready'
            }
        ];
        
        this.handleGlobalClick = this.handleGlobalClick.bind(this);
    }

    async mount() {
        this.isMounted = true;
        this.container.innerHTML = GamesTemplate.renderList(this.gamesList);
        this.container.addEventListener('click', this.handleGlobalClick);
    }

    handleGlobalClick(e) {
        const btn = e.target.closest('.game-btn');
        if (btn) {
            PrefsManager.vibrate(20);
        }
    }

    unmount() {
        this.isMounted = false;
        this.container.removeEventListener('click', this.handleGlobalClick);
    }
}