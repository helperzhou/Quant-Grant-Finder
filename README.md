# Quantilytix Grant Finder

A modern, responsive web app to **search and explore grant opportunities** using keywords or URLs. Fast, visually appealing, and leverages Firebase for caching search results.

---

## Features

- **Search by Keywords or URL**  
  Instantly find grants by entering keywords or a relevant web link.
- **Real-time Results**  
  Fetches live data from a custom backend API.
- **Caching with Firebase**  
  Recently searched queries are cached for faster repeat access.
- **User-Friendly Interface**  
  Glassmorphic design, mobile support, and quick navigation.
- **Detailed Grant Explorer**  
  See grant name, summary, funder, value, deadline, country, and sector—with direct external links.

---

## Tech Stack

- **React**  
- **styled-components**
- **Firebase Firestore**
- **Axios** (API requests)
- **Custom Node.js backend API** (for scraping & data aggregation)

---

## Quick Start

1. **Clone the repository**
    ```bash
    git clone https://github.com/YOUR-USERNAME/quantilytix-grant-finder.git
    cd quantilytix-grant-finder
    ```

2. **Install dependencies**
    ```bash
    npm install
    ```

3. **Configure Firebase**
    - Create a `src/firebase/firebaseConfig.js` and add your Firebase config.

4. **Start the app**
    ```bash
    npm start
    ```
    The app runs on [http://localhost:3000](http://localhost:3000)

---
![image](https://github.com/user-attachments/assets/a39fc73d-1733-43ef-941a-dfb64873af61)
