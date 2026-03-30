// Display current timestamp
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });
    document.getElementById('current-time').textContent = timeString;
}

// Update time immediately and every second
updateTime();
setInterval(updateTime, 1000);

// Console message
console.log('🚀 Autark - PL Genesis Hackathon');
console.log('This site was deployed to IPFS using Storacha!');
console.log('Learn more: https://github.com/your-repo/autark');
