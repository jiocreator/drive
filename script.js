document.addEventListener('DOMContentLoaded', () => {
    // প্রয়োজনীয় HTML এলিমেন্টগুলো সিলেক্ট করা
    const contentContainer = document.getElementById('content-container');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    const headerTitle = document.getElementById('header-title');
    const modal = document.getElementById('player-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const iframePlayer = document.getElementById('iframe-player');
    const videoJsPlayerEl = document.getElementById('video-js-player');
    const navItems = document.querySelectorAll('.nav-item');

    let videoPlayer;
    let allContent = [];
    let starredItems = JSON.parse(localStorage.getItem('starredItems')) || [];
    let currentViewItems = [];
    let longPressTimer;

    // ১. M3U প্লেলিস্ট লোড এবং পার্স করা
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
            handleNavigation('home-btn'); // ডিফল্টভাবে Home ভিউ দেখানো
        } catch (error) {
            contentContainer.innerHTML = `<p style="text-align:center; color: red;">Error: ${error.message}</p>`;
        }
    }

    // ২. DOM-এ কন্টেন্ট দেখানো
    function renderContent(items) {
        currentViewItems = items;
        contentContainer.innerHTML = '';
        if (items.length === 0) {
            contentContainer.innerHTML = `<p style="text-align:center;">No items to display.</p>`;
            return;
        }

        const isGridView = contentContainer.classList.contains('grid-view');
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'content-item';
            
            itemElement.innerHTML = isGridView ? getGridViewHTML(item) : getListViewHTML(item);

            if (starredItems.includes(item.id)) {
                itemElement.insertAdjacentHTML('beforeend', '<div class="star-indicator"><i class="fas fa-star"></i></div>');
            }

            // ইভেন্ট লিসেনার যোগ করা
            itemElement.addEventListener('click', () => openPlayer(item));
            
            // স্টার করার জন্য লং প্রেস ইভেন্ট
            ['mousedown', 'touchstart'].forEach(evt => {
                itemElement.addEventListener(evt, (e) => {
                    if (e.type === 'mousedown' && e.button !== 0) return; // শুধু লেফট ক্লিক
                    longPressTimer = setTimeout(() => toggleStar(item), 1500);
                });
            });
            ['mouseup', 'mouseleave', 'touchend'].forEach(evt => {
                itemElement.addEventListener(evt, () => clearTimeout(longPressTimer));
            });

            contentContainer.appendChild(itemElement);
        });
    }

    // গ্রিড ভিউ আইটেমের জন্য HTML
    const getGridViewHTML = (item) => `
        <img src="${item.logo}" class="item-thumbnail" alt="${item.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTUwIDEwMCI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlYWVhZWEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjY2NjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'">
        <div class="item-name">${item.title}</div>`;

    // লিস্ট ভিউ আইটেমের জন্য HTML
    const getListViewHTML = (item) => `
        <div class="item-icon"><i class="fas fa-file-video"></i></div>
        <div class="item-details">
            <div class="item-name">${item.title}</div>
            <div class="modified-date">Modified ${item.modified}</div>
        </div>`;

    // ৩. প্লেয়ারের কার্যকারিতা
    function openPlayer(item) {
        clearTimeout(longPressTimer); // ক্লিক করলে যেন স্টার না হয়
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

    // ৪. স্টার/ফেভারিট করার ফাংশন
    function toggleStar(item) {
        const itemIndex = starredItems.indexOf(item.id);
        if (itemIndex > -1) {
            starredItems.splice(itemIndex, 1);
        } else {
            starredItems.push(item.id);
        }
        localStorage.setItem('starredItems', JSON.stringify(starredItems));
        renderContent(currentViewItems); // বর্তমান ভিউ রি-রেন্ডার করা
    }

    // ৫. নিচের নেভিগেশন নিয়ন্ত্রণ
    function handleNavigation(targetId) {
        navItems.forEach(btn => btn.classList.remove('active'));
        document.getElementById(targetId)?.classList.add('active');

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
                 renderContent([]); // শেয়ারের জন্য কোনো কন্টেন্ট নেই
                break;
            case 'files-btn':
                headerTitle.textContent = 'All Files';
                renderContent(allContent);
                break;
        }
    }

    // --- প্রাথমিক সেটআপ এবং ইভেন্ট লিসেনার ---
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

    closeModalBtn.addEventListener('click', closePlayer);
    navItems.forEach(item => item.addEventListener('click', (e) => {
        e.preventDefault();
        handleNavigation(e.currentTarget.id);
    }));
    
    // অ্যাপ্লিকেশন শুরু করা
    fetchAndParseM3U();
});
