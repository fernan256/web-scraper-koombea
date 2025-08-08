if (!checkAuth()) {
    throw new Error('Not authenticated');
}

let currentPage = 1;
const pageLimit = 10;
let refreshInterval;

const user = JSON.parse(localStorage.getItem('user') || '{}');
document.getElementById('username').textContent = user.username || 'User';

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

document.getElementById('add-url-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const urlInput = document.getElementById('url-input');
    const url = urlInput.value.trim();
    const errorDiv = document.getElementById('add-error');
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    errorDiv.textContent = '';
    submitButton.disabled = true;
    submitButton.textContent = 'Adding...';
    
    try {
        await pagesAPI.addPage(url);
        urlInput.value = '';
        loadPages();
    } catch (error) {
        errorDiv.textContent = error.message;
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Add URL';
    }
});

async function loadPages() {
    const loadingDiv = document.getElementById('pages-loading');
    const errorDiv = document.getElementById('pages-error');
    const noPagesDiv = document.getElementById('no-pages');
    const pagesTable = document.getElementById('pages-table');
    const paginationDiv = document.getElementById('pagination');
    
    try {
        loadingDiv.style.display = 'block';
        errorDiv.textContent = '';
        noPagesDiv.style.display = 'none';
        pagesTable.style.display = 'none';
        paginationDiv.style.display = 'none';
        
        const response = await pagesAPI.getPages(currentPage, pageLimit);
        const pages = response.docs || [];
        const pagination = {
            page: response.page,
            totalPages: response.pages,
            total: response.total,
            limit: response.limit
        };
        
        loadingDiv.style.display = 'none';
        
        if (pages.length === 0 && currentPage === 1) {
            noPagesDiv.style.display = 'block';
        } else {
            displayPages(pages);
            displayPagination(pagination);
        }
    } catch (error) {
        loadingDiv.style.display = 'none';
        errorDiv.textContent = 'Failed to load pages: ' + error.message;
    }
}

function displayPages(pages) {
    const tbody = document.getElementById('pages-tbody');
    const pagesTable = document.getElementById('pages-table');
    
    tbody.innerHTML = '';
    
    pages.forEach(page => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="url-cell" title="${page.url}">${page.url}</td>
            <td>${page.title || '-'}</td>
            <td><span class="status status-${page.status}">${page.status}</span></td>
            <td>${page.linkCount}</td>
            <td>${new Date(page.createdAt).toLocaleDateString()}</td>
            <td>
                <button 
                    class="btn btn-small btn-primary" 
                    onclick="viewPageDetails(${page.id})"
                    ${page.status !== 'completed' ? 'disabled' : ''}
                >
                    View Links
                </button>
                <button 
                    class="btn btn-small btn-danger" 
                    onclick="deletePage(${page.id}, '${page.url.replace(/'/g, "\\'")}')"
                >
                    Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    pagesTable.style.display = 'table';
}

function displayPagination(pagination) {
    const paginationDiv = document.getElementById('pagination');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    pageInfo.textContent = `Page ${pagination.page} of ${pagination.totalPages}`;
    prevButton.disabled = pagination.page === 1;
    nextButton.disabled = pagination.page === pagination.totalPages;
    
    if (pagination.totalPages > 1) {
        paginationDiv.style.display = 'flex';
    }
}

document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadPages();
    }
});

document.getElementById('next-page').addEventListener('click', () => {
    currentPage++;
    loadPages();
});

// View page details
function viewPageDetails(pageId) {
    window.location.href = `page-details.html?id=${pageId}`;
}

// Delete page
async function deletePage(pageId, pageUrl) {
    if (!confirm(`Are you sure you want to delete this page and all its links?\n\n${pageUrl}`)) {
        return;
    }
    
    const errorDiv = document.getElementById('pages-error');
    errorDiv.textContent = '';
    
    try {
        await pagesAPI.deletePage(pageId);
        // If we're on the last page and deleting the last item, go back one page
        const tbody = document.getElementById('pages-tbody');
        if (tbody.children.length === 1 && currentPage > 1) {
            currentPage--;
        }
        loadPages();
    } catch (error) {
        errorDiv.textContent = 'Failed to delete page: ' + error.message;
    }
}

// Initial load
loadPages();

// Refresh pages every 5 seconds to see status updates
refreshInterval = setInterval(loadPages, 5000);

// Clean up interval when leaving page
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
