document.addEventListener('DOMContentLoaded', () => {
    // প্রয়োজনীয় HTML এলিমেন্টগুলো সিলেক্ট করা
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
            handleNavigation('home-btn');
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
            
            // আইটেমটি ফোল্ডার নাকি ফাইল সেই অনুযায়ী ইভেন্ট যোগ করা
            if (item.type === 'folder') {
                itemElement.addEventListener('click', () => openFolder(item.title));
            } else {
                itemElement.addEventListener('click', () => openPlayer(item));
                // স্টার করার জন্য লং প্রেস ইভেন্ট
                ['mousedown', 'touchstart'].forEach(evt => {
                    itemElement.addEventListener(evt, (e) => {
                        if (e.type === 'mousedown' && e.button !== 0) return;
                        longPressTimer = setTimeout(() => toggleStar(item), 1500);
                    });
                });
                ['mouseup', 'mouseleave', 'touchend'].forEach(evt => {
                    itemElement.addEventListener(evt, () => clearTimeout(longPressTimer));
                });
            }
            contentContainer.appendChild(itemElement);
        });
    }

    // ৩. বিভিন্ন ভিউয়ের জন্য HTML তৈরি
    const getGridViewHTML = (item) => {
        if (item.type === 'folder') {
            return `<div class="item-icon"><i class="fas fa-folder"></i></div><div class="item-name">${item.title}</div>`;
        }
        return `<img src="${item.logo}" class="item-thumbnail" alt="${item.title}" onerror="this.parentElement.innerHTML = '<div class=\\'item-icon\\'><i class=\\'fas fa-file-video\\'></i></div><div class=\\'item-name\\'>${item.title}</div>'"><div class="item-name">${item.title}</div>`;
    };

    const getListViewHTML = (item) => {
        const iconClass = item.type === 'folder' ? 'fa-folder' : 'fa-file-video';
        return `
            <div class="item-icon"><i class="fas ${iconClass}"></i></div>
            <div class="item-details">
                <div class="item-name">${item.title}</div>
                ${item.type !== 'folder' ? `<div class="modified-date">Modified ${item.modified}</div>` : ''}
            </div>`;
    };

    // ৪. প্লেয়ারের কার্যকারিতা
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

    // ৫. স্টার/ফেভারিট করার ফাংশন
    function toggleStar(item) {
        const itemIndex = starredItems.indexOf(item.id);
        if (itemIndex > -1) {
            starredItems.splice(itemIndex, 1);
        } else {
            starredItems.push(item.id);
        }
        localStorage.setItem('starredItems', JSON.stringify(starredItems));
        // স্টার করার পর কোনো ভিজ্যুয়াল পরিবর্তন হবে না, তাই re-render প্রয়োজন নেই
    }

    // ৬. ফোল্ডার খোলার ফাংশন
    function openFolder(folderName) {
        headerTitle.textContent = folderName;
        renderContent(allContent.filter(item => item.group === folderName));
        showBackButton();
    }

    // ৭. নিচের নেভিগেশন নিয়ন্ত্রণ
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
                const folderItems = categories.map(cat => ({ title: cat, type: 'folder' }));
                renderContent(folderItems);
                break;
        }
    }

    // ৮. Back বাটন দেখানো ও লুকানো
    function showBackButton() {
        backBtnContainer.innerHTML = `<button id="back-btn"><i class="fas fa-arrow-left"></i></button>`;
        document.getElementById('back-btn').addEventListener('click', () => handleNavigation('files-btn'));
    }
    function hideBackButton() {
        backBtnContainer.innerHTML = '';
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

    modal.addEventListener('click', closePlayer);
    modalContent.addEventListener('click', (e) => e.stopPropagation()); // প্লেয়ারের উপর ক্লিক করলে যেন বন্ধ না হয়

    navItems.forEach(item => item.addEventListener('click', (e) => {
        e.preventDefault();
        handleNavigation(e.currentTarget.id);
    }));
    
    // অ্যাপ্লিকেশন শুরু করা
    fetchAndParseM3U();
});
