document.addEventListener('DOMContentLoaded', function() {
    const contentContainer = document.getElementById('content-container');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');

    // m3u প্লেলিস্টের কন্টেন্ট এখানে Array হিসেবে রাখা হলো
    // পরে আপনি m3u ফাইল থেকে সরাসরি লোড করতে পারবেন
    const files = [
        { name: 'Dirilis Ertugrul-S02E20.mp4', type: 'video' },
        { name: 'Dirilis Ertugrul-S02E19.mp4', type: 'video' },
        { name: 'Dirilis Ertugrul-S02E18.mp4', type: 'video' },
        { name: 'Dirilis Ertugrul-S02E17.mp4', type: 'video' },
        { name: 'Dirilis Ertugrul-S02E16.mp4', type: 'video' },
        { name: 'Dirilis Ertugrul-S02E15.mp4', type: 'video' },
        { name: 'Important Document.pdf', type: 'file' },
        { name: 'My Photo.jpg', type: 'image' },
    ];

    // কন্টেন্ট আইটেম তৈরি এবং দেখানোর ফাংশন
    function renderContent() {
        contentContainer.innerHTML = ''; // পুরোনো কন্টেন্ট মুছে ফেলা হলো

        files.forEach(file => {
            const item = document.createElement('div');
            item.className = 'content-item';

            // ফাইলের ধরন অনুযায়ী আইকন পরিবর্তন
            let iconClass = 'fa-file'; // ডিফল্ট আইকন
            if (file.type === 'video') {
                iconClass = 'fa-file-video';
            } else if (file.type === 'image') {
                iconClass = 'fa-file-image';
            }

            item.innerHTML = `
                <div class="item-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="item-name">${file.name}</div>
            `;
            contentContainer.appendChild(item);
        });
    }

    // গ্রিড ভিউ বাটন ক্লিক করলে
    gridViewBtn.addEventListener('click', () => {
        contentContainer.classList.remove('list-view');
        contentContainer.classList.add('grid-view');
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    });

    // লিস্ট ভিউ বাটন ক্লিক করলে
    listViewBtn.addEventListener('click', () => {
        contentContainer.classList.remove('grid-view');
        contentContainer.classList.add('list-view');
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
    });

    // প্রথমবার পেজ লোড হওয়ার সময় কন্টেন্ট দেখানো
    renderContent();
});
