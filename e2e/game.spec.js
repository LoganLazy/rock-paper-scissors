/**
 * E2E 测试示例 - 完整游戏流程
 * 使用 Playwright 进行端到端测试
 */
import { test, expect } from '@playwright/test';

test.describe('Rock-Paper-Scissors Game', () => {
  test('complete game flow', async ({ page, browser }) => {
    // 玩家1创建房间
    await page.goto('/');

    // 检查页面标题
    await expect(page).toHaveTitle(/石头剪刀布/);

    // 填写昵称并创建房间
    await page.fill('input[name="name"]', '玩家1');
    await page.click('button:has-text("创建房间")');

    // 等待房间创建成功
    await page.waitForSelector('.room-card', { timeout: 5000 });

    // 获取房间码
    const roomCodeElement = await page.locator('.room-card strong');
    const roomCode = await roomCodeElement.textContent();

    expect(roomCode).toHaveLength(6);

    // 玩家2加入房间（新浏览器上下文，独立存储，模拟另一台设备；
    // 同一上下文会共享 localStorage，打开页面就会自动重连成玩家1）
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/');

    await page2.fill('input[name="name"]', '玩家2');
    await page2.fill('input[placeholder*="房间码"]', roomCode);
    await page2.click('button:has-text("加入")');

    // 等待游戏开始
    await page.waitForSelector('.choices', { timeout: 5000 });
    await page2.waitForSelector('.choices', { timeout: 5000 });

    // 玩家1出拳
    await page.click('button:has-text("石头")');

    // 玩家2出拳
    await page2.click('button:has-text("剪刀")');

    // 等待结果显示
    await page.waitForTimeout(1000);

    // 检查比分是否更新
    const scoreBoard = await page.locator('.score-card');
    await expect(scoreBoard).toBeVisible();

    await context2.close();

    console.log('Game flow test completed successfully');
  });

  test('create and share room', async ({ page }) => {
    await page.goto('/');

    // 创建房间
    await page.fill('input[name="name"]', '测试玩家');
    await page.click('button:has-text("创建房间")');

    // 等待房间创建
    await page.waitForSelector('.room-card');

    // 检查分享按钮
    const shareButton = await page.locator('button:has-text("复制")');
    await expect(shareButton).toBeVisible();
  });

  test('responsive layout on mobile', async ({ page }) => {
    // 设置移动设备视口
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // 检查移动端布局
    const app = await page.locator('.app');
    const width = await app.evaluate(el => el.clientWidth);

    expect(width).toBeLessThanOrEqual(375);
  });

  test('reload rejoins the room automatically', async ({ page }) => {
    await page.goto('/');

    // 创建房间
    await page.fill('input[name="name"]', '重连玩家');
    await page.click('button:has-text("创建房间")');

    await page.waitForSelector('.room-card', { timeout: 5000 });
    const roomCode = await page.locator('.room-card strong').textContent();
    expect(roomCode).toHaveLength(6);

    // 刷新页面，不点任何按钮，房间应自动回来（同一房间码）
    await page.reload();
    await page.waitForSelector('.room-card', { timeout: 5000 });
    const roomCodeAfterReload = await page.locator('.room-card strong').textContent();

    expect(roomCodeAfterReload).toBe(roomCode);
  });
});
