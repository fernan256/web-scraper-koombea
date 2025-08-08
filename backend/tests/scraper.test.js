const axios = require('axios');
const ScraperService = require('../src/services/scraper');
const { User, Page, Link } = require('../src/models');

jest.mock('axios');

describe('ScraperService', () => {
  let user;
  let page;

  beforeEach(async () => {
    await Link.destroy({ where: {} });
    await Page.destroy({ where: {} });
    await User.destroy({ where: {} });

    user = await User.create({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123'
    });

    page = await Page.create({
      url: 'https://example.com',
      userId: user.id
    });
  });

  describe('scrapeUrl', () => {
    it('should successfully scrape a page with links', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Test Page</title></head>
          <body>
            <a href="https://example.com/page1">Link 1</a>
            <a href="/page2">Link 2</a>
            <a href="https://external.com">External Link</a>
          </body>
        </html>
      `;

      axios.get.mockResolvedValue({ data: mockHtml });

      const result = await ScraperService.scrapeUrl(page.id);

      expect(result.title).toBe('Test Page');
      expect(result.linkCount).toBe(3);

      await page.reload();
      expect(page.status).toBe('completed');
      expect(page.title).toBe('Test Page');
      expect(page.linkCount).toBe(3);

      const links = await Link.findAll({ where: { pageId: page.id } });
      expect(links).toHaveLength(3);
      expect(links[0].name).toBe('Link 1');
      expect(links[1].url).toBe('https://example.com/page2');
    });

    it('should handle pages with no links', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Empty Page</title></head>
          <body>
            <p>No links here</p>
          </body>
        </html>
      `;

      axios.get.mockResolvedValue({ data: mockHtml });

      const result = await ScraperService.scrapeUrl(page.id);

      expect(result.title).toBe('Empty Page');
      expect(result.linkCount).toBe(0);
    });

    it('should handle links with images', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Test</title></head>
          <body>
            <a href="/image-link"><img src="image.jpg" alt="Image Description"></a>
          </body>
        </html>
      `;

      axios.get.mockResolvedValue({ data: mockHtml });

      await ScraperService.scrapeUrl(page.id);

      const links = await Link.findAll({ where: { pageId: page.id } });
      expect(links).toHaveLength(1);
      expect(links[0].name).toBe('Image Description');
    });

    it('should handle scraping errors', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      await expect(ScraperService.scrapeUrl(page.id)).rejects.toThrow('Network error');

      await page.reload();
      expect(page.status).toBe('failed');
      expect(page.errorMessage).toBe('Network error');
    });

    it('should handle non-existent page', async () => {
      await expect(ScraperService.scrapeUrl(999999)).rejects.toThrow('Page not found');
    });
  });

});
