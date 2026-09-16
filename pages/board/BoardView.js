import { PostActionsHelper } from '../../shared/js/PostActionsHelper.js';
import { BoardContextMenu } from './BoardContextMenu.js';
import { Icons } from '../../shared/js/icons.js';

export class BoardView {
    constructor() {
        this.els = {
            container: document.getElementById('board-container'),
            viewport: document.getElementById('board-viewport'),
            nodesContainer: document.getElementById('board-nodes'),
            edgesContainer: document.getElementById('board-edges'),
            btnZoomIn: document.getElementById('board-zoom-in'),
            btnZoomOut: document.getElementById('board-zoom-out'),
            btnZoomReset: document.getElementById('board-zoom-reset'),
            welcomeMsg: document.getElementById('board-welcome-message'),
            welcomeCloseBtn: document.getElementById('board-welcome-close')
        };
        
        this.contextMenu = new BoardContextMenu();
        this._initWelcomeMessage();
        
        document.addEventListener('mousedown', (e) => {
            if (this.contextMenu.element && !this.contextMenu.contains(e.target)) {
                this.closeEdgeContextMenu();
            }
        });
    }

    _initWelcomeMessage() {
        if (this.els.welcomeMsg && this.els.welcomeCloseBtn) {
            this.els.welcomeCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.els.welcomeMsg.style.opacity = '0';
                this.els.welcomeMsg.style.transform = 'translate(-50%, -15px)';
                setTimeout(() => {
                    if (this.els.welcomeMsg) this.els.welcomeMsg.remove();
                }, 300);
            });
        }
    }

    showEdgeContextMenu(edgeId, clientX, clientY, currentEdgeData, callbacks) {
        this.contextMenu.show(edgeId, clientX, clientY, currentEdgeData, callbacks);
    }

    closeEdgeContextMenu() {
        this.contextMenu.close();
    }

    updateZoomText(scale) {
        const percentage = Math.round(scale * 100);
        this.els.btnZoomReset.textContent = `${percentage}%`;
    }

    createNodeDOM(id, x, y, htmlSnapshot, postData, callbacks) {
        const nodeEl = document.createElement('div');
        
        let typeClass = 'is-post';
        if (htmlSnapshot.includes('card-vertical')) {
            typeClass = 'is-vertical-card';
        } else if (htmlSnapshot.includes('card-horizontal')) {
            typeClass = 'is-horizontal-card';
        }

        nodeEl.className = `board-node ${typeClass}`;
        nodeEl.dataset.nodeId = id;
        nodeEl.style.left = `${x}px`;
        nodeEl.style.top = `${y}px`;

        nodeEl.innerHTML = `
            <div class="pin-zone top" data-side="top"></div>
            <div class="pin-zone right" data-side="right"></div>
            <div class="pin-zone bottom" data-side="bottom"></div>
            <div class="pin-zone left" data-side="left"></div>
            
            <div class="node-drag-handle">
                <div class="ndh-left">
                    <div class="ndh-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
                        Улика #${id.substring(0, 5)}
                    </div>
                </div>
                <div class="ndh-right">
                    <button class="ndh-action ndh-close" title="Убрать с доски">
                        ${Icons.inv_trash || 'X'}
                    </button>
                </div>
            </div>
            <div class="node-content">
                ${htmlSnapshot}
            </div>
        `;

        const closeBtn = nodeEl.querySelector('.ndh-close');
        closeBtn.addEventListener('click', () => {
            if (callbacks.onCloseClick) callbacks.onCloseClick(id);
        });

        nodeEl.addEventListener('mouseenter', () => {
            if (callbacks.onHoverStateChange) callbacks.onHoverStateChange(id);
        });
        nodeEl.addEventListener('mouseleave', () => {
            if (callbacks.onHoverStateChange) callbacks.onHoverStateChange(id);
        });

        const images = nodeEl.querySelectorAll('.img-media');
        images.forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', (e) => {
                e.stopPropagation(); 
                if (window.globalLightbox) window.globalLightbox.open(img.src);
            });
        });

        const quoteCard = nodeEl.querySelector('.quote-card');
        if (quoteCard && postData && postData.referenceUrl) {
            quoteCard.style.cursor = 'pointer';
            quoteCard.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(postData.referenceUrl, '_blank', 'noopener,noreferrer');
            });
        }

        const videoThumbs = nodeEl.querySelectorAll('.video-thumb-wrapper');
        videoThumbs.forEach(wrapper => {
            wrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                const img = wrapper.querySelector('img');
                if (img && img.src.includes('img.youtube.com/vi/')) {
                    const match = img.src.match(/vi\/([^\/]+)\//);
                    if (match && match[1] && window.globalLightbox) {
                        window.globalLightbox.open(`https://youtu.be/${match[1]}`, true);
                    }
                } else if (postData && postData.authorHandle) {
                    const cleanHandle = postData.authorHandle.replace('@', '');
                    const cleanId = postData.id.split('#')[0]; 
                    window.open(`https://twitter.com/${cleanHandle}/status/${cleanId}`, '_blank', 'noopener,noreferrer');
                }
            });
        });

        PostActionsHelper.bindActions(nodeEl, postData);
        PostActionsHelper.bindSliders(nodeEl);

        if (postData && ['game', 'book', 'movie'].includes(postData.type)) {
             const catalogCard = nodeEl.querySelector('.card-horizontal, .card-vertical');
             if (catalogCard) {
                 catalogCard.style.cursor = 'pointer';
                 catalogCard.title = 'Открыть информацию о проекте';
                 catalogCard.addEventListener('click', (e) => {
                     e.stopPropagation();
                     window.open(`?page=project&id=${postData.id}`, '_blank');
                 });
             }
        }

        this.els.nodesContainer.appendChild(nodeEl);
    }

    updateNodePins(nodeId, edges) {
        const nodeEl = this.els.nodesContainer.querySelector(`[data-node-id="${nodeId}"]`);
        if (!nodeEl) return;

        ['top', 'right', 'bottom', 'left'].forEach(side => {
            const zone = nodeEl.querySelector(`.pin-zone.${side}`);
            if (!zone) return;

            const sideEdges = edges.filter(e => 
                (e.from === nodeId && e.fromSide === side) || 
                (e.to === nodeId && e.toSide === side)
            );

            zone.innerHTML = ''; 

            if (sideEdges.length === 0) {
                zone.classList.remove('has-connections');
                zone.innerHTML = `<div class="node-pin" data-side="${side}"></div>`;
            } else {
                zone.classList.add('has-connections');
                let html = '';
                sideEdges.forEach(e => {
                    const color = e.color || '#ff4444';
                    html += `<div class="node-pin is-connected" data-side="${side}" data-edge-id="${e.id}" style="background:${color}; border-color:${color}; box-shadow: 0 0 10px ${color}80;"></div>`;
                });
                html += `<div class="node-pin is-empty" data-side="${side}"></div>`;
                zone.innerHTML = html;
            }
        });
    }

    removeNodeDOM(id) {
        const nodeEl = this.els.nodesContainer.querySelector(`[data-node-id="${id}"]`);
        if (nodeEl) nodeEl.remove();
    }
}