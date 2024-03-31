let starred_repos;
let total_stars;
let per_page;

function handleScrape(event) {
    event.preventDefault();
    document.getElementById('downloadJsonBtn').style.display = 'none';
    document.getElementById('downloadCsvBtn').style.display = 'none';
    document.getElementById('progressBar').style.display = 'none';
    const username = document.getElementById('username').value;
    document.getElementById('scrapingStatus').innerText = 'Initializing';
    document.querySelector('.loading').style.display = 'block';

    fetch('/get_scrape_info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: username })
        })
        .then(response => response.json())
        .then(data => {
            document.querySelector('.loading').style.display = 'none';
            if (data.status === 'success') {
                total_stars = data.total_stars;
                per_page = Math.round(total_stars/data.per_page);
                console.log(total_stars, per_page)
                document.getElementById('scrapingStatus').innerText = `Scanning through ${per_page} pages, uncovering ${total_stars} repositories along the way.`
                scrapeRepositories(username);
            } else {
                document.getElementById('scrapingStatus').innerText = data.message;
            }
        })
        .catch(error => {
            document.querySelector('.loading').style.display = 'none';
            console.error('Error:', error);
        });
}

function scrapeRepositories(username) {
    document.querySelector('.loading').style.display = 'block';

    fetch('/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: username })
        })
        .then(response => response.json())
        .then(data => {
            document.querySelector('.loading').style.display = 'none';
            console.log(data);
            starred_repos = data.data || [];
            document.getElementById('scrapingStatus').innerText = data.message;
            if (data.status === 'success') {
                document.getElementById('downloadJsonBtn').style.display = 'block';
                document.getElementById('downloadCsvBtn').style.display = 'block';
            }
            updateProgressBar();
        })
        .catch(error => {
            document.querySelector('.loading').style.display = 'none';
            console.error('Error:', error);
        });
}

function updateProgressBar() {
    if (total_stars > 0 && per_page > 0) {
        const progress = Math.floor((total_stars / per_page) * 100);
        document.getElementById('progressBar').style.width = `100%`;
        document.getElementById('progressBar').style.display = 'block';
        document.getElementById('progressBar').innerText = `100%`;
        const totalPages = Math.ceil(total_stars / per_page);
        const currentPage = Math.ceil(progress / 100 * totalPages);
    }
}


document.getElementById('downloadJsonBtn').addEventListener('click', function() {
    const data = JSON.stringify(starred_repos, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
});


document.getElementById('downloadCsvBtn').addEventListener('click', function() {
    if (!Array.isArray(starred_repos)) {
        console.error('starred_repos is not an array:', starred_repos);
        return;
    }

    let csv = 'Name,Description,URL\n';
    starred_repos.forEach(repo => {
        const name = escapeCsvValue(repo.name);
        const description = escapeCsvValue(repo.description);
        const url = escapeCsvValue(repo.url);
        csv += `${name},${description},${url}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
});

function escapeCsvValue(value) {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
