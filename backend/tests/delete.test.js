const request = require('supertest');
const express = require('express');
const { User, Page, Link } = require('../src/models');
const authRoutes = require('../src/routes/auth');
const pagesRoutes = require('../src/routes/pages');
const { generateToken } = require('../src/utils/jwt');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/pages', pagesRoutes);

describe('Delete Functionality', () => {
  let user;
  let token;
  let page;
  let link1, link2;

  beforeEach(async () => {
    await Link.destroy({ where: {} });
    await Page.destroy({ where: {} });
    await User.destroy({ where: {} });

    user = await User.create({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123'
    });
    token = generateToken(user.id);

    page = await Page.create({
      url: 'https://example.com',
      title: 'Example Page',
      status: 'completed',
      linkCount: 2,
      userId: user.id
    });

    link1 = await Link.create({
      url: 'https://example.com/link1',
      name: 'Link 1',
      pageId: page.id
    });

    link2 = await Link.create({
      url: 'https://example.com/link2',
      name: 'Link 2',
      pageId: page.id
    });
  });

  describe('DELETE /api/pages/links/:linkId', () => {
    it('should delete a specific link', async () => {
      const response = await request(app)
        .delete(`/api/pages/links/${link1.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Link deleted successfully');

      const deletedLink = await Link.findByPk(link1.id);
      expect(deletedLink).toBeNull();

      const remainingLink = await Link.findByPk(link2.id);
      expect(remainingLink).not.toBeNull();
    });

    it('should not delete link belonging to another user', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'otheruser@example.com',
        password: 'password123'
      });
      const otherToken = generateToken(otherUser.id);

      const response = await request(app)
        .delete(`/api/pages/links/${link1.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Link not found or unauthorized');

      const link = await Link.findByPk(link1.id);
      expect(link).not.toBeNull();
    });

    it('should return 404 for non-existent link', async () => {
      const response = await request(app)
        .delete('/api/pages/links/999999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Link not found or unauthorized');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/pages/links/${link1.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/pages/:id', () => {
    it('should delete a page and all its links', async () => {
      const response = await request(app)
        .delete(`/api/pages/${page.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Page and all associated links deleted successfully');

      const deletedPage = await Page.findByPk(page.id);
      expect(deletedPage).toBeNull();

      const links = await Link.findAll({ where: { pageId: page.id } });
      expect(links).toHaveLength(0);
    });

    it('should not delete page belonging to another user', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'otheruser@example.com',
        password: 'password123'
      });
      const otherToken = generateToken(otherUser.id);

      const response = await request(app)
        .delete(`/api/pages/${page.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Page not found');

      const existingPage = await Page.findByPk(page.id);
      expect(existingPage).not.toBeNull();
    });

    it('should return 404 for non-existent page', async () => {
      const response = await request(app)
        .delete('/api/pages/999999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Page not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/pages/${page.id}`);

      expect(response.status).toBe(401);
    });
  });
});
