// common.js - 共享函数和配置

// 常量定义
const CACHE_EXPIRE = 600000; // 10分钟（毫秒）
const CACHE_KEY_CONTENTS = 'cachedContents';
const CACHE_KEY_TIME = 'cacheTime';

// GitHub配置（替换为你的信息）
export const githubConfig = {
  username: "rkx38227-cpu",
  repo: "rkx38227-cpu.github.io",
  branch: "main", // 或 master
  dataFile: "data.json", // 存储内容数据的文件
  imageDir: "static/images/user-uploads/", // 图片存储目录
  // 修正部署基础路径
  baseUrl: "https://rkx38227-cpu.github.io/"
};

// 令牌管理函数
export function saveToken(token) {
  sessionStorage.setItem('githubToken', token);
}

export function getToken() {
  return sessionStorage.getItem('githubToken');
}

export function clearToken() {
  sessionStorage.removeItem('githubToken');
}

// 统一DOM元素获取
export function getDomElements() {
  return {
    pages: {
      home: document.getElementById('home-page'),
      input: document.getElementById('input-page'),
      view: document.getElementById('view-page'),
      detail: document.getElementById('detail-page')
    },
    buttons: {
      toInput: document.getElementById('to-input-btn'),
      toView: document.getElementById('to-view-btn'),
      backFromInput: document.getElementById('back-from-input'),
      backFromView: document.getElementById('back-from-view'),
      backFromDetail: document.getElementById('back-from-detail'),
      saveContent: document.getElementById('save-content'),
      deleteContent: document.getElementById('delete-content')
    },
    forms: {
      titleInput: document.getElementById('title-input'),
      contentInput: document.getElementById('content-input'),
      imageUpload: document.getElementById('image-upload'),
      imagePreview: document.getElementById('image-preview')
    },
    content: {
      emptyState: document.getElementById('empty-state'),
      contentList: document.getElementById('content-list'),
      detailTitle: document.getElementById('detail-title'),
      detailContent: document.getElementById('detail-content'),
      detailTypeBadge: document.getElementById('detail-type-badge')
    },
    other: {
      imageUploadBtn: document.querySelector('.bg-gray-100 button')
    }
  };
}

// 缓存操作封装
export const cache = {
  getContents() {
    const time = localStorage.getItem(CACHE_KEY_TIME);
    const contents = localStorage.getItem(CACHE_KEY_CONTENTS);
    if (time && contents && new Date().getTime() - parseInt(time) < CACHE_EXPIRE) {
      return JSON.parse(contents);
    }
    return null;
  },
  setContents(contents) {
    localStorage.setItem(CACHE_KEY_CONTENTS, JSON.stringify(contents));
    localStorage.setItem(CACHE_KEY_TIME, new Date().getTime().toString());
  }
};

// 显示轻量提示组件
export function showToast(message, type = 'error') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg ${
    type === 'error' ? 'bg-red-500' : 'bg-green-500'
  } text-white z-50`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// 错误处理函数
export function handleError(error, operation) {
  console.error(`${operation}失败：`, error);
  showToast(`${operation}失败：${error.message}`);
}

// 格式化日期
export function formatDate(isoString) {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 页面切换函数
export function showPage(pageId, dom) {
  Object.values(dom.pages).forEach(page => {
    page.classList.add('hidden', 'opacity-0', 'translate-y-4');
    page.classList.remove('fade-in', 'slide-up');
  });
  const target = dom.pages[pageId];
  target.classList.remove('hidden');
  setTimeout(() => { // 确保重排后应用动画
    target.classList.add('fade-in', 'slide-up');
    target.classList.remove('opacity-0', 'translate-y-4');
  }, 10);
}

// 读取GitHub仓库中已有的数据
export async function fetchExistingData(token, config) {
  try {
    const response = await fetch(`https://api.github.com/repos/${config.username}/${config.repo}/contents/${config.dataFile}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });

    if (response.status === 404) {
      // 文件不存在，返回空数组
      return { data: [], sha: null };
    }

    if (!response.ok) {
      const errorDetails = await response.text();
      if (response.status === 401) {
        throw new Error(`令牌无效或已过期: ${errorDetails}`);
      } else {
        throw new Error(`读取历史数据失败 (${response.status}): ${errorDetails}`);
      }
    }

    const data = await response.json();
    // GitHub返回的content是base64编码，需要解码
    const decodedContent = atob(data.content);
    return { data: JSON.parse(decodedContent), sha: data.sha };
  } catch (error) {
    console.error("读取历史数据出错：", error);
    throw error;
  }
}

// 上传图片到GitHub并返回图片URL
export async function uploadImageToGitHub(file, token, config) {
  try {
    // 生成唯一文件名（避免重复）
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const filePath = `${config.imageDir}${fileName}`;
      
    // 读取图片并转为base64
    const base64Image = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]); // 移除base64前缀
      reader.readAsDataURL(file);
    });
      
    // 调用GitHub API创建图片文件
    const response = await fetch(`https://api.github.com/repos/${config.username}/${config.repo}/contents/${filePath}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: `Upload image: ${fileName}`, // 提交信息
        content: base64Image, // base64编码的图片内容
        branch: config.branch
      })
    });
      
    if (!response.ok) {
      const errorDetails = await response.text(); // 获取详细错误信息
      if (response.status === 401) {
        throw new Error(`令牌无效或已过期: ${errorDetails}`);
      } else if (response.status === 404) {
        throw new Error(`路径不存在: ${errorDetails}`);
      } else {
        throw new Error(`图片上传失败 (${response.status}): ${errorDetails}`);
      }
    }
      
    // 返回图片的访问URL（基于GitHub Pages实际部署路径）
    return `${config.baseUrl}${config.imageDir}${fileName}`;
  } catch (error) {
    console.error("图片上传失败：", error);
    throw error;
  }
}

// 加载GitHub数据
export async function loadDataFromGitHub(dom, cache, fetchExistingData, handleError, saveToken, getToken, githubConfig) {
  // 检查本地缓存
  const cached = cache.getContents();
  if (cached) {
    return cached;
  }

  const token = getToken() || prompt("请输入GitHub令牌以加载内容：");
  if (!token) return [];
  
  saveToken(token); // 保存到sessionStorage

  try {
    const result = await fetchExistingData(token, githubConfig);
    // 保存数据到本地缓存
    cache.setContents(result.data);
    return result.data;
  } catch (error) {
    handleError(error, "加载数据");
    return [];
  }
}

// 渲染内容列表
export function renderContentList(contents, dom, formatDate, showDetail) {
  // 清空现有列表（除了空状态）
  while (dom.content.contentList.children.length > 1) {
    dom.content.contentList.removeChild(dom.content.contentList.lastChild);
  }
  
  // 检查是否有内容
  if (contents.length === 0) {
    dom.content.emptyState.classList.remove('hidden');
    return;
  }
  
  // 隐藏空状态
  dom.content.emptyState.classList.add('hidden');
  
  // 倒序显示（最新的在前面）
  const reversedContents = [...contents].reverse();
  
  // 添加列表项
  reversedContents.forEach((content, index) => {
    const originalIndex = contents.length - 1 - index;
    const listItem = document.createElement('div');
    
    // 根据类型设置不同的样式
    let typeClass, typeText;
    if (content.type === '写给李佳凝') {
      typeClass = 'border-l-4 border-primary';
      typeText = '写给李佳凝';
    } else if (content.type === '写给许若坤') {
      typeClass = 'border-l-4 border-accent';
      typeText = '写给许若坤';
    } else {
      typeClass = 'border-l-4 border-gray-300';
      typeText = '其他类型';
    }
    
    listItem.className = `bg-white rounded-r-lg shadow-sm p-4 ${typeClass} hover:shadow-md transition-shadow cursor-pointer`;
    listItem.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-medium text-dark ${!content.title ? 'text-gray-400' : ''}">
            ${content.title || '无标题'}
          </h3>
          <p class="text-xs text-gray-500 mt-1">${typeText} · ${formatDate(content.timestamp)}</p>
        </div>
        <i class="fa fa-chevron-right text-gray-400"></i>
      </div>
      <p class="text-gray-600 text-sm mt-2 line-clamp-2">${content.content.substring(0, 50)}${content.content.length > 50 ? '...' : ''}</p>
    `;
    
    // 点击查看详情
    listItem.addEventListener('click', () => {
      showDetail(originalIndex);
    });
    
    dom.content.contentList.appendChild(listItem);
  });
}