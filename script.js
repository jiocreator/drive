document.addEventListener('DOMContentLoaded', () => {
    const contentContainer = document.getElementById('content-container');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    const headerTitle = document.getElementById('header-title');
    const backBtnContainer = document.getElementById('back-button-container');
    const modal = document.getElementById('player-modal');
    const modalContent = document.querySelector('.modal-content');
    const iframePlayer = document.getElementById('iframe-player');
    const videoJsPlayerEl = document.getElementById('video-js-player');
    const navItems = document.querySelectorAll('.nav-item');

    let videoPlayer;
    let allContent = [];
    let starredItems = JSON.parse(localStorage.getItem('starredItems')) || [];
    let currentViewItems = [];
    let longPressTimer;

    async function fetchAndParseM3U() {
        try {
            const response = await fetch('playlist.m3u');
            if (!response.ok) throw new Error('Playlist file (playlist.m3u) not found.');
            
            const m3uText = await response.text();
            const lastMod = response.headers.get('Last-Modified');
            const lastModifiedDate = lastMod ? new Date(lastMod).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A';

            const lines = m3uText.trim().split('\n');
            const items = [];
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('#EXTINF')) {
                    const infoLine = lines[i];
                    const url = lines[++i]?.trim();
                    if (!url) continue;

                    const title = infoLine.split(',').pop() || 'Untitled';
                    const logo = infoLine.match(/tvg-logo="([^"]*)"/)?.[1] || '';
                    const group = infoLine.match(/group-title="([^"]*)"/)?.[1] || 'Uncategorized';
                    const type = infoLine.match(/tvg-type="([^"]*)"/)?.[1] || 'video';
                    
                    items.push({ id: url + title, title, logo, group, type, url, modified: lastModifiedDate });
                }
            }
            allContent = items;
            handleNavigation('home-btn');
        } catch (error) {
            contentContainer.innerHTML = `<p style="text-align:center; color: red;">Error: ${error.message}</p>`;
        }
    }

    function renderContent(items) {
        currentViewItems = items;
        contentContainer.innerHTML = '';
        if (!items || items.length === 0) {
            contentContainer.innerHTML = `<p style="text-align:center;">No items to display.</p>`;
            return;
        }

        const isGridView = contentContainer.classList.contains('grid-view');
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'content-item';
            
            itemElement.innerHTML = isGridView ? getGridViewHTML(item) : getListViewHTML(item);
            
            if (item.isFolder) {
                itemElement.addEventListener('click', () => openFolder(item.title));
            } else {
                itemElement.addEventListener('click', () => openPlayer(item));
                ['mousedown', 'touchstart'].forEach(evt => {
                    itemElement.addEventListener(evt, (e) => {
                        if (e.type === 'mousedown' && e.button !== 0) return;
                        longPressTimer = setTimeout(() => {
                            toggleStar(item);
                            alert(`'${item.title}' has been ${starredItems.includes(item.id) ? 'added to' : 'removed from'} Starred.`);
                        }, 1500);
                    }, { passive: true });
                });
                ['mouseup', 'mouseleave', 'touchend'].forEach(evt => {
                    itemElement.addEventListener(evt, () => clearTimeout(longPressTimer));
                });
            }
            contentContainer.appendChild(itemElement);
        });
    }
    
    const getGridViewHTML = (item) => {
        if (item.isFolder) {
            return `<div class="item-icon"><i class="fas fa-folder"></i></div><div class="item-name">${item.title}</div>`;
        }
        return `<img src="${item.logo}" class="item-thumbnail" alt="${item.title}" onerror="this.parentElement.innerHTML = '<div class=\\'item-icon\\'><i class=\\'fas fa-file-video\\'></i></div><div class=\\'item-name\\'>${item.title}</div>'"><div class="item-name">${item.title}</div>`;
    };

    const getListViewHTML = (item) => {
        const iconClass = item.isFolder ? 'fa-folder' : 'fa-file-video';
        return `
            <div class="item-icon"><i class="fas ${iconClass}"></i></div>
            <div class="item-details">
                <div class="item-name">${item.title}</div>
                ${!item.isFolder ? `<div class="modified-date">Modified ${item.modified}</div>` : ''}
            </div>`;
    };

    function openPlayer(item) {
        clearTimeout(longPressTimer);
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        if (item.type === 'iframe') {
            videoJsPlayerEl.style.display = 'none';
            iframePlayer.style.display = 'block';
            iframePlayer.src = item.url;
        } else {
            iframePlayer.style.display = 'none';
            videoJsPlayerEl.style.display = 'block';
            if (!videoPlayer) {
                videoPlayer = videojs(videoJsPlayerEl, { responsive: true, fluid: true });
            }
            videoPlayer.src({ src: item.url });
            videoPlayer.play();
        }
    }

    function closePlayer() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        iframePlayer.src = 'about:blank';
        if (videoPlayer) videoPlayer.pause();
    }

    function toggleStar(item) {
        const itemIndex = starredItems.indexOf(item.id);
        if (itemIndex > -1) {
            starredItems.splice(itemIndex, 1);
        } else {
            starredItems.push(item.id);
        }
        localStorage.setItem('starredItems', JSON.stringify(starredItems));
    }

    function openFolder(folderName) {
        headerTitle.textContent = folderName;
        renderContent(allContent.filter(item => item.group === folderName));
        showBackButton();
    }

    function handleNavigation(targetId) {
        navItems.forEach(btn => btn.classList.remove('active'));
        document.getElementById(targetId)?.classList.add('active');
        hideBackButton();

        switch(targetId) {
            case 'home-btn':
                headerTitle.textContent = 'Home';
                renderContent([...allContent].reverse());
                break;
            case 'star-btn':
                headerTitle.textContent = 'Starred';
                renderContent(allContent.filter(item => starredItems.includes(item.id)));
                break;
            case 'shared-btn':
                 headerTitle.textContent = 'Share';
                 navigator.clipboard.writeText(window.location.href).then(() => alert('Website link copied!'));
                 renderContent([]);
                break;
            case 'files-btn':
                headerTitle.textContent = 'Files';
                const categories = [...new Set(allContent.map(item => item.group))];
                const folderItems = categories.map(cat => ({ title: cat, isFolder: true }));
                renderContent(folderItems);
                break;
        }
    }

    function showBackButton() {
        backBtnContainer.innerHTML = `<button id="back-btn"><i class="fas fa-arrow-left"></i></button>`;
        document.getElementById('back-btn').addEventListener('click', () => {
            const currentActiveId = document.querySelector('.nav-item.active')?.id || 'home-btn';
            handleNavigation(currentActiveId);
        });
    }
    function hideBackButton() {
        backBtnContainer.innerHTML = '';
    }

    gridViewBtn.addEventListener('click', () => {
        if (contentContainer.classList.contains('grid-view')) return;
        contentContainer.className = 'grid-view';
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        renderContent(currentViewItems);
    });
    listViewBtn.addEventListener('click', () => {
        if (contentContainer.classList.contains('list-view')) return;
        contentContainer.className = 'list-view';
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        renderContent(currentViewItems);
    });

    modal.addEventListener('click', closePlayer);
    modalContent.addEventListener('click', (e) => e.stopPropagation());

    navItems.forEach(item => item.addEventListener('click', (e) => {
        e.preventDefault();
        handleNavigation(e.currentTarget.id);
    }));
    
    fetchAndParseM3U();
});
