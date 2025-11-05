const puppeteer = require('puppeteer');

const { uploadToR2 } = require('./r2-upload.js');
const { sendToDiscord } = require('../discord/discord-send.js');

const captureToView = async (type, reserve) => {
    const browser = await puppeteer.launch({
	    // executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
	    headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    let captureUrl = '';
    let captureWidth = 0;
    let captureHeight = 0;

    if(type === 'H') {
        captureUrl = 'history';
        captureWidth = 1500;
        captureHeight = 700;
    } else if(type === 'F') {
        captureUrl = 'fearless';
        const heightAdd = 150;
        captureWidth = 850;
        captureHeight = 140 + (heightAdd * reserve);
    }

    try {
		await page.setViewport({ width: captureWidth, height: captureHeight });
        await page.goto(`http://localhost:8080/${captureUrl}`, {
            waitUntil: 'networkidle2',
            timeout: 60000 
        });

		await page.evaluate(() => {
			return Promise.all(
				Array.from(document.images).map(img => {
				if (img.complete) return Promise.resolve();
					return new Promise((resolve) => {
						img.onload = resolve;
						img.onerror = resolve;
					});
				})
			);
		});

        await page.waitForSelector(`.match_${captureUrl}`, { timeout: 10000 }); 

        const filename = `screenshots/screenshot-${Date.now()}.png`;
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`Capture Success : ${filename}`);
		
        const imageUrl = await uploadToR2(type, filename);
        console.log(`Uploaded to R2: ${imageUrl}`);

		await sendToDiscord(type, filename, imageUrl);
    } catch (err) {
        console.error('Capture Fail :', err.message);
    } finally {
        await browser.close();
    }
}

module.exports = { captureToView };