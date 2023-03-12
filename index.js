#!/usr/bin/env node

import { chromium } from 'playwright';
import { createDate, removeReadMore, oraInstance } from './helper.js';
import env from './.config.cjs';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

const FILEPATH = env.FILEPATH;
const URL = env.SCRAPE_URL;

const launchOptions = {
    headless: true,
};

const scrape = async () => {
    let spinner = oraInstance;
    spinner.start('launching browser');
    const browser = await chromium.launch(launchOptions);
    const page = await browser.newPage();
    const pages = [];

    await page.goto(URL);
    await page.waitForSelector('.sc-c-list__items');
    spinner.succeed(chalk.green('browser launched'));

    spinner = oraInstance;
    spinner.start('collecting links');
    let urls = await page.$$eval('li > article', (links) => {
        links = links.map((el) => el.querySelector('a').href);
        return links;
    });

    await page.close();
    spinner.succeed(chalk.green('links collected'));

    spinner = oraInstance;
    spinner.start('scraping pages');
    for (let link of urls) {
        let dataObj = await scrapePage(browser, link);
        pages.push(dataObj);
    }
    spinner.succeed(chalk.green('pages scraped\n'));

    for (let page of pages) {
        savePage(page);
    }
    // await page.waitForTimeout(10000); // wait for 10 seconds
    await browser.close();
};

async function scrapePage(browser, link) {
    let dataObj = {};

    const newPage = await browser.newPage(launchOptions);

    await newPage.goto(link);
    await newPage.waitForLoadState('domcontentloaded');

    dataObj.showLink = link;
    dataObj.showTitle = await newPage.$eval(
        '.sc-c-marquee__title-1',
        (span) => span.textContent
    );
    dataObj.releaseDate = await newPage.$eval(
        '.sc-c-episode__metadata__data',
        (div) => div.textContent
    );
    dataObj.fileName =
        createDate(dataObj.releaseDate) + ' – ' + dataObj.showTitle;
    dataObj.path = path.join(FILEPATH, dataObj['fileName']);
    dataObj.published = fs.existsSync(
        `${path.join(FILEPATH, 'published', dataObj['fileName'])}.txt`
    );
    dataObj.alreadyScraped =
        dataObj.published || fs.existsSync(`${dataObj.path}.txt`);

    if (!dataObj.alreadyScraped) {
        // fetch short description
        dataObj.synopsis = await newPage.$eval(
            '.sc-c-synopsis',
            (div) => div.textContent
        );

        // fetch all artists
        dataObj.artists = await newPage.evaluate(() => {
            const artistNodeCollection = document.querySelectorAll(
                '.sc-c-basic-tile__artist'
            );
            return Array.from(artistNodeCollection).map(
                (item) => item.innerText
            );
        });

        // fetch all track titles
        dataObj.trackTitles = await newPage.evaluate(() => {
            const titleNodeCollection = document.querySelectorAll(
                '.sc-c-basic-tile__title'
            );
            return Array.from(titleNodeCollection).map(
                (item) => item.innerText
            );
        });
    }

    await newPage.close();
    return dataObj;
}

function savePage(page) {
    let spinner = oraInstance;
    spinner.start();
    if (page.alreadyScraped && page.published) {
        spinner
            .succeed(chalk.bold(`${page.showTitle}`) + ` => already published.`)
            .stop();
    } else if (page.alreadyScraped && !page.published) {
        spinner
            .warn(
                chalk.yellow(
                    chalk.bold(`${page.showTitle}`) +
                        ` => scraped but not yet published.`
                )
            )
            .stop();
    } else {
        // save each show with proper title and the collected result as txt file
        let showResult = `${page.showTitle}\n\n`;
        showResult += `${page.releaseDate}\n\n`;
        showResult += `${removeReadMore(page.synopsis)}\n\n`;
        showResult += `yt-dlp ${page.showLink}\n\n`;
        for (let i = 0, k = page.artists.length; i < k; i++) {
            const artistAndTack = `${i + 1}. ${page.artists[i]} – ${
                page.trackTitles[i]
            } \n`;
            showResult += artistAndTack;
        }
        fs.writeFileSync(`${page.path}.txt`, showResult, { encoding: 'utf-8' });
        spinner
            .succeed(
                chalk.green(
                    chalk.bold(`${page.showTitle}`) + ` => ready to be fetched.`
                )
            )
            .stop();
    }
}

scrape();
