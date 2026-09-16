import { Icons } from './icons.js';

export class VideoPlayerHelper {
    static setup(wrapper) {
        const video = wrapper.querySelector('video');
        if (!video) return;

        // Удаляем стандартные элементы браузера
        video.removeAttribute('controls');
        wrapper.classList.add('custom-video-wrapper', 'is-paused');

        // Генерируем HTML нашего плеера
        const controlsHtml = `
            <div class="cv-controls">
                <button class="cv-btn cv-play-pause" title="Воспроизведение">${Icons.player_play}</button>
                <div class="cv-progress-container">
                    <span class="cv-time cv-current">0:00</span>
                    <input type="range" class="cv-progress" min="0" max="100" value="0" step="0.1" style="--prog: 0%;">
                    <span class="cv-time cv-total">0:00</span>
                </div>
                <div class="cv-volume-container">
                    <button class="cv-btn cv-mute" title="Звук">${Icons.player_volume_full}</button>
                    <input type="range" class="cv-volume" min="0" max="1" step="0.05" value="1" style="--prog: 100%;">
                </div>
                <button class="cv-btn cv-fullscreen" title="На весь экран">${Icons.player_fullscreen}</button>
            </div>
            <!-- Большая кнопка Play по центру -->
            <button class="cv-big-play" title="Смотреть">${Icons.player_play}</button>
        `;
        
        wrapper.insertAdjacentHTML('beforeend', controlsHtml);

        const playBtn = wrapper.querySelector('.cv-play-pause');
        const bigPlay = wrapper.querySelector('.cv-big-play');
        const progress = wrapper.querySelector('.cv-progress');
        const currentTimeEl = wrapper.querySelector('.cv-current');
        const totalTimeEl = wrapper.querySelector('.cv-total');
        const muteBtn = wrapper.querySelector('.cv-mute');
        const volumeSlider = wrapper.querySelector('.cv-volume');
        const fullscreenBtn = wrapper.querySelector('.cv-fullscreen');

        // Форматирование времени (ММ:СС)
        const formatTime = (seconds) => {
            if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m}:${s < 10 ? '0' : ''}${s}`;
        };

        const togglePlay = () => {
            if (video.paused) video.play();
            else video.pause();
        };

        // События Play / Pause
        video.addEventListener('click', togglePlay);
        playBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
        bigPlay.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });

        video.addEventListener('play', () => {
            wrapper.classList.remove('is-paused');
            playBtn.innerHTML = Icons.player_pause;
        });

        video.addEventListener('pause', () => {
            wrapper.classList.add('is-paused');
            playBtn.innerHTML = Icons.player_play;
        });

        // Таймер и Ползунок
        video.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = formatTime(video.duration);
        });

        let isScrubbing = false;

        video.addEventListener('timeupdate', () => {
            if (!isScrubbing && video.duration) {
                const percent = (video.currentTime / video.duration) * 100;
                progress.value = percent;
                progress.style.setProperty('--prog', `${percent}%`);
                currentTimeEl.textContent = formatTime(video.currentTime);
            }
        });

        progress.addEventListener('input', (e) => {
            isScrubbing = true;
            const percent = e.target.value;
            progress.style.setProperty('--prog', `${percent}%`);
            currentTimeEl.textContent = formatTime((percent / 100) * video.duration);
        });

        progress.addEventListener('change', (e) => {
            isScrubbing = false;
            video.currentTime = (e.target.value / 100) * video.duration;
        });

        // Изолируем нижнюю панель от кликов (чтобы видео не ставилось на паузу при клике по ползунку)
        const controlsPanel = wrapper.querySelector('.cv-controls');
        controlsPanel.addEventListener('click', e => e.stopPropagation());

        // Громкость
        const updateVolumeIcon = (vol) => {
            if (vol === 0 || video.muted) {
                muteBtn.innerHTML = Icons.player_mute;
                muteBtn.style.color = 'var(--error-color)';
            } else if (vol < 0.5) {
                muteBtn.innerHTML = Icons.player_volume_low;
                muteBtn.style.color = '#fff';
            } else {
                muteBtn.innerHTML = Icons.player_volume_full;
                muteBtn.style.color = '#fff';
            }
        };

        volumeSlider.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value);
            video.volume = vol;
            video.muted = false;
            volumeSlider.style.setProperty('--prog', `${vol * 100}%`);
            updateVolumeIcon(vol);
        });

        muteBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            if (video.muted) {
                volumeSlider.value = 0;
                volumeSlider.style.setProperty('--prog', `0%`);
            } else {
                volumeSlider.value = video.volume;
                volumeSlider.style.setProperty('--prog', `${video.volume * 100}%`);
            }
            updateVolumeIcon(video.volume);
        });

        // Полный экран
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                if (wrapper.requestFullscreen) wrapper.requestFullscreen();
                else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
        });

        // Умное скрытие курсора и нижней панели при просмотре
        let hideTimeout;
        wrapper.addEventListener('mousemove', () => {
            wrapper.classList.add('is-active');
            wrapper.classList.remove('hide-cursor');
            clearTimeout(hideTimeout);
            
            if (!video.paused) {
                hideTimeout = setTimeout(() => {
                    wrapper.classList.remove('is-active');
                    wrapper.classList.add('hide-cursor');
                }, 2500);
            }
        });

        wrapper.addEventListener('mouseleave', () => {
            wrapper.classList.remove('is-active');
        });
    }
}