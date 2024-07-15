import { chromium } from 'playwright';
import fs from 'fs';

const logFile = 'test-log.txt';

// Function to log messages to file and console
function logMessage(message: string) {
    const timestampedMessage = `${new Date().toISOString()} - ${message}`;
    fs.appendFileSync(logFile, `${timestampedMessage}\n`);
    console.log(timestampedMessage);
}

async function searchGoogleNews() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    logMessage('Navigating to Google...');
    await page.goto('https://www.google.com');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    const searchSelector = 'textarea.gLFyf';
    logMessage(`Looking for element with selector: ${searchSelector}`);
    await page.waitForSelector(searchSelector, { timeout: 20000 });
    const searchInput = await page.$(searchSelector);
    if (searchInput) {
        await searchInput.type('Google news', { delay: 100 });
        await searchInput.press('Enter');
        logMessage('Search performed.');
        await page.waitForSelector('#search .g a', { timeout: 30000 });
        const firstResult = await page.$('#search .g a');
        if (firstResult) {
            const href = await firstResult.getAttribute('href');
            logMessage(`Found link: ${href}`);
            if (href && href.includes('news.google.com')) {
                await firstResult.click();
                logMessage('Waiting for page to load...');
                await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
                const title = await page.title();
                if (title.includes('Google News')) {
                    logMessage('Successfully navigated to Google News.');
                } else {
                    logMessage('Error: Navigated to a page that is not Google News.');
                }
            } else {
                throw new Error('The first result does not lead to Google News.');
            }
        } else {
            throw new Error('First search result not found.');
        }
    } else {
        throw new Error('Search input element not found.');
    }
    await browser.close();
    logMessage('Browser closed.');
}

async function searchGoogleImages() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    logMessage('Navigating to Google...');
    await page.goto('https://www.google.com');
    await page.waitForLoadState('networkidle');

    // Click on Images link
    const imagesLinkSelector = '#gb > div > div:nth-child(1) > div > div:nth-child(2) > a';
    logMessage(`Looking for element with selector: ${imagesLinkSelector}`);
    await page.waitForSelector(imagesLinkSelector, { timeout: 30000 });
    const imagesLink = await page.$(imagesLinkSelector);
    if (imagesLink) {
        await imagesLink.click();
        logMessage('Clicked on Images link.');
    } else {
        throw new Error('Images link not found.');
    }

    await page.waitForLoadState('networkidle');

    // Search for "cats"
    const searchSelector = 'textarea.gLFyf';
    logMessage(`Looking for element with selector: ${searchSelector}`);
    await page.waitForSelector(searchSelector, { timeout: 30000 });
    const searchInput = await page.$(searchSelector);
    if (searchInput) {
        await searchInput.type('cats', { delay: 100 });
        await searchInput.press('Enter');
        logMessage('Search performed.');
    } else {
        throw new Error('Search input element not found.');
    }

    await page.waitForLoadState('networkidle');

    // Check search results
    const imagesSelector = 'img';
    logMessage('Waiting for search results to load...');
    await page.waitForSelector(imagesSelector, { timeout: 30000 });
    const images = await page.$$(imagesSelector);
    if (images.length > 0) {
        logMessage('Images found.');
        // Check alt and title attributes of the first 5 images
        for (let i = 0; i < Math.min(images.length, 5); i++) {
            const altText = await images[i].getAttribute('alt');
            const titleText = await images[i].getAttribute('title');
            const srcText = await images[i].getAttribute('src');

            logMessage(`Image ${i + 1}: alt="${altText}", title="${titleText}", src="${srcText}"`);

            if ((altText && altText.toLowerCase().includes('cat')) || 
                (titleText && titleText.toLowerCase().includes('cat')) || 
                (srcText && srcText.toLowerCase().includes('cat'))) {
                logMessage(`Image ${i + 1} matches the query "cats".`);
            } else {
                logMessage(`Image ${i + 1} does not match the query "cats".`);
            }
        }
    } else {
        logMessage('No images found.');
    }

    await browser.close();
    logMessage('Browser closed.');
}

async function searchYouTubeVideos() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    logMessage('Navigating to YouTube...');
    await page.goto('https://www.youtube.com');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    const searchSelector = 'input#search';
    logMessage(`Looking for element with selector: ${searchSelector}`);
    await page.waitForSelector(searchSelector, { timeout: 20000 });
    const searchInput = await page.$(searchSelector);
    if (searchInput) {
        await searchInput.type('funny cat videos', { delay: 100 });
        await searchInput.press('Enter');
        logMessage('Search performed.');
        await page.waitForSelector('ytd-video-renderer', { timeout: 30000 });
        const videos = await page.$$('ytd-video-renderer');
        if (videos.length > 0) {
            logMessage('Videos found.');
        } else {
            logMessage('No videos found.');
        }
    } else {
        throw new Error('Search input element not found.');
    }
    await browser.close();
    logMessage('Browser closed.');
}

async function measureGoogleLoadTime() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    logMessage('Measuring Google page load time...');
    const start = Date.now();
    await page.goto('https://www.google.com');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    logMessage(`Page load time: ${loadTime} ms`);
    if (loadTime < 2000) {
        logMessage('Page loads quickly.');
    } else {
        logMessage('Page loads slowly.');
    }
    await browser.close();
    logMessage('Browser closed.');
}

async function testGoogleAccessibility() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    logMessage('Checking Google page accessibility...');
    await page.goto('https://www.google.com');
    await page.waitForLoadState('networkidle');
    const ariaElements = await page.$$('[aria-label]');
    if (ariaElements.length > 0) {
        logMessage('Elements with aria-label attribute found.');
    } else {
        logMessage('No elements with aria-label attribute found.');
    }
    await browser.close();
    logMessage('Browser closed.');
}

async function stressTestGoogleSearch() {
    logMessage('Stress testing Google Search...');
    const keywords = ['cats', 'dogs', 'birds'];

    // Define the number of iterations and concurrent users
    const iterations = 3; // Number of times each keyword is searched
    const concurrentUsers = 2; // Number of parallel searches

    for (const keyword of keywords) {
        logMessage(`Starting stress test for keyword: ${keyword}`);
        const promises = [];
        for (let i = 0; i < concurrentUsers; i++) {
            promises.push((async () => {
                for (let j = 0; j < iterations; j++) {
                    const browser = await chromium.launch({ headless: true });
                    const page = await browser.newPage();
                    logMessage(`Search ${j + 1} for keyword: ${keyword}`);
                    try {
                        await page.goto('https://www.google.com');
                        await page.waitForLoadState('networkidle');
                        const searchSelector = 'textarea.gLFyf';
                        await page.waitForSelector(searchSelector, { timeout: 20000 });
                        const searchInput = await page.$(searchSelector);
                        if (searchInput) {
                            await searchInput.type(keyword, { delay: 100 });
                            await searchInput.press('Enter');
                            await page.waitForSelector('#search', { timeout: 30000 });
                            logMessage(`Search ${j + 1} for keyword "${keyword}" completed.`);
                        } else {
                            logMessage('Search input element not found.');
                        }
                    } catch (error: any) {
                        logMessage(`Error during search ${j + 1} for keyword "${keyword}": ${error.message}`);
                    } finally {
                        await browser.close();
                        logMessage('Browser closed.');
                    }
                }
            })());
        }
        await Promise.all(promises);
        logMessage(`Completed stress test for keyword: ${keyword}`);
    }
}



(async () => {
    try {
        await searchGoogleNews();
        await searchGoogleImages();
        await searchYouTubeVideos();
        await measureGoogleLoadTime();
        await testGoogleAccessibility();
        await stressTestGoogleSearch();
    } catch (error) {
        logMessage(`Error: ${(error as any).message}`);
        logMessage(`Stack trace: ${(error as any).stack}`);
    }
})();
