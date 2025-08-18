document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const contentContainer = document.getElementById('content-container');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    const headerTitle = document.getElementById('header-title');
    const modal = document.getElementById('player-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const iframePlayer = document.getElementById('iframe-player');
    const videoJsPlayerEl = document.getElementById('video-js-player');
    
    // Navigation Buttons
    const navButtons = {
        home: document.getElementById('home-btn'),
        star: document.getElementById('star-btn'),
        shared: document.getElementById('shared-btn'),
        files: document.getElementById('files-btn')
    };

    let videoPlayer; // Video.js player instance
    let allContent = []; // সব কন্টেন্ট এখানে থাকবে
    let lastModifiedDate = ''; // M3U ফাইলের মডিফাইড তারিখ
    let starredItems = JSON.parse(localStorage.getItem('starredItems')) || []; // Star করা আইটেম

    // 1. M3U ফাইল থেকে ডেটা পার্স করার ফাংশন
    async function parseM3U() {
        try {
            const response = await fetch('playlist.m3u');
            if (!response.ok) throw new Error('Playlist not found!');
            
            const m3uText = await response.text();
            lastModifiedDate = new Date(response.headers.get('Last-Modified')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const lines = m3uText.trim().split('\n');
            const items = [];
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('#EXTINF')) {
                    const infoLine = lines[i];
                    const url = lines[++i]?.trim();
                    if (!url) continue;

                    const title = infoLine.split(',').pop();
                    const logo = infoLine.match(/tvg-logo="([^"]*)"/)?.[1] || '';
                    const group = infoLine.match(/group-title="([^"]*)"/)?.[1] || 'Uncategorized';
                    const type = infoLine.match(/tvg-type="([^"]*)"/)?.[1] || 'video';
                    
                    items.push({
                        id: url + title, // Unique ID
                        title, logo, group, type, url, modified: lastModifiedDate
                    });
                }
            }
            return items;
        } catch (error) {
            contentContainer.innerHTML = `<p style="text-align:center;">Error: ${error.message}</p>`;
            return [];
        }
    }

    // 2. কন্টেন্ট দেখানোর ফাংশন
    function renderContent(items) {
        contentContainer.innerHTML = '';
        if (items.length === 0) {
            contentContainer.innerHTML = `<p style="text-align:center;">No items to display.</p>`;
            return;
        }

        const isGridView = contentContainer.classList.contains('grid-view');

        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'content-item';

            let html = '';
            if (isGridView) {
                // Grid View
                html = `
                    <img src="${item.logo}" class="item-thumbnail" onerror="this.src='https://via.placeholder.com/150x100?text=No+Image'">
                    <div class="item-name">${item.title}</div>
                `;
            } else {
                // List View
                html = `
                    <div class="item-icon"><i class="fas fa-file-video"></i></div>
                    <div class="item-details">
                        <div class="item-name">${item.title}</div>
                        <div class="modified-date">Modified ${item.modified}</div>
                    </div>
                `;
            }
            
            itemElement.innerHTML = html;

            // Star indicator
            if (starredItems.includes(item.id)) {
                const starEl = document.createElement('div');
                starEl.className = 'star-indicator';
                starEl.innerHTML = '<i class="fas fa-star"></i>';
                itemElement.appendChild(starEl);
            }

            // --- Event Listeners ---
            itemElement.addEventListener('click', () => openPlayer(item));
            
            // Long press for Star
            let pressTimer;
            itemElement.addEventListener('mousedown', () => {
                pressTimer = window.setTimeout(() => toggleStar(item), 1500);
            });
            itemElement.addEventListener('mouseup', () => clearTimeout(pressTimer));
            itemElement.addEventListener('mouseleave', () => clearTimeout(pressTimer));
            itemElement.addEventListener('touchstart', () => {
                pressTimer = window.setTimeout(() => toggleStar(item), 1500);
            });
            itemElement.addEventListener('touchend', () => clearTimeout(pressTimer));


            contentContainer.appendChild(itemElement);
        });
    }
    
    // 3. Player খোলার ফাংশন
    function openPlayer(item) {
        modal.style.display = 'flex';
        if (item.type === 'iframe') {
            videoJsPlayerEl.style.display = 'none';
            iframePlayer.style.display = 'block';
            iframePlayer.src = item.url;
        } else {
            iframePlayer.style.display = 'none';
            videoJsPlayerEl.style.display = 'block';
            if (!videoPlayer) {
                videoPlayer = videojs(videoJsPlayerEl);
            }
            videoPlayer.src({ src: item.url });
            videoPlayer.play();
        }
    }
    
    // 4. Player বন্ধ করার ফাংশন
    function closePlayer() {
        modal.style.display = 'none';
        iframePlayer.src = '';
        if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer.src('');
        }
    }

    // 5. Star যোগ বা বাতিল করার ফাংশন
    function toggleStar(item) {
        const itemIndex = starredItems.indexOf(item.id);
        if (itemIndex > -1) {
            starredItems.splice(itemIndex, 1); // Remove star
        } else {
            starredItems.push(item.id); // Add star
        }
        localStorage.setItem('starredItems', JSON.stringify(starredItems));
        
        // Refresh the current view to show star status
        const currentActiveNav = document.querySelector('.nav-item.active').id;
        document.getElementById(currentActiveNav).click();

        alert(`'${item.title}' ${itemIndex > -1 ? 'removed from' : 'added to'} Starred.`);
    }

    // 6. নেভিগেশন কন্ট্রোল
    function handleNavigation(event) {
        event.preventDefault();
        const targetId = event.currentTarget.id;
        
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');

        switch(targetId) {
            case 'home-btn':
                headerTitle.textContent = 'Home';
                renderContent(allContent); // Home এ সব দেখাবে
                break;
            case 'star-btn':
                headerTitle.textContent = 'Starred';
                const starredContent = allContent.filter(item => starredItems.includes(item.id));
                renderContent(starredContent);
                break;
            case 'shared-btn':
                 headerTitle.textContent = 'Shared';
                 // আপাতত লিঙ্ক কপি করার 기능 যোগ করা হলো
                 navigator.clipboard.writeText(window.location.href).then(() => {
                     alert('Website link copied to clipboard!');
                 });
                 renderContent([]); // Shared এর জন্য কোনো কন্টেন্ট নেই
                break;
            case 'files-btn':
                headerTitle.textContent = 'Categories';
                // এখানে সব ক্যাটাগরি ফোল্ডার হিসেবে দেখানো হবে
                const categories = [...new Set(allContent.map(item => item.group))];
                const categoryItems = categories.map(cat => ({
                    id: cat, title: cat, type: 'folder', logo: 'https://via.placeholder.com/150x100?text=Folder'
                }));
                // আপাতত folder view বানাচ্ছি না, তাই সব কন্টেন্ট দেখালাম।
                // এটি পরবর্তী ধাপের জন্য রাখা হলো।
                renderContent(allContent); 
                break;
        }
    }

    // --- Initial Setup ---
    // View toggles
    gridViewBtn.addEventListener('click', () => {
        contentContainer.classList.remove('list-view');
        contentContainer.classList.add('grid-view');
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        document.querySelector('.nav-item.active').click(); // Refresh view
    });

    listViewBtn.addEventListener('click', () => {
        contentContainer.classList.add('list-view');
        contentContainer.classList.remove('grid-view');
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        document.querySelector('.nav-item.active').click(); // Refresh view
    });

    // Modal close button
    closeModalBtn.addEventListener('click', closePlayer);

    // Add navigation listeners
    for (const key in navButtons) {
        navButtons[key].addEventListener('click', handleNavigation);
    }
    
    // Initial Load
    allContent = await parseM3U();
    renderContent(allContent.slice().reverse()); // Home এ নতুন আইটেম আগে দেখাবে
});
