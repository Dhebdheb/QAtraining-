const { test, expect } = require('@playwright/test');

test('completed todos appear in Completed but not Active', async ({ page }) => {
	await page.goto('https://demo.playwright.dev/todomvc/');
	await expect(page).toHaveTitle(/TodoMVC/);

	const todoInput = page.getByPlaceholder('What needs to be done?');
	const todoList = page.getByRole('list').first();
	await todoInput.fill('Buy milk');
	await todoInput.press('Enter');

	const todoItem = todoList.getByRole('listitem').filter({ hasText: 'Buy milk' });
	await expect(todoItem).toBeVisible();

	await todoItem.getByRole('checkbox').check();
	await expect(todoItem.getByRole('checkbox')).toBeChecked();

	await page.getByRole('link', { name: 'Completed', exact: true }).click();
	await expect(page).toHaveURL(/#\/completed$/);
	await expect(todoItem).toBeVisible();

	await page.getByRole('link', { name: 'Active', exact: true }).click();
	await expect(page).toHaveURL(/#\/active$/);
	await expect(todoList.getByRole('listitem')).toHaveCount(0);
});

test('empty and whitespace-only inputs do not create todos', async ({ page }) => {
	await page.goto('https://demo.playwright.dev/todomvc/');

	const todoInput = page.getByPlaceholder('What needs to be done?');
	const todoList = page.getByRole('list').first();

	await todoInput.press('Enter');
	await expect(todoList.getByRole('listitem')).toHaveCount(0);

	await todoInput.fill('   ');
	await todoInput.press('Enter');
	await expect(todoList.getByRole('listitem')).toHaveCount(0);
});
