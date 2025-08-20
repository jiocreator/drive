document.addEventListener('DOMContentLoaded', () => {
    // আপনার m3u প্লেলিস্টের লিংক এখানে দিন
    const m3uUrl = 'playlist.m3u'; // উদাহরণ হিসেবে একটি লিংক দেওয়া হলো

    const gridContainer = document.getElementById('video-grid');
    const playerModal = document.getElementById('player-modal');
    const playerContainer = document.getElementById('player-container');
    const closeModalBtn = document.querySelector('.close-modal');
    const customSelect = document.querySelector('.custom-select');
    const selectTrigger = document.querySelector('.select-trigger span');
    const optionsContainer = document.querySelector('.custom-options');

    let allVideos = [];
    let flowplayerInstance = null;

    // M3U ফাইল থেকে ডেটা আনা এবং পার্স করা
    const fetchAndParseM3U = async () => {
        try {
            const response = await fetch(m3uUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.text();

            const lines = data.trim().split('\n');
            const videos = [];
            let currentVideo = {};

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('#EXTINF:')) {
                    // মেটাডেটা পার্স করা
                    const nameMatch = line.match(/tvg-name="([^"]*)"/);
                    const logoMatch = line.match(/tvg-logo="([^"]*)"/);
                    const groupMatch = line.match(/group-title="([^"]*)"/);

                    currentVideo = {
                        name: nameMatch ? nameMatch[1] : 'Untitled',
                        thumbnail: logoMatch ? logoMatch[1] : 'placeholder.png', // ডিফল্ট ছবি
                        category: groupMatch ? groupMatch[1] : 'Uncategorized',
                    };
                } else if (line && !line.startsWith('#')) {
                    // ভিডিও লিংক পাওয়া গেলে যোগ করা
                    currentVideo.videoLink = line;
                    videos.push(currentVideo);
                    currentVideo = {};
                }
            }
            allVideos = videos;
            populateCategories();
            renderGrid(); // শুরুতে সব ভিডিও দেখানো
        } catch (error) {
            gridContainer.innerHTML = `<p style="color: red;">Error loading playlist: ${error.message}</p>`;
            console.error('Failed to fetch M3U:', error);
        }
    };

    // ক্যাটাগরি দিয়ে ভিডিও গ্রিড তৈরি করা
    const renderGrid = (category = 'All Categories') => {
        gridContainer.innerHTML = '';
        const videosToRender = category === 'All Categories' 
            ? allVideos 
            : allVideos.filter(video => video.category === category);

        videosToRender.forEach(video => {
            const card = document.createElement('div');
            card.className = 'video-card';
            card.dataset.videoLink = video.videoLink; // ভিডিও লিংক ডেটাসেটে রাখা
            
            card.innerHTML = `
                <div class="thumbnail-container">
                    <img src="${video.thumbnail}" alt="${video.name}" onerror="this.src='https://via.placeholder.com/400x225.png?text=No+Image'">
                </div>
                <h3 class="card-title">${video.name}</h3>
            `;
            gridContainer.appendChild(card);
        });
    };
    
    // ক্যাটাগরি তালিকা তৈরি করা
    const populateCategories = () => {
        const categories = ['All Categories', ...new Set(allVideos.map(v => v.category))];
        optionsContainer.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('div');
            option.className = 'custom-option';
            option.textContent = category;
            option.dataset.value = category;
            optionsContainer.appendChild(option);
        });
    };

    // কাস্টম সিলেক্টরের ইভেন্ট
    customSelect.addEventListener('click', (e) => {
        if (e.target.classList.contains('custom-option')) {
            const selectedCategory = e.target.dataset.value;
            selectTrigger.textContent = selectedCategory;
            renderGrid(selectedCategory);
        }
        customSelect.classList.toggle('open');
    });

    // ভিডিও কার্ডে ক্লিক করলে প্লেয়ার চালু করা
    gridContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.video-card');
        if (card) {
            const videoUrl = card.dataset.videoLink;
            playerModal.classList.remove('hidden');
            
            if (flowplayerInstance) {
                flowplayerInstance.load({ src: videoUrl, type: "application/x-mpegurl" });
            } else {
                flowplayerInstance = flowplayer(playerContainer, {
                    src: videoUrl,
                    type: "application/x-mpegurl", // HLS/M3U8
                    autoplay: true,
                    // আপনি Flowplayer-এর আরও অপশন এখানে যোগ করতে পারেন
                });
            }
        }
    });

    // মডাল বন্ধ করা
    closeModalBtn.addEventListener('click', () => {
        playerModal.classList.add('hidden');
        if (flowplayerInstance) {
            flowplayerInstance.stop();
        }
    });

    // 초기 실행
    fetchAndParseM3U();
});
