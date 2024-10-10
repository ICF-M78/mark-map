const vscode = require("vscode");

// MARK: 插件激活时调用的函数
function activate(context) {
  // 创建 MarkMapProvider 实例
  const markMapProvider = new MarkMapProvider();

  // 注册树数据提供者，用于在大纲视图中显示注释列表
  vscode.window.registerTreeDataProvider(
    "markCommentsOutline",
    markMapProvider
  );

  // 监听文档保存事件
  vscode.workspace.onDidSaveTextDocument(() => {
    markMapProvider.refresh();
  });

  // 监听文档内容变化事件
  vscode.workspace.onDidChangeTextDocument(() => {
    markMapProvider.refresh();
  });

  // 监听活动编辑器变化事件
  vscode.window.onDidChangeActiveTextEditor(() => {
    markMapProvider.refresh();
  });

  // 注册命令
  registerCommands(context);
}

// MarkMapProvider 类，用于提供注释列表的数据
class MarkMapProvider {
  constructor() {
    // 创建事件发射器，用于通知视图数据变化
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  // 刷新视图数据
  refresh() {
    this._onDidChangeTreeData.fire();
  }

  // 获取树项
  getTreeItem(element) {
    return element;
  }

  // 获取子节点
  getChildren() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return Promise.resolve([]);
    }

    const text = editor.document.getText();
    const markComments = this.parseMarkComments(text);
    return Promise.resolve(
      markComments.map((comment) => new MarkCommentItem(comment))
    );
  }

  // MARK: 解析文本中的注释
  parseMarkComments(text) {
    const markArr = [];
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      const match = line.match(/\/\/\s*MARK:\s*(.*)/);
      // 匹配 <template>、<script、<style
      const match1 = line.match(/^<template>/);
      const match2 = line.match(/^<script/);
      const match3 = line.match(/^<style/);
      if (match) {
        markArr.push({
          label: `${match[1]}`,
          line: index,
          type: "mark",
          icon: "circle-small",
        });
      }
      if (match1) {
        markArr.push({
          label: `<template>`,
          line: index,
          type: "template",
          icon: "circle",
        });
      }
      if (match2) {
        markArr.push({
          label: `<script>`,
          line: index,
          type: "script",
          icon: "circle",
        });
      }
      if (match3) {
        markArr.push({
          label: `<style>`,
          line: index,
          type: "style",
          icon: "circle",
        });
      }
    });
    return markArr;
  }
}

// MarkCommentItem 类，表示一个注释项
class MarkCommentItem extends vscode.TreeItem {
  constructor(comment) {
    super(comment.label, vscode.TreeItemCollapsibleState.None);
    this.command = {
      command: "markMap.revealLine",
      title: "标记地图",
      arguments: [comment.line],
    };
    this.iconPath = this.getIconPath(comment.icon);
  }
  getIconPath(icon) {
    return new vscode.ThemeIcon(icon);
  }
}

// 注册命令
function registerCommands(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("markMap.revealLine", (line) => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const position = new vscode.Position(line, 0);
        const range = new vscode.Range(position, position);
        editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
        editor.selection = new vscode.Selection(position, position);
      }
    })
  );
}

// 导出激活和停用函数
exports.activate = (context) => {
  activate(context);
};

function deactivate() {}

exports.deactivate = deactivate;
