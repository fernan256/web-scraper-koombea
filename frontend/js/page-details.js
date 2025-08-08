if (!checkAuth()) {
    throw new Error('Not authenticated');
}

const urlParams = new URLSearchParams(window.location.search);
const pageId = urlParams.get('id');

if (!pageId) {
    window.location.href = 'index.html';
}

let currentLinksPage = 1;
const linksLimit = 10;

async function loadPageDetails() {
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const pageInfoSection = document.getElementById('page-info');
    const linksSection = document.getElementById('links-section');
    
    try {
        loadingDiv.style.display = 'block';
        errorDiv.textContent = '';
        pageInfoSection.style.display = 'none';
        linksSection.style.display = 'none';
        
        const page = await pagesAPI.getPageDetails(pageId);
        
        const linksResponse = await pagesAPI.getPageLinks(pageId, currentLinksPage, linksLimit);
        const links = linksResponse.docs || [];
        const pagination = {
            page: linksResponse.page || currentLinksPage,
            totalPages: linksResponse.pages || 1,
            total: linksResponse.total || 0,
            limit: linksResponse.limit || linksLimit
        };
        
        loadingDiv.style.display = 'none';
        
        displayPageInfo(page);
        displayLinks(links, pagination);
        
        pageInfoSection.style.display = 'block';
        linksSection.style.display = 'block';
    } catch (error) {
        loadingDiv.style.display = 'none';
        errorDiv.textContent = 'Failed to load page details: ' + error.message;
    }
}

function displayPageInfo(page) {
    document.getElementById('page-title').textContent = page.title || 'Untitled Page';
    
    const pageUrlLink = document.getElementById('page-url');
    pageUrlLink.href = page.url;
    pageUrlLink.textContent = page.url;
    
    const statusSpan = document.getElementById('page-status');
    statusSpan.textContent = page.status;
    statusSpan.className = `status status-${page.status}`;
    
    document.getElementById('link-count').textContent = page.linkCount;
    
    const scrapedAtSpan = document.getElementById('scraped-at');
    if (page.scrapedAt) {
        scrapedAtSpan.textContent = new Date(page.scrapedAt).toLocaleString();
    } else {
        scrapedAtSpan.textContent = 'Not yet scraped';
    }
    
    if (page.errorMessage) {
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('error-text').textContent = page.errorMessage;
    } else {
        document.getElementById('error-message').style.display = 'none';
    }
}

function displayLinks(links, pagination) {
    document.getElementById('total-links').textContent = pagination.total;
    
    const noLinksDiv = document.getElementById('no-links');
    const linksTable = document.getElementById('links-table');
    const tbody = document.getElementById('links-tbody');
    const paginationDiv = document.getElementById('links-pagination');
    
    if (links.length === 0 && pagination.total === 0) {
        noLinksDiv.style.display = 'block';
        linksTable.style.display = 'none';
        paginationDiv.style.display = 'none';
        return;
    }
    
    noLinksDiv.style.display = 'none';
    linksTable.style.display = 'table';
    
    tbody.innerHTML = '';
    
    links.forEach(link => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="link-name" title="${escapeHtml(link.name)}">${escapeHtml(link.name || 'No text')}</td>
            <td class="link-url">
                <a href="${link.url}" target="_blank" rel="noopener noreferrer" title="${link.url}">
                    ${link.url}
                </a>
            </td>
            <td>
                <button 
                    class="btn btn-small btn-danger" 
                    onclick="deleteLink(${link.id}, '${escapeHtml(link.name || link.url).replace(/'/g, "\\'")}')"
                >
                    Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    if (pagination.totalPages > 1) {
        displayLinksPagination(pagination);
        paginationDiv.style.display = 'flex';
    } else {
        paginationDiv.style.display = 'none';
    }
}

function displayLinksPagination(pagination) {
    const prevButton = document.getElementById('prev-links');
    const nextButton = document.getElementById('next-links');
    const pageInfo = document.getElementById('links-page-info');
    
    pageInfo.textContent = `Page ${pagination.page} of ${pagination.totalPages}`;
    prevButton.disabled = pagination.page === 1;
    nextButton.disabled = pagination.page === pagination.totalPages;
}

document.getElementById('prev-links').addEventListener('click', () => {
    if (currentLinksPage > 1) {
        currentLinksPage--;
        loadPageDetails();
    }
});

document.getElementById('next-links').addEventListener('click', () => {
    currentLinksPage++;
    loadPageDetails();
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function deleteLink(linkId, linkName) {
    if (!confirm(`Are you sure you want to delete this link?\n\n${linkName}`)) {
        return;
    }
    
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = '';
    
    try {
        await pagesAPI.deleteLink(linkId);
        loadPageDetails();
    } catch (error) {
        errorDiv.textContent = 'Failed to delete link: ' + error.message;
    }
}

loadPageDetails();
