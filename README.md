# Webscraper

Retrieves all titles from Iggy Pop's current playlists on the [BBC](https://www.bbc.co.uk/sounds/brand/b03yblbx) in a proper format, since copying and pasting from that website is a pain when you just want the track artists & titles. 

An overdue overhaul of this [prior version](https://github.com/sit79/iggy-confidential-tracklist-scraper), this time using [Playwright](https://playwright.dev/) instead of [Puppeteer](https://github.com/puppeteer/puppeteer).

### Requirements

Node 22.11

### Setup

1. Clone the repository.
2. Run `npm i`
3. Create file .env in the repository root containing:

```
   BASE_URL="https://www.bbc.co.uk"
   FILEPATH="<path to your tracklists folder>"
   SCRAPE_URL="https://www.bbc.co.uk/sounds/brand/b03yblbx"
```

4. Create file .config.cjs in the repository root containing:

```
   const path = require('path');
   const dotenv = require('dotenv');

   // Construct an absolute path to the .env file
   const envPath = path.join(__dirname, '.env');

   // Load the environment variables from the .env file
   dotenv.config({ path: envPath, debug: true });

   const env = {
      BASE_URL: process.env.BASE_URL,
      FILEPATH: process.env.FILEPATH,
      SCRAPE_URL: process.env.SCRAPE_URL,
   };

   module.exports = env;
```
