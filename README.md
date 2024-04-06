<h1 align="center"><img width="50%" src="media/starexports.png" alt=""></h1>
<p align="center"><b>GitHub Starred Repositories Exporter</b></p>


# Overview

A web application that allows users to export their (or anyone else's) starred repositories from GitHub in JSON or CSV format. I initially built this tool to create a backup of my starred repositories so that I could unstar repositories without worrying about losing something important.

A live demo of the application is available __[here](https://starexports.onrender.com/)__. To get started with, simply enter your GitHub username (or any other user's) and hit enter. Once the data is fetched, you can download it as a JSON or CSV file.

__NOTE__

After building and testing *StarExports* locally, I deployed it on Vercel, but I kept getting a `504` [error](https://vercel.com/guides/what-can-i-do-about-vercel-serverless-functions-timing-out) for users who have over ~800 starred repositories. I thought if I streamed the data, I wouldn't run into this issue, but then found out that the Python runtime does [not support](https://github.com/orgs/vercel/discussions/2756#discussioncomment-6104176) streaming responses on Vercel. Out of laziness, I deployed it on Render, where it works fine except for the instance spinning down due to inactivity.

- __[Check on Vercel](https://starexports.vercel.app)__ - *Fast, but breaks when it has to pull a good chunk of repositories.*
- __[Check on Render](https://starexports.onrender.com)__ - *Completely functional but can take some time to load.*

# Installation

- Clone and navigate:

```sh
git clone https://github.com/CodeDotJS/starexports.git
cd starexports
```

- Install the required packages:

```sh
pip install -r requirements.txt
```

- Run the application

```sh
python main.py
```

# Contributing
Contributions are welcome! If you find any bugs or have suggestions for improvements, please feel free to submit a pull request or open an issue.

# License
This project is licensed under the MIT License.
