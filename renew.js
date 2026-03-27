const { chromium } = require('playwright');
const path = require('path');

async function run() {
    const serverUrl = process.env.RENEW_URL;
    const extensionPath = path.resolve(__dirname, 'nopecha_ext');

    if (!serverUrl) {
        console.error("❌ 错误：未在 GitHub Secrets 中找到 RENEW_URL");
        process.exit(1);
    }

    const browserContext = await chromium.launchPersistentContext('', {
        headless: false, 
        args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
    });

    const page = await browserContext.newPage();

    try {
        console.log('🚀 正在打开公开续期页面...');
        await page.goto(serverUrl);

        // --- 第一步：点击 "Renew server" 按钮 ---
        const firstBtnSelector = 'button:has-text("Renew server")';
        console.log('⏳ 等待蓝色的 "Renew server" 按钮出现...');
        await page.waitForSelector(firstBtnSelector, { timeout: 15000 });
        await page.click(firstBtnSelector);
        console.log('✅ 已点击第一步按钮，等待验证码弹窗...');

        // --- 第二步：等待 NopeCHA 破解 reCAPTCHA ---
        console.log('⏳ NopeCHA 正在破解验证码，请稍候 (约 20-40s)...');
        try {
            // 监控 Google 验证码状态
            await page.waitForSelector('#recaptcha-accessible-status:has-text("You are verified")', { timeout: 60000 });
            console.log('✅ 验证码破解成功！');
        } catch (e) {
            console.log('⚠️ 验证码状态检测超时，将尝试直接点击最终按钮。');
        }

        // --- 第三步：点击紫色的 "Renew" 按钮 ---
        // 稍微等待一下确保 Token 填入
        await page.waitForTimeout(3000); 
        const secondBtnSelector = 'button:has-text("Renew")';
        
        // 注意：这里用 locator().last() 是因为页面上可能同时存在旧的按钮
        const finalBtn = page.locator(secondBtnSelector).last();
        
        if (await finalBtn.isVisible()) {
            await finalBtn.click();
            console.log('👆 已点击最终 "Renew" 按钮！');
            await page.waitForTimeout(5000); // 等待请求完成
            console.log('🎉 自动续期任务执行完毕！');
        } else {
            console.error('❌ 错误：未找到紫色的 "Renew" 按钮。');
        }

    } catch (err) {
        console.error('❌ 脚本运行异常:', err.message);
    } finally {
        await browserContext.close();
    }
}

run();
