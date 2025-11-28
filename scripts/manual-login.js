import puppeteer from 'puppeteer';
import fs from 'fs';
import readline from 'readline';

const SESSION_FILE = 'session.json';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    const argUrl = process.argv[2];

    const processUrl = async (url) => {
        if (!url) {
            console.log('No URL provided. Exiting.');
            await browser.close();
            rl.close();
            return;
        }

        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        console.log('Please log in manually in the browser window.');
        console.log('After you have successfully logged in, press ENTER in this terminal to save the session.');

        rl.question('', async () => {
            console.log('Saving session...');

            // Get cookies
            const cookies = await page.cookies();

            // Get localStorage
            const localStorageData = await page.evaluate(() => {
                const json = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    json[key] = localStorage.getItem(key);
                }
                return json;
            });

            const session = {
                cookies,
                localStorage: localStorageData,
                url: page.url() // Save the current URL as a reference
            };

            fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
            console.log(`Session saved to ${SESSION_FILE}`);

            await browser.close();
            rl.close();
        });
    };

    if (argUrl) {
        await processUrl(argUrl);
    } else {
        // Ask user for URL
        rl.question('Enter the URL to log in to: ', processUrl);
    }
})();
