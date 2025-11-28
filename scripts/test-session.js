import puppeteer from 'puppeteer';
import fs from 'fs';

const SESSION_FILE = 'session.json';

(async () => {
    if (!fs.existsSync(SESSION_FILE)) {
        console.error(`Session file ${SESSION_FILE} not found. Run manual-login.js first.`);
        process.exit(1);
    }

    const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    // Set cookies
    if (session.cookies && session.cookies.length > 0) {
        console.log('Restoring cookies...');
        await page.setCookie(...session.cookies);
    }

    // Navigate to the target URL (or the one saved in session)
    const url = session.url || 'https://google.com'; // Default fallback
    console.log(`Navigating to ${url}...`);

    // We need to navigate to the domain before setting localStorage
    // So we go to the URL first, but we might need to reload to apply localStorage if it's critical for rendering
    // Alternatively, we can go to the domain, set localStorage, and then reload.

    await page.goto(url, { waitUntil: 'networkidle2' });

    // Set localStorage
    if (session.localStorage) {
        console.log('Restoring localStorage...');
        await page.evaluate((data) => {
            for (const key in data) {
                localStorage.setItem(key, data[key]);
            }
        }, session.localStorage);

        // Reload to ensure localStorage is picked up by the app
        console.log('Reloading page to apply localStorage...');
        await page.reload({ waitUntil: 'networkidle2' });
    }

    console.log('Session restored. Browser will remain open for verification.');

    // Keep browser open for a bit or until closed manually
    // await browser.close(); 
})();
