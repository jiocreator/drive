document.addEventListener('DOMContentLoaded', function() {
    const contentContainer = document.getElementById('content-container');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    const filesBtn = document.getElementById('files-btn');

    // ফোল্ডার এবং ফাইলগুলোর ডেটা
    const allContent = [
        { name: 'Class 11-12', type: 'folder', modified: 'Apr 9' },
        { name: 'CoinbaseWalletBackups', type: 'folder', modified: 'Feb 22' },
        { name: 'Dirilis Ertugrul-S02E20.mp4', type: 'file', fileType: 'video' },
        { name: 'Important Document.pdf', type: 'file', fileType: 'pdf' },
        { name: 'My Photo.jpg', type: 'file', fileType: 'image' },
    ];

    // কন্টেন্ট দেখানোর ফাংশন
    function renderContent(items) {
        contentContainer.innerHTML = ''; // পুরোনো কন্টেন্ট মুছে ফেলা

        items.forEach(itemData => {
            const itemElement = document.createElement('div');
            itemElement.className = 'content-item';

            let iconHtml = '';
            let nameHtml = '';

            // আইটেমটি ফোল্ডার নাকি ফাইল, তার উপর ভিত্তি করে HTML তৈরি
            if (itemData.type === 'folder') {
                iconHtml = `<div class="item-icon folder-icon"><i class="fas fa-folder"></i></div>`;
                
                // লিস্ট ভিউতে Modified Date দেখানোর জন্য
                if (contentContainer.classList.contains('list-view')) {
                    nameHtml = `
                        <div class="item-details">
                            <div class="item-name">${itemData.name}</div>
                            <div class="modified-date">Modified ${itemData.modified}</div>
                        </div>
                    `;
                } else {
                    nameHtml = `<div class="item-name">${itemData.name}</div>`;
                }

            } else if (itemData.type === 'file') {
                let fileIconClass = 'fa-file'; // ডিফল্ট ফাইল আইকন
                if (itemData.fileType === 'video') fileIconClass = 'fa-file-video';
                if (itemData.fileType === 'pdf') fileIconClass = 'fa-file-pdf';
                if (itemData.fileType === 'image') fileIconClass = 'fa-file-image';
                
                iconHtml = `<div class="item-icon file-icon"><i class="fas ${fileIconClass}"></i></div>`;
                nameHtml = `<div class="item-name">${itemData.name}</div>`;
            }
            
            itemElement.innerHTML = iconHtml + nameHtml;
            contentContainer.appendChild(itemElement);
        });
    }

    // গ্রিড ভিউতে পরিবর্তন
    gridViewBtn.addEventListener('click', () => {
        contentContainer.classList.remove('list-view');
        contentContainer.classList.add('grid-view');
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        renderContent(allContent); // ভিউ পরিবর্তনের পর আবার রেন্ডার করা
    });

    // লিস্ট ভিউতে পরিবর্তন
    listViewBtn.addEventListener('click', () => {
        contentContainer.classList.remove('grid-view');
        contentContainer.classList.add('list-view');
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        renderContent(allContent); // ভিউ পরিবর্তনের পর আবার রেন্ডার করা
    });
    
    // Files বাটনে ক্লিক করলে সব কন্টেন্ট দেখানো
    filesBtn.addEventListener('click', (e) => {
        e.preventDefault(); // লিঙ্কের ডিফল্ট আচরণ বন্ধ করা
        
        // সব নেভিগেশন আইটেম থেকে active ক্লাস মুছে ফেলা
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        // শুধুমাত্র Files বাটনে active ক্লাস যোগ করা
        filesBtn.classList.add('active');

        renderContent(allContent);
    });

    // প্রথমবার পেজ লোড হওয়ার সময় Files দেখানো
    renderContent(allContent);
});

