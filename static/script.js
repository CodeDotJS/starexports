let starred_repos = [];
let total_stars;
let per_page;

function handleScrape(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;

    document.getElementById('downloadJsonBtn').style.display = 'none';
    document.getElementById('downloadCsvBtn').style.display = 'none';
    document.getElementById('progressBar').style.display = 'none';
    document.getElementById('scrapingStatus').innerText = 'Initializing';
    document.querySelector('.loading').style.display = 'block';

    fetch('/info', {
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
                per_page = data.per_page;
                if (total_stars > 0) {
                    document.getElementById('scrapingStatus').innerText = `Scanning through ${Math.ceil(total_stars/per_page)} pages, uncovering ${total_stars} repositories along the way.`;
                    scrapeRepositories(username);
                } else {
                    document.getElementById('scrapingStatus').innerText = 'This user has no starred repositories.';
                }
            } else {
                document.getElementById('scrapingStatus').innerText = data.message;
            }
        })
        .catch(error => {
            document.querySelector('.loading').style.display = 'none';
            console.error('Error:', error);
            document.getElementById('scrapingStatus').innerText = 'An error occurred during the request.';
        });
}

function scrapeRepositories(username) {
    starred_repos = [];

    document.querySelector('.loading').style.display = 'block';

    fetch('/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: username })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.body;
        })
        .then(stream => {
            const reader = stream.getReader();
            const decoder = new TextDecoder('utf-8');
            let result = '';

            reader.read().then(function processStream({ done, value }) {
                if (done) {
                    document.querySelector('.loading').style.display = 'none';
                    document.getElementById('scrapingStatus').innerText = 'SUCCESS!';
                    document.getElementById('downloadJsonBtn').style.display = 'block';
                    document.getElementById('downloadCsvBtn').style.display = 'block';
                    return;
                }

                result += decoder.decode(value);
                const lines = result.split('\n');
                lines.slice(0, -1).forEach(line => {
                    const data = JSON.parse(line);
                    console.log(data);
                    starred_repos.push(data.data);
                });
                result = lines.pop();
                updateProgressBar();
                return reader.read().then(processStream);

            });
        })
        .catch(error => {
            document.querySelector('.loading').style.display = 'none';
            console.error('Error:', error);
            document.getElementById('scrapingStatus').innerText = 'Error occurred during scraping';
        });
}

function updateProgressBar() {
    const progress = Math.floor((starred_repos.length / total_stars) * 100);
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressBar').style.display = 'block';
    document.getElementById('progressBar').innerText = `${progress}%`;
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
