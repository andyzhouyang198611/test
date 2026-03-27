const { chromium } = require('playwright');
const path = require('path');

async function run() {
    const extensionPath = path.resolve(__dirname, 'nopecha_ext');
    // 请确保这里的 URL 是你自己的完整续期链接
    const serverUrl = 'https://host2play.gratis/server/renew?i=你的UUID'; 

    const browserContext = await chromium.launchPersistentContext('', {
        headless: false, // 扩展必须在有头模式下运行
        args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
    });

    const page = await browserContext.newPage();

    try {
        console.log('🚀 正在打开续期页面...');
        await page.goto(serverUrl);

        // 给 NopeCHA 一些时间来加载和自动识别
        console.log('⏳ 等待 NopeCHA 自动识别验证码 (约 15-30秒)...');
        
        // 监控“验证码已通过”的复选框状态（这是 reCAPTCHA 的内部 ID）
        try {
            await page.waitForSelector('#recaptcha-accessible-status:has-text("You are verified")', { timeout: 45000 });
            console.log('✅ 验证码破解成功！');
        } catch (e) {
            console.log('⚠️ 等待超时，尝试强行点击 Renew 按钮...');
        }

        // 定位并点击紫色 Renew 按钮
        const renewBtn = page.locator('button:has-text("Renew")');
        if (await renewBtn.isVisible()) {
            await renewBtn.click();
            console.log('👆 已点击 Renew 按钮');
        }

        // 验证续期是否成功（根据页面反馈调整）
        await page.waitForTimeout(5000);
        console.log('🏁 任务结束，请登录面板确认时间。');

    } catch (err) {
        console.error('❌ 脚本运行异常:', err);
    } finally {
        await browserContext.close();
    }
}

run();
