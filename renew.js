const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
    const serverUrl = process.env.RENEW_URL;
    const extensionPath = path.resolve(__dirname, 'nopecha_ext');

    const browserContext = await chromium.launchPersistentContext('', {
        headless: false,
        viewport: { width: 1280, height: 720 }, // 设置标准分辨率
        args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
            '--no-sandbox'
        ],
    });

    const page = await browserContext.newPage();

    try {
        console.log('🚀 正在打开页面: ' + serverUrl);
        // 增加等待直到网络空闲，确保脚本加载完
        await page.goto(serverUrl, { waitUntil: 'networkidle', timeout: 60000 });

        // --- 第一步：点击 "Renew server" ---
        const firstBtnSelector = 'button:has-text("Renew server")';
        console.log('⏳ 等待第一步按钮 (增加到 30秒)...');
        
        // 使用 state: 'attached' 只要按钮在代码里就行，不强求它必须“可见”
        await page.waitForSelector(firstBtnSelector, { state: 'attached', timeout: 30000 });
        
        // 关键改动：使用 force: true 强制点击隐藏元素
        await page.click(firstBtnSelector, { force: true });
        console.log('✅ 已强制点击第一步按钮');

        // --- 第二步：等待 NopeCHA 破解 ---
        console.log('⏳ 等待验证码破解...');
        await page.waitForTimeout(5000); // 先等弹窗弹出
        
        // 截图一张，看看弹窗出来没
        await page.screenshot({ path: 'step1_clicked.png' });

        try {
            await page.waitForSelector('#recaptcha-accessible-status:has-text("You are verified")', { timeout: 60000 });
            console.log('✅ 验证码破解完成');
        } catch (e) {
            console.log('⚠️ 验证码未检测到完成状态，尝试继续...');
        }

        // --- 第三步：点击最终 "Renew" ---
        const secondBtnSelector = 'button:has-text("Renew")';
        const finalBtn = page.locator(secondBtnSelector).last();
        
        await finalBtn.waitFor({ state: 'attached', timeout: 10000 });
        await finalBtn.click({ force: true });
        console.log('👆 已点击最终续期按钮！');

        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'final_result.png' });
        console.log('🎉 任务结束');

    } catch (err) {
        console.error('❌ 运行出错:', err.message);
        // 出错时强制截图，方便调试
        await page.screenshot({ path: 'error_debug.png' });
        process.exit(1);
    } finally {
        await browserContext.close();
    }
}

run();
