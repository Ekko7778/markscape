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

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    loadData();
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

// ========== 渲染分类 ==========
function renderCategories() {
    const container = document.getElementById('categoryTabs');
    container.innerHTML = '';

    data.categories.forEach(cat => {
                const count = cat.id === 'all'
                    ? data.bookmarks.length
                    : data.bookmarks.filter(b => b.categoryId === cat.id).length;

                const tab = document.createElement('button');
                tab.className = `tab ${currentCategory === cat.id ? 'active' : ''}`;
                tab.innerHTML = `
                    <i class="fas ${cat.icon}"></i>
                    ${cat.name}
                    <span class="tab-count">${count}</span>
                `;
                tab.onclick = () => selectCategory(cat.id);
                container.appendChild(tab);
            });

    // 添加"新建分类"按钮
    const addBtn = document.createElement('button');
    addBtn.className = 'tab tab-add';
    addBtn.innerHTML = '<i class="fas fa-plus"></i>';
    addBtn.title = '添加分类';
    addBtn.onclick = openCategoryModal;
    container.appendChild(addBtn);

    // 更新书签表单中的分类选择
    updateCategorySelect();
}

function selectCategory(categoryId) {
    currentCategory = categoryId;
    renderCategories();
    renderBookmarks();
}

function updateCategorySelect() {
    const select = document.getElementById('bookmarkCategory');
    select.innerHTML = data.categories
        .filter(c => c.id !== 'all')
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join('');
}

// ========== 渲染书签 ==========
function renderBookmarks() {
    const container = document.getElementById('bookmarksGrid');
    const emptyState = document.getElementById('emptyState');
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();

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
        <div class="bookmark-card" onclick="openBookmark('${bookmark.url}')">
            <div class="bookmark-header">
                <div class="bookmark-icon">
                    ${getFavicon(bookmark)}
                </div>
                <div class="bookmark-info">
                    <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
                    <div class="bookmark-url">${escapeHtml(bookmark.url)}</div>
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
            ${bookmark.description ? `<div class="bookmark-desc">${escapeHtml(bookmark.description)}</div>` : ''}
            ${bookmark.tags?.length ? `
                <div class="bookmark-tags">
                    ${bookmark.tags.map(tag => `<span class="bookmark-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function getFavicon(bookmark) {
    if (bookmark.favicon) {
        return `<img src="${bookmark.favicon}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <i class="fas fa-link" style="display:none"></i>`;
    }
    // 使用 Google Favicon 服务
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=32`;
    return `<img src="${faviconUrl}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <i class="fas fa-link" style="display:none;color: var(--accent)"></i>`;
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
    document.getElementById('bookmarkCategory').value = currentCategory !== 'all' ? currentCategory : '';
    document.getElementById('bookmarkModal').classList.add('active');
}

function editBookmark(id) {
    const bookmark = data.bookmarks.find(b => b.id === id);
    if (!bookmark) return;

    editingBookmarkId = id;
    document.getElementById('modalTitle').textContent = '编辑书签';
    document.getElementById('bookmarkUrl').value = bookmark.url;
    document.getElementById('bookmarkTitle').value = bookmark.title;
    document.getElementById('bookmarkDesc').value = bookmark.description || '';
    document.getElementById('bookmarkCategory').value = bookmark.categoryId || '';
    document.getElementById('bookmarkTags').value = bookmark.tags?.join(', ') || '';
    document.getElementById('bookmarkModal').classList.add('active');
}

function saveBookmark() {
    const url = document.getElementById('bookmarkUrl').value.trim();
    const title = document.getElementById('bookmarkTitle').value.trim();
    const description = document.getElementById('bookmarkDesc').value.trim();
    const categoryId = document.getElementById('bookmarkCategory').value;
    const tagsStr = document.getElementById('bookmarkTags').value;

    if (!url || !title) {
        alert('请填写URL和标题');
        return;
    }

    // 验证URL
    try {
        new URL(url);
    } catch {
        alert('请输入有效的URL');
        return;
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
    } else {
        // 添加模式
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
    }

    saveData();
    closeModal();
    renderCategories();
    renderBookmarks();
}

function deleteBookmark(id) {
    if (!confirm('确定要删除这个书签吗？')) return;

    data.bookmarks = data.bookmarks.filter(b => b.id !== id);
    saveData();
    renderCategories();
    renderBookmarks();
}

function openBookmark(url) {
    window.open(url, '_blank');
}

function closeModal() {
    document.getElementById('bookmarkModal').classList.remove('active');
    editingBookmarkId = null;
}

// ========== 分类操作 ==========
function openCategoryModal() {
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryIcon').value = 'fa-folder';
    document.getElementById('categoryModal').classList.add('active');
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
}

function saveCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const icon = document.getElementById('categoryIcon').value;

    if (!name) {
        alert('请输入分类名称');
        return;
    }

    const newCategory = {
        id: 'cat_' + Date.now(),
        name,
        icon
    };

    data.categories.push(newCategory);
    saveData();
    closeCategoryModal();
    renderCategories();
}

// ========== 导入导出 ==========
function exportData() {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);

            // 验证数据结构
            if (!imported.categories || !imported.bookmarks) {
                alert('无效的书签文件格式');
                return;
            }

            if (confirm('导入将覆盖现有数据，确定继续吗？')) {
                data = imported;
                saveData();
                currentCategory = 'all';
                renderCategories();
                renderBookmarks();
            }
        } catch (err) {
            alert('文件解析失败: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// ========== 事件绑定 ==========
function bindEvents() {
    // 搜索
    document.getElementById('searchInput').addEventListener('input', renderBookmarks);

    // 添加书签按钮
    document.getElementById('addBookmarkBtn').addEventListener('click', openAddModal);

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

    // 点击模态框外部关闭
    document.getElementById('bookmarkModal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });
    document.getElementById('categoryModal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeCategoryModal();
        }
    });

    // ESC 关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeCategoryModal();
        }
    });

    // URL输入框自动获取标题
    document.getElementById('bookmarkUrl').addEventListener('blur', async function() {
        const url = this.value.trim();
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
