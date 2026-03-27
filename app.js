/**
 * 书签管理器 - 主程序
 * 数据存储: LocalStorage
 */

// ========== 数据结构 ==========
let data = {
    categories: [
        { id: 'all', name: '全部', icon: 'fa-layer-group', isDefault: true },
        { id: 'work', name: '工作', icon: 'fa-briefcase' },
        { id: 'study', name: '学习', icon: 'fa-graduation-cap' },
        { id: 'dev', name: '开发', icon: 'fa-code' },
        { id: 'fun', name: '娱乐', icon: 'fa-gamepad' }
    ],
    bookmarks: [
        {
            id: '1',
            url: 'https://github.com',
            title: 'GitHub',
            description: '全球最大的代码托管平台',
            categoryId: 'dev',
            tags: ['代码', '开源'],
            favicon: ''
        },
        {
            id: '2',
            url: 'https://www.google.com',
            title: 'Google',
            description: '全球最大的搜索引擎',
            categoryId: 'work',
            tags: ['搜索', '工具'],
            favicon: ''
        },
        {
            id: '3',
            url: 'https://www.youtube.com',
            title: 'YouTube',
            description: '全球最大的视频平台',
            categoryId: 'fun',
            tags: ['视频', '娱乐'],
            favicon: ''
        },
        {
            id: '4',
            url: 'https://stackoverflow.com',
            title: 'Stack Overflow',
            description: '程序员问答社区',
            categoryId: 'dev',
            tags: ['问答', '开发'],
            favicon: ''
        },
        {
            id: '5',
            url: 'https://www.coursera.org',
            title: 'Coursera',
            description: '在线学习平台',
            categoryId: 'study',
            tags: ['学习', '课程'],
            favicon: ''
        }
    ]
};

// 当前状态
let currentCategory = 'all';
let editingBookmarkId = null;
let searchTimeout = null;

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    loadTheme();
    loadCategorySelection(); // 加载保存的分类选择
    Toast.init();
    renderCategories();
    renderBookmarks();
    bindEvents();
});

// ========== 数据管理 ==========
function loadData() {
    const saved = localStorage.getItem('bookmarkManager');
    if (saved) {
        try {
            data = JSON.parse(saved);
        } catch (e) {
            console.error('数据加载失败', e);
        }
    }
}

function saveData() {
    localStorage.setItem('bookmarkManager', JSON.stringify(data));
}

// ========== 主题管理 ==========
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// ========== Toast 通知模块 ==========
const Toast = {
    container: null,

    init() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            console.error('Toast container not found');
        }
    },

    show(message, type = 'success') {
        if (!this.container) {
            this.init();
        }
        if (!this.container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.success}"></i>
            <span>${message}</span>
        `;

        this.container.appendChild(toast);

        // 3秒后自动消失
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    },

    warning(message) {
        this.show(message, 'warning');
    }
};

// 兼容旧调用方式
function showToast(message, type = 'success') {
    Toast.show(message, type);
}

// ========== 渲染分类 ==========
function renderCategories() {
    const sidebar = document.getElementById('sidebar');
    // 保留标题，清除其余内容
    const title = sidebar.querySelector('.sidebar-title');
    sidebar.innerHTML = '';
    sidebar.appendChild(title);

    data.categories.forEach(cat => {
        const count = cat.id === 'all'
            ? data.bookmarks.length
            : data.bookmarks.filter(b => b.categoryId === cat.id).length;

        const item = document.createElement('button');
        item.className = `sidebar-item ${currentCategory === cat.id ? 'active' : ''}`;
        item.innerHTML = `
            <i class="fas ${cat.icon}"></i>
            <span class="sidebar-item-name">${cat.name}</span>
            <span class="sidebar-item-count">${count}</span>
        `;
        item.onclick = () => selectCategory(cat.id);

        // 非默认分类添加右键菜单
        if (!cat.isDefault) {
            item.oncontextmenu = (e) => {
                e.preventDefault();
                showCategoryContextMenu(e, cat.id);
            };
        }

        sidebar.appendChild(item);
    });

    updateCategorySelect();
}

function selectCategory(categoryId) {
    currentCategory = categoryId;
    // 保存分类选择
    localStorage.setItem('selectedCategory', categoryId);
    renderCategories();
    renderBookmarks();
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 加载保存的分类选择
function loadCategorySelection() {
    const saved = localStorage.getItem('selectedCategory');
    if (saved && data.categories.find(c => c.id === saved)) {
        currentCategory = saved;
    }
}

function updateCategorySelect() {
    const dropdown = document.getElementById('categoryDropdown');
    if (!dropdown) return;

    const categories = data.categories.filter(c => c.id !== 'all');
    dropdown.innerHTML = categories
        .map(c => `<div class="custom-select-option" data-name="${escapeHtml(c.name)}">
                        <i class="fas ${c.icon}"></i>
                        <span>${escapeHtml(c.name)}</span>
                   </div>`)
        .join('');

    // 如果没有分类，显示提示
    if (categories.length === 0) {
        dropdown.innerHTML = '<div class="custom-select-option" style="color: var(--text-muted); cursor: default;">暂无分类，请输入新分类名</div>';
    }
}

// ========== 渲染书签 ==========
function renderBookmarks() {
    const container = document.getElementById('bookmarksGrid');
    const emptyState = document.getElementById('emptyState');
    const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();

    // 过滤书签
    let bookmarks = data.bookmarks;

    // 按分类过滤
    if (currentCategory !== 'all') {
        bookmarks = bookmarks.filter(b => b.categoryId === currentCategory);
    }

    // 按搜索词过滤
    if (searchQuery) {
        bookmarks = bookmarks.filter(b =>
            b.title.toLowerCase().includes(searchQuery) ||
            b.description?.toLowerCase().includes(searchQuery) ||
            b.url.toLowerCase().includes(searchQuery) ||
            b.tags?.some(t => t.toLowerCase().includes(searchQuery))
        );
    }

    // 显示空状态或书签列表
    if (bookmarks.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    container.style.display = 'grid';
    emptyState.style.display = 'none';

    container.innerHTML = bookmarks.map(bookmark => `
        <div class="bookmark-card"
             draggable="true"
             data-id="${bookmark.id}"
             onclick="openBookmark('${bookmark.url}')">
            <div class="bookmark-header">
                <div class="bookmark-icon">
                    ${getFavicon(bookmark)}
                </div>
                <div class="bookmark-info">
                    <div class="bookmark-title">${highlightText(bookmark.title, searchQuery)}</div>
                    ${bookmark.tags?.length ? `
                    <div class="bookmark-tags">
                        ${bookmark.tags.map(tag => `<span class="bookmark-tag">${highlightText(tag, searchQuery)}</span>`).join('')}
                    </div>
                    ` : ''}
                </div>
                <div class="bookmark-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); editBookmark('${bookmark.id}')" title="编辑">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="action-btn delete" onclick="event.stopPropagation(); deleteBookmark('${bookmark.id}')" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="bookmark-desc">${bookmark.description ? highlightText(bookmark.description, searchQuery) : ''}</div>
            <div class="bookmark-footer">
                <div class="bookmark-url">${highlightText(bookmark.url, searchQuery)}</div>
                <button class="copy-btn" onclick="event.stopPropagation(); copyBookmarkUrl('${bookmark.url}', this)">
                    <i class="fas fa-copy"></i>
                    <span>复制</span>
                </button>
            </div>
        </div>
    `).join('');

    // 绑定拖拽事件
    bindDragEvents();

    // 为图标设置超时定时器
    initFaviconTimeouts();
}

// 高亮匹配文本
function highlightText(text, query) {
    const escaped = escapeHtml(text);
    if (!query) return escaped;
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return escaped.replace(regex, '<mark>$1</mark>');
}

// 转义正则特殊字符
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ========== 拖拽排序 ==========
let draggedElement = null;

function bindDragEvents() {
    const cards = document.querySelectorAll('.bookmark-card');

    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('dragleave', handleDragLeave);
        card.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.bookmark-card').forEach(card => {
        card.classList.remove('drag-over');
    });
    draggedElement = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (this !== draggedElement) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (this === draggedElement) return;

    const draggedId = e.dataTransfer.getData('text/plain');
    const targetId = this.dataset.id;

    // 找到两个书签在数组中的索引
    const draggedIndex = data.bookmarks.findIndex(b => b.id === draggedId);
    const targetIndex = data.bookmarks.findIndex(b => b.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // 交换位置
    const [removed] = data.bookmarks.splice(draggedIndex, 1);
    data.bookmarks.splice(targetIndex, 0, removed);

    saveData();
    renderBookmarks();
}

// ========== 图标缓存系统 ==========
const FAVICON_CACHE_KEY = 'faviconCache';

// 获取图标缓存
function getFaviconCache() {
    try {
        const cache = localStorage.getItem(FAVICON_CACHE_KEY);
        return cache ? JSON.parse(cache) : {};
    } catch {
        return {};
    }
}

// 保存图标缓存
function saveFaviconCache(cache) {
    try {
        localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error('保存图标缓存失败:', e);
    }
}

// 图标服务列表
function getFaviconServices(hostname) {
    return [
        `https://icon.horse/icon/${hostname}`,
        `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
        `https://${hostname}/favicon.ico`,
        `https://${hostname}/favicon.svg`,
        `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
    ];
}

function getFavicon(bookmark) {
    // 如果书签已有 favicon（包括 'failed' 状态），根据状态处理
    if (bookmark.favicon) {
        // 如果是获取失败状态，直接显示默认图标
        if (bookmark.favicon === 'failed') {
            return `<i class="fas fa-link" style="color: var(--accent)"></i>`;
        }
        // 有有效的 favicon URL
        return `<img src="${bookmark.favicon}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <i class="fas fa-link" style="display:none;color: var(--accent)"></i>`;
    }

    const hostname = new URL(bookmark.url).hostname;
    const faviconServices = getFaviconServices(hostname);

    // 检查缓存
    const cache = getFaviconCache();
    const cachedIndex = cache[hostname];

    // 如果缓存中有记录，直接使用对应的服务
    const startIndex = typeof cachedIndex === 'number' ? cachedIndex : 0;

    return `<img src="${faviconServices[startIndex]}" alt=""
                onerror="window.tryNextFavicon(this, ${startIndex}, '${hostname}', '${bookmark.id}')"
                onload="window.onFaviconLoad(this, ${startIndex}, '${hostname}', '${bookmark.id}')"
                data-favicon-index="${startIndex}"
                data-favicon-hostname="${hostname}"
                data-favicon-bookmark-id="${bookmark.id}">
            <i class="fas fa-link" style="display:none;color: var(--accent)"></i>`;
}

// 超时时间：1.5秒
const FAVICON_TIMEOUT = 1500;

// 图标加载成功 - 保存到缓存和书签数据
window.onFaviconLoad = function(img, currentIndex, hostname, bookmarkId) {
    // 清除定时器
    if (img.faviconTimer) {
        clearTimeout(img.faviconTimer);
        img.faviconTimer = null;
    }

    // 保存到缓存
    const cache = getFaviconCache();
    cache[hostname] = currentIndex;
    saveFaviconCache(cache);

    // 保存图标URL 到书签数据
    const faviconServices = getFaviconServices(hostname);
    const bookmark = data.bookmarks.find(b => b.id === bookmarkId);
    if (bookmark && !bookmark.favicon) {
        bookmark.favicon = faviconServices[currentIndex];
        saveData();
    }
};

// 全局图标降级函数
window.tryNextFavicon = function(img, currentIndex, hostname, bookmarkId) {
    // 清除之前的定时器
    if (img.faviconTimer) {
        clearTimeout(img.faviconTimer);
        img.faviconTimer = null;
    }

    const faviconServices = getFaviconServices(hostname);

    const nextIndex = currentIndex + 1;
    if (nextIndex < faviconServices.length) {
        img.src = faviconServices[nextIndex];
        img.dataset.faviconIndex = nextIndex;
        // 更新 onload 事件
        img.onload = function() {
            window.onFaviconLoad(img, nextIndex, hostname, bookmarkId);
        };
        // 更新 onerror 事件（关键修复！）
        img.onerror = function() {
            window.tryNextFavicon(img, nextIndex, hostname, bookmarkId);
        };
        // 设置超时
        img.faviconTimer = setTimeout(() => {
            window.tryNextFavicon(img, nextIndex, hostname, bookmarkId);
        }, FAVICON_TIMEOUT);
    } else {
        // 所有服务都失败，显示默认图标并保存失败状态
        img.style.display = 'none';
        img.nextElementSibling.style.display = 'flex';

        // 保存失败状态到书签数据，下次不再尝试获取
        const bookmark = data.bookmarks.find(b => b.id === bookmarkId);
        if (bookmark && !bookmark.favicon) {
            bookmark.favicon = 'failed';
            saveData();
        }
    }
};

// 初始化所有图标的超时定时器
function initFaviconTimeouts() {
    const faviconImgs = document.querySelectorAll('.bookmark-icon img[data-favicon-index]');
    faviconImgs.forEach(img => {
        // 如果已经有定时器，跳过
        if (img.faviconTimer) return;

        // 从当前图片状态获取 index，而不是使用闭包
        const hostname = img.dataset.faviconHostname;
        const bookmarkId = img.dataset.faviconBookmarkId;

        // 设置超时定时器，使用函数获取当前 index
        img.faviconTimer = setTimeout(() => {
            // 重新获取当前 index，因为可能已经改变
            const currentIndex = parseInt(img.dataset.faviconIndex, 10);
            window.tryNextFavicon(img, currentIndex, hostname, bookmarkId);
        }, FAVICON_TIMEOUT);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== 书签操作 ==========
function openAddModal() {
    editingBookmarkId = null;
    document.getElementById('modalTitle').textContent = '添加书签';
    document.getElementById('bookmarkUrl').value = '';
    document.getElementById('bookmarkTitle').value = '';
    document.getElementById('bookmarkDesc').value = '';
    document.getElementById('bookmarkTags').value = '';
    // 设置分类名称（而不是 ID）
    if (currentCategory !== 'all') {
        const category = data.categories.find(c => c.id === currentCategory);
        document.getElementById('bookmarkCategory').value = category ? category.name : '';
    } else {
        document.getElementById('bookmarkCategory').value = '';
    }
    document.getElementById('bookmarkModal').classList.add('active');
    // 光标自动定位到 URL 输入框
    setTimeout(() => {
        document.getElementById('bookmarkUrl').focus();
    }, 100);
}

// URL 自动补全
function normalizeUrl(url) {
    url = url.trim();
    if (!url) return '';

    // 如果已经有协议，直接返回
    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    // 添加 https://
    return 'https://' + url;
}

// 获取网页标题
async function fetchPageTitle(url) {
    try {
        // 使用 CORS 代理获取页面内容
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl, {
            signal: AbortSignal.timeout(8000) // 8秒超时
        });

        if (!response.ok) return null;

        const html = await response.text();

        // 提取 title 标签内容
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
            // 解码 HTML 实体
            const title = titleMatch[1]
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
                .trim();
            return title || null;
        }
        return null;
    } catch (e) {
        console.log('获取标题失败:', e.message);
        return null;
    }
}

// URL 输入框变化时自动获取标题
let titleFetchTimeout = null;
function onUrlInput() {
    const urlInput = document.getElementById('bookmarkUrl');
    const titleInput = document.getElementById('bookmarkTitle');

    clearTimeout(titleFetchTimeout);

    titleFetchTimeout = setTimeout(async () => {
        let url = normalizeUrl(urlInput.value);
        if (!url) return;

        // 验证 URL 是否有效
        try {
            new URL(url);
        } catch {
            return;
        }

        // 如果标题为空，自动获取
        if (!titleInput.value.trim()) {
            titleInput.placeholder = '正在获取标题...';
            const title = await fetchPageTitle(url);
            if (title) {
                titleInput.value = title;
                titleInput.placeholder = '';
            } else {
                titleInput.placeholder = '网站标题';
            }
        }
    }, 800); // 停止输入 800ms 后开始获取
}

function editBookmark(id) {
    const bookmark = data.bookmarks.find(b => b.id === id);
    if (!bookmark) return;

    editingBookmarkId = id;
    document.getElementById('modalTitle').textContent = '编辑书签';
    document.getElementById('bookmarkUrl').value = bookmark.url;
    document.getElementById('bookmarkTitle').value = bookmark.title;
    document.getElementById('bookmarkDesc').value = bookmark.description || '';
    // 设置分类名称（而不是 ID）
    const category = data.categories.find(c => c.id === bookmark.categoryId);
    document.getElementById('bookmarkCategory').value = category ? category.name : '';
    document.getElementById('bookmarkTags').value = bookmark.tags?.join(', ') || '';
    document.getElementById('bookmarkModal').classList.add('active');
}

function saveBookmark() {
    let url = normalizeUrl(document.getElementById('bookmarkUrl').value);
    const title = document.getElementById('bookmarkTitle').value.trim();
    const description = document.getElementById('bookmarkDesc').value.trim();
    const categoryName = document.getElementById('bookmarkCategory').value.trim();
    const tagsStr = document.getElementById('bookmarkTags').value;

    if (!url || !title) {
        showToast('请填写URL和标题', 'warning');
        return;
    }

    // 验证URL
    try {
        new URL(url);
    } catch {
        showToast('请输入有效的URL', 'error');
        return;
    }

    // 处理分类：查找或创建
    let categoryId = '';
    if (categoryName) {
        // 查找已有分类（按名称匹配）
        const existingCategory = data.categories.find(
            c => c.id !== 'all' && c.name.toLowerCase() === categoryName.toLowerCase()
        );
        if (existingCategory) {
            categoryId = existingCategory.id;
        } else {
            // 创建新分类
            const newCategory = {
                id: 'cat_' + Date.now(),
                name: categoryName,
                icon: 'fa-folder',
                isDefault: false
            };
            data.categories.push(newCategory);
            categoryId = newCategory.id;
        }
    }

    const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);

    if (editingBookmarkId) {
        // 编辑模式
        const index = data.bookmarks.findIndex(b => b.id === editingBookmarkId);
        if (index !== -1) {
            data.bookmarks[index] = {
                ...data.bookmarks[index],
                url,
                title,
                description,
                categoryId,
                tags
            };
        }
        showToast('书签已更新', 'success');
    } else {
        // 添加模式 - URL 去重检测
        const normalizedUrl = url.replace(/\/+$/, '');
        const exists = data.bookmarks.some(b => b.url.replace(/\/+$/, '') === normalizedUrl);
        if (exists) {
            showToast('该网址已存在，无需重复添加', 'warning');
            return;
        }

        const newBookmark = {
            id: Date.now().toString(),
            url,
            title,
            description,
            categoryId,
            tags,
            favicon: ''
        };
        data.bookmarks.unshift(newBookmark);
        showToast('书签已添加', 'success');
    }

    saveData();
    closeModal();
    renderCategories();
    renderBookmarks();
}

// 复制书签链接
function copyBookmarkUrl(url, btn) {
    navigator.clipboard.writeText(url).then(() => {
        // 显示成功状态
        btn.classList.add('copied');
        btn.querySelector('i').className = 'fas fa-check';

        // 1.5秒后恢复
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.querySelector('i').className = 'fas fa-copy';
        }, 1500);
    }).catch(err => {
        console.error('复制失败:', err);
    });
}

function deleteBookmark(id) {
    if (!confirm('确定要删除这个书签吗？')) return;

    data.bookmarks = data.bookmarks.filter(b => b.id !== id);
    cleanupEmptyCategories();
    saveData();
    renderCategories();
    renderBookmarks();
    showToast('书签已删除', 'success');
}

// 清理空分类（没有书签的非默认分类）
function cleanupEmptyCategories() {
    const categoryIds = new Set(data.bookmarks.map(b => b.categoryId));
    const beforeCount = data.categories.length;

    data.categories = data.categories.filter(cat =>
        cat.isDefault || categoryIds.has(cat.id)
    );

    // 如果当前分类被删除，切换到"全部"
    if (!data.categories.find(c => c.id === currentCategory)) {
        currentCategory = 'all';
    }

    return data.categories.length < beforeCount; // 返回是否有分类被删除
}

function openBookmark(url) {
    window.open(url, '_blank');
}

function closeModal() {
    document.getElementById('bookmarkModal').classList.remove('active');
    editingBookmarkId = null;
}

// ========== 分类操作 ==========
let editingCategoryId = null;

function openCategoryModal() {
    editingCategoryId = null;
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryIcon').value = 'fa-folder';
    document.getElementById('categoryModal').classList.add('active');
    document.getElementById('categoryModalTitle').textContent = '添加分类';
    // 自动聚焦到输入框
    setTimeout(() => {
        document.getElementById('categoryName').focus();
    }, 100);
}

function openEditCategoryModal(categoryId) {
    const category = data.categories.find(c => c.id === categoryId);
    if (!category) return;

    editingCategoryId = categoryId;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryIcon').value = category.icon;
    document.getElementById('categoryModal').classList.add('active');
    document.getElementById('categoryModalTitle').textContent = '编辑分类';
    // 自动聚焦到输入框
    setTimeout(() => {
        document.getElementById('categoryName').focus();
    }, 100);
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
    editingCategoryId = null;
}

function saveCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const icon = document.getElementById('categoryIcon').value;

    if (!name) {
        showToast('请输入分类名称', 'warning');
        return;
    }

    if (editingCategoryId) {
        // 编辑模式
        const category = data.categories.find(c => c.id === editingCategoryId);
        if (category) {
            category.name = name;
            category.icon = icon;
            showToast('分类已更新', 'success');
        }
    } else {
        // 添加模式
        const newCategory = {
            id: 'cat_' + Date.now(),
            name,
            icon,
            isDefault: false
        };
        data.categories.push(newCategory);
        showToast('分类已添加', 'success');
    }

    saveData();
    closeCategoryModal();
    renderCategories();
}

// 删除分类相关
let deletingCategoryId = null;

function openDeleteCategoryModal(categoryId) {
    const category = data.categories.find(c => c.id === categoryId);
    if (!category) return;

    const count = data.bookmarks.filter(b => b.categoryId === categoryId).length;

    // 如果分类下没有书签，直接删除不需要确认
    if (count === 0) {
        deleteCategoryDirectly(categoryId);
        return;
    }

    deletingCategoryId = categoryId;
    document.getElementById('deleteCategoryName').textContent = category.name;
    document.getElementById('deleteCategoryCount').textContent = count;
    document.getElementById('deleteCategoryModal').classList.add('active');
}

// 直接删除空分类（无需确认）
function deleteCategoryDirectly(categoryId) {
    const categoryName = data.categories.find(c => c.id === categoryId)?.name || '';
    data.categories = data.categories.filter(c => c.id !== categoryId);

    if (currentCategory === categoryId) {
        currentCategory = 'all';
    }

    saveData();
    renderCategories();
    renderBookmarks();
    showToast(`分类"${categoryName}"已删除`, 'success');
}

function closeDeleteCategoryModal() {
    document.getElementById('deleteCategoryModal').classList.remove('active');
    deletingCategoryId = null;
}

function confirmDeleteCategory(keepBookmarks) {
    if (!deletingCategoryId) return;

    const categoryName = data.categories.find(c => c.id === deletingCategoryId)?.name || '';

    if (!keepBookmarks) {
        // 一并删除书签
        data.bookmarks = data.bookmarks.filter(b => b.categoryId !== deletingCategoryId);
        showToast(`分类"${categoryName}"及相关书签已删除`, 'success');
    } else {
        // 保留书签，移除分类关联
        data.bookmarks.forEach(b => {
            if (b.categoryId === deletingCategoryId) {
                b.categoryId = '';
            }
        });
        showToast(`分类"${categoryName}"已删除，书签已保留`, 'success');
    }

    // 删除分类
    data.categories = data.categories.filter(c => c.id !== deletingCategoryId);

    // 如果删除的是当前分类，切换到"全部"
    if (currentCategory === deletingCategoryId) {
        currentCategory = 'all';
    }

    saveData();
    closeDeleteCategoryModal();
    renderCategories();
    renderBookmarks();
}

// ========== 清空所有书签 ==========
function clearAllBookmarks() {
    if (data.bookmarks.length === 0) {
        showToast('没有书签可删除', 'warning');
        return;
    }

    if (confirm(`确定要删除全部 ${data.bookmarks.length} 个书签吗？\n此操作不可撤销！`)) {
        data.bookmarks = [];
        // 清理所有非默认分类（因为没有书签了）
        const removedCount = data.categories.filter(c => !c.isDefault).length;
        data.categories = data.categories.filter(c => c.isDefault);
        currentCategory = 'all';
        saveData();
        renderCategories();
        renderBookmarks();
        showToast(`已清空所有书签，删除了 ${removedCount} 个空分类`, 'success');
    }
}

// ========== 导入导出 ==========
function exportData() {
    // 打开导出格式选择模态框
    document.getElementById('exportModal').classList.add('active');
}

function closeExportModal() {
    document.getElementById('exportModal').classList.remove('active');
}

function doExport(format) {
    const dateStr = new Date().toISOString().slice(0, 10);

    if (format === 'json') {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        downloadBlob(blob, `bookmarks_${dateStr}.json`);
        showToast('JSON 导出成功', 'success');
    } else if (format === 'html') {
        const html = generateBookmarkHtml();
        const blob = new Blob([html], { type: 'text/html' });
        downloadBlob(blob, `bookmarks_${dateStr}.html`);
        showToast('HTML 导出成功', 'success');
    }

    closeExportModal();
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function generateBookmarkHtml() {
    const date = new Date().toISOString();

    // 按分类组织书签
    const categoryMap = {};
    data.categories.forEach(cat => {
        if (cat.id !== 'all') {
            categoryMap[cat.id] = { id: cat.id, name: cat.name, icon: cat.icon, bookmarks: [] };
        }
    });

    data.bookmarks.forEach(b => {
        const catId = b.categoryId || '';
        if (categoryMap[catId]) {
            categoryMap[catId].bookmarks.push(b);
        } else {
            if (!categoryMap['_uncategorized']) {
                categoryMap['_uncategorized'] = { id: '', name: '未分类', icon: 'fa-folder', bookmarks: [] };
            }
            categoryMap['_uncategorized'].bookmarks.push(b);
        }
    });

    let foldersHtml = '';
    for (const [catId, cat] of Object.entries(categoryMap)) {
        if (cat.bookmarks.length === 0) continue;

        let linksHtml = '';
        cat.bookmarks.forEach(b => {
            const iconAttr = b.favicon && b.favicon !== 'failed' ? ` ICON="${escapeHtml(b.favicon)}"` : '';
            const tagsAttr = b.tags && b.tags.length > 0 ? ` TAGS="${escapeHtml(b.tags.join(','))}"` : '';
            const descAttr = b.description ? ` DESCRIPTION="${escapeHtml(b.description)}"` : '';
            const faviconAttr = b.favicon && b.favicon !== 'failed' ? ` FAVICON="${escapeHtml(b.favicon)}"` : '';
            linksHtml += `        <DT><A HREF="${escapeHtml(b.url)}"${iconAttr}${tagsAttr}${descAttr}${faviconAttr}>${escapeHtml(b.title)}</A>\n`;
            if (b.description) {
                linksHtml += `        <DD>${escapeHtml(b.description)}\n`;
            }
        });

        foldersHtml += `    <DT><H3 CAT_ID="${escapeHtml(cat.id)}" CAT_ICON="${escapeHtml(cat.icon)}">${escapeHtml(cat.name)}</H3>\n    <DL>\n${linksHtml}    </DL>\n`;
    }

    // 在 HTML 注释中嵌入完整 JSON 数据，确保导入时能还原所有元数据
    const jsonBackup = JSON.stringify(data);

    return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file by 书签管理器. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<!-- BOOKMARK_MANAGER_DATA_START
${btoa(unescape(encodeURIComponent(jsonBackup)))}
BOOKMARK_MANAGER_DATA_END -->
<DL>
${foldersHtml}</DL>
`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;

        // 判断文件类型
        if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
            // 优先检查是否为本应用导出的 HTML（包含嵌入 JSON）
            const embedMatch = content.match(/BOOKMARK_MANAGER_DATA_START\n([\s\S]*?)\nBOOKMARK_MANAGER_DATA_END/);
            if (embedMatch) {
                try {
                    const jsonStr = decodeURIComponent(escape(atob(embedMatch[1].trim())));
                    const imported = JSON.parse(jsonStr);
                    if (imported.categories && imported.bookmarks) {
                        importJsonWithDedup(imported);
                        return;
                    }
                } catch (err) {
                    console.warn('嵌入数据解析失败，回退到标准书签解析', err);
                }
            }
            // 标准浏览器书签 HTML 格式
            importBrowserBookmarks(content);
        } else {
            // JSON 格式
            try {
                const imported = JSON.parse(content);
                if (!imported.categories || !imported.bookmarks) {
                    showToast('无效的书签文件格式', 'error');
                    return;
                }
                importJsonWithDedup(imported);
            } catch (err) {
                showToast('文件解析失败', 'error');
            }
        }
    };
    reader.readAsText(file);
}

// JSON 数据导入（支持去重合并）
function importJsonWithDedup(imported) {
    if (confirm('是否合并到现有数据？\n（选择"取消"将覆盖现有数据）')) {
        // 合并模式 - URL 去重
        const existingUrls = new Set(data.bookmarks.map(b => b.url.replace(/\/+$/, '')));
        const newBookmarks = imported.bookmarks.filter(b => !existingUrls.has(b.url.replace(/\/+$/, '')));
        const skippedCount = imported.bookmarks.length - newBookmarks.length;

        // 合并分类（避免重复）
        const existingCatNames = new Set(data.categories.map(c => c.name.toLowerCase()));
        const newCategories = imported.categories.filter(c => c.id === 'all' || !existingCatNames.has(c.name.toLowerCase()));

        data.categories = [...data.categories, ...newCategories];
        data.bookmarks = [...newBookmarks, ...data.bookmarks];

        const msg = skippedCount > 0
            ? `成功导入 ${newBookmarks.length} 个书签（跳过 ${skippedCount} 个重复）`
            : `成功导入 ${newBookmarks.length} 个书签`;
        showToast(msg, 'success');
    } else {
        // 覆盖模式
        data = imported;
        showToast('数据导入成功（已覆盖）', 'success');
    }

    saveData();
    currentCategory = 'all';
    renderCategories();
    renderBookmarks();
}

// 导入浏览器书签 HTML（支持文件夹结构）
function importBrowserBookmarks(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const importedCategories = [];
    const importedBookmarks = [];
    const categoryMap = new Map(); // 文件夹名 -> categoryId
    let bookmarkIdCounter = 0;
    let categoryIdCounter = 0;

    // 分类图标映射
    const categoryIcons = {
        '默认': 'fa-folder',
        '工作': 'fa-briefcase',
        '学习': 'fa-book',
        '开发': 'fa-code',
        '娱乐': 'fa-gamepad',
        '购物': 'fa-shopping-cart',
        '社交': 'fa-users',
        '新闻': 'fa-newspaper',
        '音乐': 'fa-music',
        '视频': 'fa-video',
        '图片': 'fa-image',
        '工具': 'fa-tools',
        '阅读': 'fa-book-open',
        '旅行': 'fa-plane',
        '美食': 'fa-utensils'
    };

    // 根据名称猜测图标
    function guessIcon(name) {
        for (const [key, icon] of Object.entries(categoryIcons)) {
            if (name.includes(key)) return icon;
        }
        return 'fa-folder';
    }

    // 递归解析书签结构
    function parseFolder(element, parentPath = '') {
        const items = element.querySelectorAll(':scope > dt');

        items.forEach(dt => {
            const h3 = dt.querySelector(':scope > h3');
            const dl = dt.querySelector(':scope > dl');
            const link = dt.querySelector(':scope > a');

            if (h3 && dl) {
                // 这是一个文件夹
                const folderName = h3.textContent?.trim();
                if (folderName && folderName !== '书签栏' && folderName !== 'Bookmarks bar') {
                    const categoryId = 'imported_' + Date.now() + '_' + categoryIdCounter++;
                    const fullPath = parentPath ? `${parentPath}/${folderName}` : folderName;

                    importedCategories.push({
                        id: categoryId,
                        name: folderName,
                        icon: guessIcon(folderName),
                        isDefault: false
                    });
                    categoryMap.set(fullPath, categoryId);

                    // 递归解析子文件夹
                    parseFolder(dl, fullPath);
                } else if (folderName) {
                    // 跳过"书签栏"层级，但继续解析其内容
                    parseFolder(dl, parentPath);
                }
            } else if (link) {
                // 这是一个书签
                const url = link.getAttribute('href');
                const title = link.textContent?.trim();
                const icon = link.getAttribute('icon');
                const addDate = link.getAttribute('add_date');

                if (url && title && (url.startsWith('http') || url.startsWith('https'))) {
                    importedBookmarks.push({
                        id: Date.now().toString() + '_' + bookmarkIdCounter++,
                        url,
                        title,
                        description: '',
                        categoryId: categoryMap.get(parentPath) || '',
                        tags: [],
                        favicon: icon || '',
                        addDate: addDate || null
                    });
                }
            }
        });
    }

    // 找到主书签列表并解析
    const mainDl = doc.querySelector('dl') || doc.body;
    parseFolder(mainDl);

    // 统计
    const folderCount = importedCategories.length;
    const bookmarkCount = importedBookmarks.length;

    if (bookmarkCount === 0) {
        showToast('未找到有效书签', 'warning');
        return;
    }

    // 显示导入预览
    const message = folderCount > 0
        ? `发现 ${bookmarkCount} 个书签，${folderCount} 个文件夹\n是否合并到现有数据？\n（选择"取消"将覆盖现有数据）`
        : `发现 ${bookmarkCount} 个书签，是否合并到现有数据？\n（选择"取消"将覆盖现有数据）`;

    if (confirm(message)) {
        // 合并模式 - URL 去重
        const existingUrls = new Set(data.bookmarks.map(b => b.url.replace(/\/+$/, '')));
        const newBookmarks = importedBookmarks.filter(b => !existingUrls.has(b.url.replace(/\/+$/, '')));
        const skippedCount = importedBookmarks.length - newBookmarks.length;

        data.categories = [...data.categories, ...importedCategories];
        data.bookmarks = [...newBookmarks, ...data.bookmarks];

        const msg = skippedCount > 0
            ? `成功导入 ${newBookmarks.length} 个书签，${folderCount} 个分类（跳过 ${skippedCount} 个重复）`
            : `成功导入 ${newBookmarks.length} 个书签，${folderCount} 个分类`;
        showToast(msg, 'success');
    } else {
        // 覆盖模式（保留默认分类）
        const defaultCategories = data.categories.filter(c => c.isDefault);
        data.categories = [...defaultCategories, ...importedCategories];
        data.bookmarks = importedBookmarks;
        showToast(`成功导入 ${bookmarkCount} 个书签，${folderCount} 个分类（已覆盖）`, 'success');
    }

    saveData();
    currentCategory = 'all';
    renderCategories();
    renderBookmarks();
}

// ========== 事件绑定 ==========
function bindEvents() {
    // 自定义分类下拉框
    const categorySelect = document.getElementById('categorySelect');
    const categoryInput = document.getElementById('bookmarkCategory');
    const categoryDropdown = document.getElementById('categoryDropdown');

    if (categorySelect && categoryInput && categoryDropdown) {
        // 点击输入框显示/隐藏下拉框
        categoryInput.addEventListener('focus', () => {
            categorySelect.classList.add('open');
            updateCategorySelect();
        });

        // 点击下拉图标切换
        categorySelect.querySelector('.dropdown-icon')?.addEventListener('click', (e) => {
            e.stopPropagation();
            categoryInput.focus();
        });

        // 选择选项
        categoryDropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-select-option');
            if (option && option.dataset.name) {
                categoryInput.value = option.dataset.name;
                categorySelect.classList.remove('open');
            }
        });

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!categorySelect.contains(e.target)) {
                categorySelect.classList.remove('open');
            }
        });
    }

    // 搜索（带防抖）
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(renderBookmarks, 300);
        // 显示/隐藏清空按钮
        clearSearchBtn.classList.toggle('visible', searchInput.value.length > 0);
    });

    // 清空搜索按钮
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.classList.remove('visible');
        renderBookmarks();
        searchInput.focus();
    });

    // 添加书签按钮
    document.getElementById('addBookmarkBtn').addEventListener('click', openAddModal);

    // URL 输入框 - 自动获取标题
    document.getElementById('bookmarkUrl').addEventListener('input', onUrlInput);

    // 回车键保存书签（描述框和标签框除外）
    const enterSaveInputs = ['bookmarkUrl', 'bookmarkTitle', 'bookmarkCategory'];
    enterSaveInputs.forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveBookmark();
            }
        });
    });

    // 标签输入框 - 回车键添加逗号分隔
    document.getElementById('bookmarkTags')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const input = e.target;
            const value = input.value.trim();
            // 如果末尾没有逗号，添加逗号和空格
            if (value && !value.endsWith(',') && !value.endsWith('，')) {
                input.value = value + ', ';
            }
        }
    });

    // URL 输入框旁的跳转按钮
    document.getElementById('openUrlBtn')?.addEventListener('click', () => {
        let url = document.getElementById('bookmarkUrl').value.trim();
        if (url) {
            // 自动补全 URL
            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }
            window.open(url, '_blank');
        }
    });

    // 分类输入框变化时，自动添加分类名称到标签
    document.getElementById('bookmarkCategory')?.addEventListener('change', (e) => {
        const categoryName = e.target.value.trim();
        const tagsInput = document.getElementById('bookmarkTags');
        if (!tagsInput) return;

        const currentTags = tagsInput.value;

        // 如果有分类名称，且标签中没有这个分类，自动添加
        if (categoryName) {
            const tags = currentTags.split(',').map(t => t.trim()).filter(t => t);
            if (!tags.includes(categoryName)) {
                tagsInput.value = categoryName + (currentTags ? ', ' + currentTags : '');
            }
        }
    });

    // 添加分类
    document.getElementById('addCategoryBtn').addEventListener('click', openCategoryModal);

    // 分类模态框回车保存
    document.getElementById('categoryName').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveCategory();
        }
    });

    // 主题切换
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // 清空所有书签
    document.getElementById('clearAllBtn').addEventListener('click', clearAllBookmarks);

    // 导入导出
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importInput').click();
    });
    document.getElementById('importInput').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            importData(e.target.files[0]);
            e.target.value = '';
        }
    });

    // 点击模态框外部不关闭（用户要求）

    // ESC 关闭模态框 + 快捷键
    document.addEventListener('keydown', (e) => {
        // ESC 关闭所有模态框
        if (e.key === 'Escape') {
            closeModal();
            closeCategoryModal();
            closeDeleteCategoryModal();
        }

        // Ctrl/Cmd + K 聚焦搜索框
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }

        // Ctrl/Cmd + N 添加书签
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            openAddModal();
        }
    });

    // URL输入框自动获取标题
    document.getElementById('bookmarkUrl').addEventListener('blur', async function() {
        let url = this.value.trim();

        // 自动补全 https:// 前缀
        if (url && !/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
            this.value = url;
        }

        const titleInput = document.getElementById('bookmarkTitle');

        if (url && !titleInput.value) {
            // 尝试从URL提取域名作为默认标题
            try {
                const urlObj = new URL(url);
                titleInput.value = urlObj.hostname.replace('www.', '');
            } catch {}
        }
    });
}

// ========== 右键菜单 ==========
let contextMenuTargetId = null;

function showCategoryContextMenu(e, categoryId) {
    const menu = document.getElementById('categoryContextMenu');
    contextMenuTargetId = categoryId;

    // 定位菜单
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    menu.classList.add('show');

    // 确保菜单不超出屏幕
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
    }
}

function hideCategoryContextMenu() {
    const menu = document.getElementById('categoryContextMenu');
    menu.classList.remove('show');
    contextMenuTargetId = null;
}

// 右键菜单事件绑定
document.getElementById('ctxEditCategory').addEventListener('click', () => {
    if (contextMenuTargetId) {
        openEditCategoryModal(contextMenuTargetId);
    }
    hideCategoryContextMenu();
});

document.getElementById('ctxDeleteCategory').addEventListener('click', () => {
    if (contextMenuTargetId) {
        openDeleteCategoryModal(contextMenuTargetId);
    }
    hideCategoryContextMenu();
});

// 点击其他地方关闭菜单
document.addEventListener('click', (e) => {
    const menu = document.getElementById('categoryContextMenu');
    if (!menu.contains(e.target)) {
        hideCategoryContextMenu();
    }
});
