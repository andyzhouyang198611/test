const { chromium } = require('playwright');
const path = require('path');

async function run() {
    // 从环境变量读取 URL
    const serverUrl = process.env.RENEW_URL;
    const extensionPath = path.resolve(__dirname, 'nopecha_ext');

    if (!serverUrl) {
        console.error("❌ 错误：未检测到环境变量 RENEW_URL，请检查 GitHub Secrets 设置。");
        process.exit(1);
    }

    const browserContext = await chromium.launchPersistentContext('', {
        headless: false, // 必须为 false 扩展才生效
        args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
    });

    const page = await browserContext.newPage();

    try {
        console.log('🚀 正在访问续期页面...');
        await page.goto(serverUrl);

        console.log('⏳ 等待 NopeCHA 识别并破解验证码 (预计 30s)...');
        
        // 监控 reCAPTCHA 是否成功的状态（这是 Google 内部 ID）
        try {
            await page.waitForSelector('#recaptcha-accessible-status:has-text("You are verified")', { timeout: 60000 });
            console.log('✅ 验证码破解成功！');
        } catch (e) {
            console.log('⚠️ 验证码破解超时，尝试直接寻找 Renew 按钮...');
        }

        // 寻找并点击 Renew 按钮
        const renewBtn = page.locator('button:has-text("Renew")');
        if (await renewBtn.isVisible()) {
            await renewBtn.click();
            console.log('👆 已点击 Renew 按钮！');
            // 等待页面跳转或弹出成功提示
            await page.waitForTimeout(5000);
            console.log('🎉 续期流程执行完毕。');
        } else {
            console.log('❌ 未找到 Renew 按钮，可能页面未加载完成或验证失败。');
        }

    } catch (err) {
        console.error('❌ 脚本运行出错:', err.message);
    } finally {
        await browserContext.close();
    }
}

run();
