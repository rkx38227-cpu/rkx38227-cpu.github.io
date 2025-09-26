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
  // 添加部署基础路径
  baseUrl: "https://rkx38227-cpu.github.io/rkx38227-cpu.github.io/"
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

// 错误处理函数
export function handleError(error, operation) {
  console.error(`${operation}失败：`, error);
  alert(`${operation}失败：${error.message}`);
}

// 格式化日期
export function formatDate(isoString) {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 页面切换函数
export function showPage(pageId, dom) {
  // 隐藏所有页面
  Object.values(dom.pages).forEach(page => {
    page.classList.add('hidden', 'opacity-0', 'transform', 'translate-y-4');
  });
  
  // 显示目标页面
  const target = dom.pages[pageId];
  target.classList.remove('hidden');
  setTimeout(() => {
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