from flask import Flask, request, jsonify, render_template, Response
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import time
import json
import requests

from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def remove_escaped_sequences(text):
    cleaned_text = text.encode('ascii', 'ignore').decode('ascii')
    cleaned_text = cleaned_text.replace('\n', ' ').strip()
    return cleaned_text

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://github.com/",
    "Connection": "keep-alive",
    "Cache-Control": "no-cache",
}

def bookmark(username):
    base_url = f"https://github.com/{username}?tab=stars"
    session = requests.Session()
    session.headers.update(headers)

    response = session.get(base_url)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'lxml')
        page = 1
        while True:
            for repo in soup.find_all('div', class_='d-inline-block mb-1'):
                repo_name_with_username = repo.find('a').text.strip()
                repo_name = repo_name_with_username.split(' / ')[-1]

                description_elem = repo.find_next_sibling('div', class_='py-1')
                if description_elem:
                    description = description_elem.text.strip()
                else:
                    description_elem = repo.find_next('p', class_='mb-1')
                    description = description_elem.text.strip() if description_elem else ""

                url = repo.find('a')['href']
                full_url = urljoin("https://github.com/", url)

                starred_repo = {
                    'name': repo_name,
                    'description': remove_escaped_sequences(description),
                    'url': full_url
                }

                yield {
                    'page': page,
                    'data': starred_repo
                }

            next_button = soup.find('a', class_='btn BtnGroup-item', text='Next')
            if not next_button:
                break

            next_url = urljoin("https://github.com/", next_button['href'])
            response = session.get(next_url)
            soup = BeautifulSoup(response.text, 'lxml')
            page += 1

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/scrape', methods=['POST'])
def scrape():
    username = request.json.get('username')
    if username:
        def generate():
            for result in bookmark(username):
                yield json.dumps(result) + "\n"
        return Response(generate(), mimetype='application/json')
    else:
        return jsonify({'status': 'error', 'message': 'Invalid username'})

@app.route('/info', methods=['POST'])
def info():
    username = request.json.get('username')
    if username:
        base_url = f"https://github.com/{username}?tab=stars"
        response = requests.get(base_url, headers=headers)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'lxml')

            counter_elements = soup.find_all('span', class_='Counter')

            if counter_elements:
                total_stars = int(counter_elements[-1]['title'].replace(',', ''))
            else:
                total_stars = 0

            print("TOTAL STARS", total_stars)
            per_page = len(soup.find_all('div', class_='d-inline-block mb-1'))
            return jsonify({
                'status': 'success',
                'total_stars': total_stars,
                'per_page': per_page
            })
        else:
            return jsonify({'status': 'error', 'message': 'Failed to fetch user page'})
    else:
        return jsonify({'status': 'error', 'message': 'Invalid username'})

if __name__ == '__main__':
    app.run(debug=True)
