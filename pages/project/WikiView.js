// FILE: pages/project/WikiView.js

import { Icons } from '../../shared/js/icons.js';
import { GalleryRenderer } from './renderers/GalleryRenderer.js';
import { WikiBlockRenderer } from './WikiBlockRenderer.js';
import { ProjectConfig } from './ProjectConfig.js';
import { SmartMarquee } from '../../shared/js/SmartMarquee.js';

export class WikiView {
    constructor(lightboxManager) {
        this.lightbox = lightboxManager;
        this.baseAssetPath = 'assets/catalog/';
        
        this.els = {
            tabsContainer: document.getElementById('dynamic-tabs'),
            sectionsContainer: document.getElementById('dynamic-sections'),
            
            recordModal: document.getElementById('project-record-modal'),
            modalClose: document.querySelector('#project-record-modal .modal-close'),
            modalImage: document.getElementById('prm-image'), 
            modalTitle: document.getElementById('prm-title'),
            modalAuthor: document.getElementById('prm-author'),
            modalText: document.getElementById('prm-text')
        };

        this.galleryRenderer = null; 
        this.currentRecords = []; 
        
        this.fallbackHtml = `<img src="${Icons.avatar_fallback}" alt="Нет фото" class="char-fallback" style="width: 100%; height: 100%; object-fit: cover; background: var(--bg-body); padding: 6px;">`;
        
        this._initModal();
    }

    _initModal() {
        if (this.els.modalClose) {
            this.els.modalClose.innerHTML = Icons.close || 'X';
            this.els.modalClose.addEventListener('click', () => this.closeRecordModal());
        }

        if (this.els.recordModal) {
            this.els.recordModal.addEventListener('click', (e) => {
                if (e.target === this.els.recordModal) this.closeRecordModal();
            });
        }
    }

    closeRecordModal() {
        if (!this.els.recordModal) return;
        this.els.recordModal.classList.remove('active');
        setTimeout(() => this.els.recordModal.close(), 300);
    }

    openRecordModal(index) {
        const record = this.currentRecords[index];
        if (!record) return;

        this.els.modalTitle.textContent = record.title;
        this.els.modalText.textContent = record.text;

        if (record.authorId) {
            this.els.modalAuthor.innerHTML = `<a href="character.html?id=${record.authorId}" class="record-author-link" title="Открыть личное дело">${record.author}</a>`;
            const link = this.els.modalAuthor.querySelector('.record-author-link');
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.els.recordModal.classList.remove('active');
                setTimeout(() => {
                    this.els.recordModal.close();
                    if (window.router) window.router.navigate(link.href);
                    else window.location.href = link.href;
                }, 200);
            });
        } else {
            this.els.modalAuthor.textContent = record.author || 'Неизвестный автор';
        }

        if (record.image) {
            this.els.modalImage.src = `assets/records/${record.categoryId}/${record.image}`;
            this.els.modalImage.style.display = 'block';
        } else {
            this.els.modalImage.style.display = 'none';
            this.els.modalImage.src = '';
        }

        this.els.recordModal.showModal();
        requestAnimationFrame(() => this.els.recordModal.classList.add('active'));
    }

    render(data, projectId, dependencies = {}) {
        this.els.tabsContainer.innerHTML = '';
        this.els.sectionsContainer.innerHTML = '';
        this.currentRecords = dependencies.records || [];
        
        const type = data.type || 'game';
        
        const config = ProjectConfig.getLayout(type);
        let isFirstTab = true;

        config.forEach(tabDef => {
            const mainHtml = tabDef.main ? tabDef.main.map(blockId => 
                WikiBlockRenderer.renderBlock(blockId, data, projectId, dependencies.teams, dependencies.records)
            ).filter(Boolean).join('') : '';
            
            const sidebarHtml = tabDef.sidebar ? tabDef.sidebar.map(blockId => 
                WikiBlockRenderer.renderBlock(blockId, data, projectId, dependencies.teams, dependencies.records)
            ).filter(Boolean).join('') : '';

            if (!mainHtml && !sidebarHtml) return;

            const tabBtn = document.createElement('button');
            tabBtn.className = `wiki-tab ${isFirstTab ? 'active' : ''}`;
            tabBtn.dataset.target = `tab-${tabDef.id}`;
            tabBtn.textContent = tabDef.label;
            this.els.tabsContainer.appendChild(tabBtn);

            const section = document.createElement('section');
            section.id = `tab-${tabDef.id}`;
            section.className = `wiki-section ${isFirstTab ? 'active' : ''}`;

            // Читаем стиль сайдбара из конфига
            const sidebarClass = tabDef.sidebarStyle === 'wide' ? 'is-wide-sidebar' : '';
            let gridHtml = `<div class="overview-grid ${sidebarHtml ? 'has-sidebar' : ''} ${sidebarClass}">`;
            
            if (sidebarHtml) {
                gridHtml += `<aside class="overview-sidebar"><div class="sticky-sidebar-wrapper">${sidebarHtml}</div></aside>`;
            }

            gridHtml += `<div class="overview-main">`;
            gridHtml += mainHtml;
            gridHtml += `</div><div class="inv-spacer"></div></div>`;
            
            section.innerHTML = gridHtml;
            this.els.sectionsContainer.appendChild(section);

            if (tabDef.main.includes('gallery') && data.assets) {
                const galleryContainer = section.querySelector('#project-screenshots');
                if (galleryContainer) {
                    this.galleryRenderer = new GalleryRenderer(this.lightbox, this.baseAssetPath, galleryContainer);
                    this.galleryRenderer.render(data.assets, projectId);
                }
            }
            
            this._initInnerTabs(section);

            isFirstTab = false; 
        });

        const recordCards = this.els.sectionsContainer.querySelectorAll('.wiki-record-card');
        recordCards.forEach(card => {
            SmartMarquee.apply(card, '.smart-marquee-text');
        });

        this.els.sectionsContainer.addEventListener('click', (e) => {
            const recordCard = e.target.closest('.wiki-record-card');
            if (recordCard) {
                const index = parseInt(recordCard.dataset.index, 10);
                this.openRecordModal(index);
            }
        });

        const tabs = this.els.tabsContainer.querySelectorAll('.wiki-tab');
        const sections = this.els.sectionsContainer.querySelectorAll('.wiki-section');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(tab.dataset.target).classList.add('active');
            });
        });
    }

    _initInnerTabs(container) {
        // Ищем все виды навигации (и обычные табы ОС, и новые кнопки Мин/Рек)
        const navs = container.querySelectorAll('.inner-tabs-nav, .req-switch-nav');
        
        navs.forEach(nav => {
            // Кнопки и контент могут быть с разными классами в зависимости от типа
            const isSwitch = nav.classList.contains('req-switch-nav');
            const btnClass = isSwitch ? '.req-switch-btn' : '.inner-tab-btn';
            const contentClass = isSwitch ? '.req-switch-content' : '.inner-tab-content';
            
            // Ищем родителя (для свитча это ближайший grid, для табов это bento-box)
            const wrapper = isSwitch ? nav.closest('.req-bento-grid') : nav.closest('.bento-box');
            
            const btns = nav.querySelectorAll(btnClass);
            const contents = wrapper.querySelectorAll(contentClass);
            
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    btns.forEach(b => b.classList.remove('active'));
                    contents.forEach(c => c.classList.remove('active'));
                    
                    btn.classList.add('active');
                    wrapper.querySelector(`#${btn.dataset.target}`).classList.add('active');
                });
            });

            // Драг-н-дроп скролл нужен только для горизонтальных табов
            if (!isSwitch) {
                let isDown = false, isDragged = false, startX, scrollLeft;

                nav.addEventListener('mousedown', (e) => {
                    isDown = true; isDragged = false; startX = e.pageX - nav.offsetLeft; scrollLeft = nav.scrollLeft;
                });
                
                const stopDrag = () => { isDown = false; nav.classList.remove('is-dragging'); };
                nav.addEventListener('mouseleave', stopDrag);
                nav.addEventListener('mouseup', stopDrag);

                nav.addEventListener('mousemove', (e) => {
                    if (!isDown) return;
                    e.preventDefault();
                    const x = e.pageX - nav.offsetLeft;
                    const walk = (x - startX) * 1.5; 
                    if (Math.abs(walk) > 3) { isDragged = true; nav.classList.add('is-dragging'); }
                    nav.scrollLeft = scrollLeft - walk;
                });

                nav.addEventListener('wheel', (e) => { e.preventDefault(); nav.scrollLeft += e.deltaY; });
                nav.addEventListener('click', (e) => { if (isDragged) { e.preventDefault(); e.stopPropagation(); } }, { capture: true });
            }
        });
    }

    showCharLoader() {
        const list = document.getElementById('wiki-characters-list');
        if (list) list.innerHTML = '<div class="spinner" style="margin: 20px auto;"></div>';
    }

    renderCharacters(charactersData) {
        const list = document.getElementById('wiki-characters-list');
        if (!list) return;
        
        list.innerHTML = '';

        charactersData.forEach(char => {
            if (!char || char === '...') return;
            
            // Ищем лучшую фотографию (глобальную или из первой версии)
            let photo = char.assets?.avatar && char.assets.avatar !== '...' ? char.assets.avatar : null;
            if (!photo && char.versions && char.versions.length > 0) {
                photo = char.versions[0].assets?.avatar && char.versions[0].assets.avatar !== '...' ? char.versions[0].assets.avatar : null;
            }
            
            // Подбираем подзаголовок (Вид -> Роль -> Засекречено)
            let subtitle = "Засекречено";
            if (char.meta?.species && char.meta.species !== '...') {
                subtitle = char.meta.species;
            } else if (char.role && char.role !== '...') {
                subtitle = char.role;
            }

            const card = document.createElement('a');
            card.href = `character.html?id=${char.id}`;
            card.className = 'char-card';
            
            // 1. Формируем одиночный аватар
            const avatarWrapper = document.createElement('div');
            avatarWrapper.className = 'char-avatar-wrapper';
            
            if (photo) {
                const img = document.createElement('img');
                img.className = 'char-img';
                img.loading = 'lazy';
                img.alt = char.name;
                img.src = `assets/characters/${char.id}/${photo}`;
                img.onerror = () => { avatarWrapper.innerHTML = this.fallbackHtml; };
                avatarWrapper.appendChild(img);
            } else {
                avatarWrapper.innerHTML = this.fallbackHtml;
            }

            // 2. Формируем инфо-блок с бегущей строкой
            const infoCol = document.createElement('div');
            infoCol.className = 'char-info-col';
            
            infoCol.innerHTML = `
                <div class="smart-marquee-wrapper">
                    <span class="char-card-name smart-marquee-text">${char.name}</span>
                </div>
                <div class="smart-marquee-wrapper">
                    <span class="char-card-subtitle smart-marquee-text">${subtitle}</span>
                </div>
            `;

            // 3. Стрелка (отключена в CSS для компактности, но DOM-нода сохранена)
            const arrow = document.createElement('div');
            arrow.className = 'char-arrow';
            arrow.innerHTML = Icons.chevron_right;

            card.appendChild(avatarWrapper);
            card.appendChild(infoCol);
            card.appendChild(arrow);
            
            card.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.router) window.router.navigate(card.href);
                else window.location.href = card.href;
            });
            
            list.appendChild(card);
        });

        // ПРИМЕНЯЕМ АНИМАЦИЮ БЕГУЩЕЙ СТРОКИ К ПЕРСОНАЖАМ
        const charCards = list.querySelectorAll('.char-card');
        charCards.forEach(card => {
            SmartMarquee.apply(card, '.smart-marquee-text');
        });

        if (list.innerHTML === '') list.parentElement.style.display = 'none';
    }
}