const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('📱 Mobile Browser Testing\n');

let browser = null;

async function main() {
  try {
    // Assume server is already running on port 3000
    console.log('ℹ️  Assuming server running on http://localhost:3000\n');

    // Launch browser
    console.log('🌐 Launching browser...\n');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    // Set mobile viewport
    await page.setViewport({
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });

    console.log('✓ Mobile viewport set (375x667)\n');

    // Capture console messages
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Capture page errors
    const errors = [];
    page.on('error', err => errors.push(err.message));
    page.on('pageerror', err => errors.push(err.message));

    // Navigate to game
    console.log('📖 Loading game...\n');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✓ Page loaded\n');

    // Wait for ships to load (or timeout after 5 seconds)
    console.log('⏳ Waiting for ships to load (max 5 seconds)...\n');
    try {
      await page.waitForFunction(() => {
        const count = document.querySelectorAll('.ship-card').length;
        console.log('Ships found:', count);
        return count >= 2;
      }, { timeout: 5000 });
    } catch (e) {
      console.log('⚠️  Ships did not load via dynamic loading');
    }

    const shipCount = await page.evaluate(() => {
      return document.querySelectorAll('.ship-card').length;
    });
    console.log(`✓ ${shipCount} ships in DOM\n`);

    // Check if ShipRegistry has ships
    const registryShips = await page.evaluate(() => {
      return window.ShipRegistry ? window.ShipRegistry.getAll().length : 0;
    });
    console.log(`✓ ShipRegistry has ${registryShips} ships\n`);

    // Check page content
    const pageContent = await page.evaluate(() => {
      return {
        rpgToggleExists: !!document.getElementById('rpg-mode'),
        lobbyActive: document.getElementById('lobby')?.classList.contains('active'),
        btnStartExists: !!document.getElementById('btn-start'),
        allElements: Array.from(document.querySelectorAll('[id]')).map(el => el.id).slice(0, 20)
      };
    });

    console.log('Page state:');
    console.log('  RPG toggle exists:', pageContent.rpgToggleExists);
    console.log('  Lobby active:', pageContent.lobbyActive);
    console.log('  Start button exists:', pageContent.btnStartExists);
    console.log('  First 20 element IDs:', pageContent.allElements.join(', '));
    console.log();

    if (registryShips === 0) {
      console.log('❌ CRITICAL ISSUE: Ships not loading!');
      console.log('Dynamic script loading is not working in this environment.\n');
      process.exit(1);
    }

    // Enable RPG mode
    console.log('🎮 Enabling RPG BATTLE MODE...\n');
    await page.click('#rpg-mode');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('✓ RPG mode enabled\n');

    // Click start battle
    console.log('🎬 Clicking START BATTLE...\n');
    await page.click('#btn-start');
    console.log('✓ Start button clicked\n');

    // Wait for battle screen to appear
    console.log('⏳ Waiting for battle screen...\n');
    await page.waitForFunction(() => {
      const battle = document.getElementById('battle');
      return battle && battle.classList.contains('active');
    }, { timeout: 5000 });
    console.log('✓ Battle screen active\n');

    // Wait for rendering to happen
    console.log('⏳ Waiting for battle to render (2 seconds)...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check what's on the canvas
    console.log('📊 Checking battle state...\n');

    const battleInfo = await page.evaluate(() => {
      const canvas = document.getElementById('arena');
      const turnStrip = document.getElementById('hud');
      const standingsDiv = document.getElementById('standings');

      return {
        canvasWidth: canvas ? canvas.width : 'N/A',
        canvasHeight: canvas ? canvas.height : 'N/A',
        hudVisible: turnStrip ? window.getComputedStyle(turnStrip).display !== 'none' : false,
        standingsVisible: standingsDiv ? standingsDiv.innerHTML.length > 0 : false,
        bodyClasses: document.body.className,
        displayedScreens: Array.from(document.querySelectorAll('.screen')).map(s => ({
          id: s.id,
          active: s.classList.contains('active'),
          display: window.getComputedStyle(s).display
        }))
      };
    });

    console.log('Canvas:', battleInfo.canvasWidth + 'x' + battleInfo.canvasHeight);
    console.log('HUD visible:', battleInfo.hudVisible);
    console.log('Standings visible:', battleInfo.standingsVisible);
    console.log('Active screens:');
    battleInfo.displayedScreens.forEach(s => {
      if (s.active) {
        console.log(`  - #${s.id} (display: ${s.display})`);
      }
    });
    console.log();

    // Try to count rendered elements
    console.log('🎨 Checking rendered content...\n');
    const renderInfo = await page.evaluate(() => {
      // Get canvas info
      const canvas = document.getElementById('arena');
      const data = {
        canvasExists: !!canvas,
        canvasSize: canvas ? `${canvas.width}x${canvas.height}` : 'N/A',
        hudShips: document.querySelectorAll('.hud-ship').length,
        messageText: document.getElementById('hud') ?
          Array.from(document.querySelectorAll('.hud-ship-name')).map(n => n.textContent) : [],
      };
      return data;
    });

    console.log('Canvas exists:', renderInfo.canvasExists);
    console.log('Canvas size:', renderInfo.canvasSize);
    console.log('HUD ships displayed:', renderInfo.hudShips);
    if (renderInfo.messageText.length > 0) {
      console.log('Ships in HUD:', renderInfo.messageText.join(', '));
    }
    console.log();

    // Check console logs
    console.log('📋 Console output during test:\n');
    const relevantLogs = consoleLogs.filter(log =>
      log.text.includes('[RPG') || log.type === 'error'
    );

    if (relevantLogs.length > 0) {
      relevantLogs.forEach(log => {
        const icon = log.type === 'error' ? '❌' : 'ℹ️';
        console.log(`${icon} ${log.text}`);
      });
    } else {
      console.log('(No RPG-specific logs captured)');
    }
    console.log();

    // Check for errors
    if (errors.length > 0) {
      console.log('⚠️  JavaScript Errors:\n');
      errors.forEach(err => console.log(`  ❌ ${err}`));
      console.log();
    } else {
      console.log('✓ No JavaScript errors\n');
    }

    // Take screenshot
    console.log('📸 Taking screenshot...\n');
    const screenshotPath = 'test-mobile-screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`✓ Screenshot saved to ${screenshotPath}\n`);

    // Final status
    console.log('═══════════════════════════════════\n');
    console.log('✅ Mobile browser test complete!\n');
    console.log('Results:');
    console.log(`  Ships in HUD: ${renderInfo.hudShips}`);
    console.log(`  Errors: ${errors.length}`);
    console.log(`  RPG logs: ${relevantLogs.length}`);
    console.log(`  Screenshot: ${screenshotPath}\n`);

    if (renderInfo.hudShips < 6) {
      console.log('⚠️  WARNING: Only ' + renderInfo.hudShips + ' ships visible (expected 6)');
    } else {
      console.log('✓ All 6 ships visible in HUD');
    }

    process.exit(errors.length > 0 ? 1 : 0);

  } catch (err) {
    console.error('\n❌ Test failed!');
    console.error(err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);

  } finally {
    if (browser) await browser.close();
  }
}

main();
