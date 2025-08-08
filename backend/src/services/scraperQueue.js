class ScraperQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = parseInt(process.env.MAX_CONCURRENT_SCRAPERS) || 3;
    this.activeJobs = 0;
    this.completedJobs = [];
    this.maxCompletedHistory = 100;
  }

  async add(url, userId, pageId) {
    const job = {
      id: Date.now().toString(),
      url,
      userId,
      pageId,
      status: 'pending',
      createdAt: new Date()
    };

    this.queue.push(job);
    console.log(`Added ${url} to queue. Queue size: ${this.queue.length}`);
    
    this.process();
    
    return job.id;
  }

  async process() {
    // Prevent multiple processing loops
    if (this.processing) return;
    
    this.processing = true;

    while (this.queue.length > 0 && this.activeJobs < this.maxConcurrent) {
      const job = this.queue.shift();
      this.activeJobs++;
      
      // Process job without blocking the loop
      this.processJob(job).then(() => {
        this.activeJobs--;
        if (this.queue.length > 0) {
          this.process(); // Continue processing if more jobs
        }
      }).catch((error) => {
        // Ensure activeJobs is decremented even on error
        this.activeJobs--;
        console.error('Unexpected error in job processing:', error);
      });
    }

    this.processing = false;
  }

  async processJob(job) {
    try {
      console.log(`Processing ${job.url}...`);
      job.status = 'processing';
      
      const ScraperService = require('./scraper');
      const result = await ScraperService.scrapeUrl(job.pageId);
      
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      console.log(`Completed ${job.url}`);
      this.addToHistory(job);
      
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.failedAt = new Date();
      console.error(`Failed to process ${job.url}:`, error.message);
      console.error('Stack trace:', error.stack);
      this.addToHistory(job);
    }
  }

  addToHistory(job) {
    this.completedJobs.push(job);
    // Remove oldest jobs if history exceeds limit
    if (this.completedJobs.length > this.maxCompletedHistory) {
      this.completedJobs.shift();
    }
  }

  getStatus() {
    return {
      queueLength: this.queue.length,
      activeJobs: this.activeJobs,
      processing: this.processing,
      completedCount: this.completedJobs.filter(j => j.status === 'completed').length,
      failedCount: this.completedJobs.filter(j => j.status === 'failed').length
    };
  }

  getRecentJobs(limit = 10) {
    return this.completedJobs.slice(-limit);
  }
}

module.exports = new ScraperQueue();
