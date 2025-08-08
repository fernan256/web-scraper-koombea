const express = require('express');
const router = express.Router();
const { Page, Link } = require('../models');
const { authenticate } = require('../middleware/auth');
const scraperQueue = require('../services/scraperQueue');

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, paginate = 20, status } = req.query;
    
    const options = {
      page: parseInt(page),
      paginate: parseInt(paginate),
      where: {
        userId: req.user.id,
        ...(status && { status })
      },
      order: [['createdAt', 'DESC']]
    };
    
    const result = await Page.paginate(options);
    res.json(result);
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const page = await Page.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json(page);
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ error: 'Failed to fetch page details' });
  }
});

router.get('/:pageId/links', authenticate, async (req, res) => {
  try {
    const { page = 1, paginate = 50 } = req.query;
    
    const pageRecord = await Page.findOne({
      where: {
        id: req.params.pageId,
        userId: req.user.id
      }
    });
    
    if (!pageRecord) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    const options = {
      page: parseInt(page),
      paginate: parseInt(paginate),
      where: { pageId: req.params.pageId },
      order: [['createdAt', 'DESC']]
    };
    
    const result = await Link.paginate(options);
    res.json(result);
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    // Create page record
    const page = await Page.create({
      url,
      userId: req.user.id,
      status: 'pending'
    });
    
    // Add to scraping queue
    await scraperQueue.add(url, req.user.id, page.id);
    
    res.status(201).json({
      message: 'Page added successfully',
      page
    });
  } catch (error) {
    console.error('Error adding page:', error);
    res.status(500).json({ error: 'Failed to add page' });
  }
});

// Get queue status
router.get('/queue/status', authenticate, (req, res) => {
  const status = scraperQueue.getStatus();
  res.json(status);
});

// Delete a specific link
router.delete('/links/:linkId', authenticate, async (req, res) => {
  try {
    const { linkId } = req.params;
    const userId = req.user.id;

    // First find the link
    const link = await Link.findByPk(linkId);
    
    if (!link) {
      return res.status(404).json({ error: 'Link not found or unauthorized' });
    }

    // Check if the page belongs to the user
    const page = await Page.findOne({
      where: { 
        id: link.pageId,
        userId: userId 
      }
    });

    if (!page) {
      return res.status(404).json({ error: 'Link not found or unauthorized' });
    }

    await link.destroy();

    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

// Delete a page and all its links
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const page = await Page.findOne({
      where: { id, userId }
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Delete all associated links first (cascade delete)
    await Link.destroy({
      where: { pageId: id }
    });

    // Delete the page
    await page.destroy();

    res.json({ message: 'Page and all associated links deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

module.exports = router;
