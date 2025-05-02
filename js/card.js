let billionaireList = [];
let name = {};
let scrollPos = 0;
let scrollSpeed = 1.5;
let scrollPaused = false;
let cardW, totalW;

document.addEventListener('DOMContentLoaded', function() {
    const cardContainer = document.querySelector('.container');
    
    fetch('dataset/top10_billionaires_profile_cards.csv')
        .then(res => res.text())
        .then(data => {
            const rows = data.split('\n');
            const headerRow = rows[0].split(',');
            console.log('CSV headers:', headerRow);
            
            for (let i = 1; i < rows.length; i++) {
                const rowData = rows[i].split(',');
                const fName = rowData[0].split(' ')[0];
                
                const personData = {
                    fullName: rowData[0],
                    age: parseInt(rowData[1]),
                    gender: rowData[2],
                    country: rowData[3],
                    netWorth: parseFloat(rowData[4]),
                    sector: rowData[5],
                    imgSrc: getImg(fName)
                };
                billionaireList.push(personData);
                name[fName] = personData;
            }

            const modalBox = document.createElement('div');
            modalBox.className = 'modal-container';
            modalBox.style.display = 'none';
            document.body.appendChild(modalBox);
            
            initCards();
            beginScrolling();
        })
        .catch(err => console.error('Couldnt load csv data', err));
    
    function getImg(fName) {
        const fileTypes = {
            'Elon': 'jpg',
            'Bernard': 'jpg',
            'Giovanni': 'webp',
            'Amancio': 'jpeg',
            'Dieter': 'jpg',
            'David': 'webp',
            'Carlos': 'jpeg',
            'Mukesh': 'webp',
            'Vladimir': 'jpeg',
            'Zhong': 'webp'
        };
        const fileExt = fileTypes[fName] || 'jpg';
        return `./imgs/top10_billionaires_images/${fName}.${fileExt}`;
    }
    
    function initCards() {
        document.querySelectorAll('.image').forEach((imgDiv, idx) => {
            const img = imgDiv.querySelector('img');
            const src = img.getAttribute('src');
            const nameMatch = src.match(/\/([^\/]+)\.[a-z]+$/);
            const fName = nameMatch ? nameMatch[1] : null;

            imgDiv.setAttribute('data-name', fName);            
            imgDiv.onclick = function() {
                console.log(`Card Clicked`);
                showProfileCard(fName);
            };
        });
        
        const allCards = document.querySelectorAll('.card');
        console.log(`Creating ${allCards.length} clones for infinite scroll`);
        
        allCards.forEach(card => {
            const cardClone = card.cloneNode(true);
            const clonedImgDiv = cardClone.querySelector('.image');
            const fName = clonedImgDiv.getAttribute('data-name');
            clonedImgDiv.onclick = function() {
                showProfileCard(fName);
            };
            cardContainer.appendChild(cardClone);
        });
    }
    
    function beginScrolling() {
        const allCards = document.querySelectorAll('.card');
        cardW = allCards[0].offsetWidth + 16;
        totalW = cardW * (allCards.length / 2); 
        
        function moveCards() {
            if (!scrollPaused) {
                scrollPos -= scrollSpeed;
                if (scrollPos <= -totalW) {
                    console.log('Resetting scroll position');
                    scrollPos = 0;
                }
                cardContainer.style.transform = `translateX(${scrollPos}px)`;
            }
            var animFrame = requestAnimationFrame(moveCards);
        }
        moveCards();
    }
    
    cardContainer.addEventListener('mouseenter', function() {
        console.log('Stopping scroll');
        scrollPaused = true;
    });

    cardContainer.addEventListener('mouseleave', function() {
        console.log('Resume scroll');
        scrollPaused = false;
    });


});

function hideProfileCard() {    
    const profileCard = document.querySelector('.detail-card');
    const darkOverlay = document.querySelector('.overlay');
    
    if (profileCard) profileCard.style.display = 'none';
    if (darkOverlay) darkOverlay.style.display = 'none';    
    scrollPaused = false;
}

function showProfileCard(fName) {
    scrollPaused = true;
    let profileCard = document.querySelector('.detail-card');
    
    if (!profileCard) {
        profileCard = document.createElement('div');
        profileCard.className = 'detail-card';
        document.body.appendChild(profileCard);
    }
    
    fetch('dataset/top10_billionaires_profile_cards.csv')
        .then(res => res.text())
        .then(data => {
            const rows = data.split('\n');
            let billionaireInfo = null;
            
            for (let i = 1; i < rows.length; i++) {
                if (rows[i].trim() === '') continue;
                
                const rowData = rows[i].split(',');
                const rowName = rowData[0].split(' ')[0];
                
                if (rowName === fName) {
                    billionaireInfo = rowData;
                    break;
                }
            }
            
            console.log("DATA:", billionaireInfo);
            
            const fileTypes = {
                'Elon': 'jpg',
                'Bernard': 'jpg',
                'Giovanni': 'webp',
                'Amancio': 'jpeg',
                'Dieter': 'jpg',
                'David': 'webp',
                'Carlos': 'jpeg',
                'Mukesh': 'webp',
                'Vladimir': 'jpeg',
                'Zhong': 'webp'
            };
            
            const fileExt = fileTypes[fName] || 'jpg';
            const imgPath = `./imgs/top10_billionaires_images/${fName}.${fileExt}`;
            
            profileCard.innerHTML = `
                <div class="detail-header" style="z-index: 201;">
                    <div class="detail-image">
                        <img src="${imgPath}" alt="${billionaireInfo[0]}">
                    </div>
                    <div class="detail-name">
                        <h2>${billionaireInfo[0]}</h2>
                        <h3>${billionaireInfo[3]}</h3>
                    </div>
                    <div class="detail-close">×</div>
                </div>
                <div class="detail-info">
                    <div class="info-row">
                        <div class="info-label">Age</div>
                        <div class="info-value">${billionaireInfo[1]}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Gender</div>
                        <div class="info-value">${billionaireInfo[2]}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Net Worth</div>
                        <div class="info-value">$${billionaireInfo[4]} Billion</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Industry</div>
                        <div class="info-value">${billionaireInfo[5]}</div>
                    </div>
                </div>
            `;
            
            profileCard.querySelector('.detail-close').addEventListener('click', function() {
                hideProfileCard();
            });

            profileCard.style.display = 'block';
            let darkOverlay = document.querySelector('.overlay');
            if (!darkOverlay) {
                darkOverlay = document.createElement('div');
                darkOverlay.className = 'overlay';
                // darkOverlay.onclick = hideProfileCard;
                document.body.appendChild(darkOverlay);
            }
            darkOverlay.style.display = 'block';
            document.addEventListener('click', hideProfileCard);
        })
}