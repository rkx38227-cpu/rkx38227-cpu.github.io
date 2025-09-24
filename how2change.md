日志
9.24 本地修改后如何成功上传
在本地修改后同步到 GitHub 的流程分为两部分：**同步源文件（`main` 分支）** 和 **同步静态文件（`gh-pages` 分支）**，具体步骤如下：


### 一、同步源文件（`main` 分支，存放 Hugo 源文件）
当你修改了 Hugo 源文件（如 `content/`、`themes/`、`config.toml` 等），需要提交到 `main` 分支并推送到远程：

1. **查看修改内容**（可选）：
   ```bash
   # 查看当前修改的文件
   git status
   ```

2. **暂存修改**：
   ```bash
   # 暂存所有修改（推荐）
   git add .
   # 或单独暂存指定文件
   git add 文件名
   ```

3. **提交修改**：
   ```bash
   git commit -m "描述修改内容，例如：更新首页按钮样式 / 添加新文章"
   ```

4. **推送到 GitHub 的 `main` 分支**：
   ```bash
   git push origin main
   ```


### 二、同步静态文件（`gh-pages` 分支，存放 Hugo 生成的网页）
当你修改源文件后，需要重新生成静态文件并同步到 `gh-pages` 分支（用于部署）：

1. **重新生成静态文件**（在主目录执行，确保当前在 `main` 分支）：
   ```bash
   hugo
   # 生成的静态文件会更新到 public/ 目录（已关联 gh-pages 分支）
   ```

2. **进入 `public` 目录**（关联 `gh-pages` 分支）：
   ```bash
   cd public
   ```

3. **提交静态文件修改**：
   ```bash
   # 查看 public 目录的修改
   git status
   # 暂存并提交
   git add .
   git commit -m "同步静态文件：对应 main 分支的 xxx 修改"
   ```

4. **推送到 GitHub 的 `gh-pages` 分支**：
   ```bash
   git push origin gh-pages
   ```

5. **返回主目录**：
   ```bash
   cd ..
   ```


### 总结流程
日常开发同步的完整步骤（修改后）：
```bash
# 1. 处理源文件（main 分支）
git add .
git commit -m "修改说明"
git push origin main

# 2. 生成并同步静态文件（gh-pages 分支）
hugo
cd public
git add .
git commit -m "同步静态文件"
git push origin gh-pages
cd ..
```

这样就能确保 GitHub 上的源文件和部署的静态文件都与本地保持一致了。如果远程分支有其他人的修改，建议先执行 `git pull origin 分支名` 拉取最新内容，避免冲突。