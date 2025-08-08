const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { Page, Link } = require('../models');

class ScraperService {
  static async scrapeUrl(pageId) {
    const page = await Page.findByPk(pageId);
    
    if (!page) {
      throw new Error('Page not found');
    }

    try {
      await page.update({ status: 'processing' });

      const response = await fetch(page.url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      
      if (!response.ok) {
        const error = new Error(`HTTP Error ${response.status}`);
        error.response = { status: response.status };
        throw error;
      }
      
      const html = await response.text();
      
      const $ = cheerio.load(html);

      // Extract page title
      const title = $('title').text().trim() || 'Untitled Page';

      // Extract all links
      const links = [];
      $('a[href]').each((index, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        
        // Skip javascript: and mailto: links
        if (href.startsWith('javascript:') || href.startsWith('mailto:')) {
          return;
        }
        
        // Get link text with simple fallbacks
        const linkText = (
          $link.text().trim() || 
          $link.find('img').attr('alt') || 
          $link.attr('title') || 
          'No text'
        ).replace(/\s+/g, ' ').substring(0, 255);
        
        // Convert to absolute URL
        let fullUrl;
        try {
          fullUrl = new URL(href, page.url).href;
        } catch (e) {
          // Skip invalid URLs
          return;
        }

        links.push({
          url: fullUrl.substring(0, 2048),
          name: linkText,
          pageId: page.id
        });
      });

      if (links.length > 0) {
        await Link.bulkCreate(links);
      }

      await page.update({
        title,
        linkCount: links.length,
        status: 'completed',
        scrapedAt: new Date()
      });

      return {
        title,
        linkCount: links.length,
        links
      };
    } catch (error) {
      let errorMessage = error.message;
      
      // Handle specific HTTP errors
      if (error.response) {
        if (error.response.status === 429) {
          errorMessage = 'Rate limited by website. Too many requests.';
        } else if (error.response.status === 403) {
          errorMessage = 'Access forbidden. The website is blocking automated requests.';
        } else if (error.response.status === 404) {
          errorMessage = 'Page not found (404).';
        } else {
          errorMessage = `HTTP Error ${error.response.status}: ${error.message}`;
        }
      }
      
      await page.update({
        status: 'failed',
        errorMessage
      });

      throw error;
    }
  }

}

module.exports = ScraperService;
