const puppeteer = require('puppeteer');

async function main() {
  console.log('Launching browser to capture local tooltip...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to http://localhost:3000/creer/editeur...');
    // Attendre que la page charge complètement
    await page.goto('http://localhost:3000/creer/editeur', {
      waitUntil: 'networkidle2',
      timeout: 45000,
    });

    console.log('Waiting for skeletons to disappear...');
    // Attendre qu'un champ avec un tooltip soit rendu visible (par exemple le champ Nom complet)
    await page.waitForSelector('.cursor-help', { timeout: 15000 });

    console.log('Hovering over the first help icon...');
    await page.hover('.cursor-help');

    // Attendre l'animation d'apparition du tooltip
    await new Promise((resolve) => setTimeout(resolve, 800));

    const artifactPath = '/Users/mac/.gemini/antigravity/brain/edee6a6e-7e5a-4b80-97a4-325fbef0ce07/screenshot_local_tooltip.png';
    console.log('Taking screenshot...');
    await page.screenshot({ path: artifactPath });
    console.log('Screenshot saved to:', artifactPath);
  } catch (error) {
    console.error('Failed to take screenshot:', error);
  } finally {
    await browser.close();
  }
}

main();
