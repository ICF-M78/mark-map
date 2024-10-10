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
      // 匹配 // TODO // TAG // DONE
      const match4 = line.match(/\/\/\s*TODO\s*(.*)/);
      const match5 = line.match(/\/\/\s*TAG\s*(.*)/);
      const match6 = line.match(/\/\/\s*DONE\s*(.*)/);
      if (match) {
        markArr.push({
          label: `${match[1]}`,
          line: index,
          type: "mark",
          icon: "circle",
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
      if (match4) {
        markArr.push({
          label: `TODO ${match4[1]}`,
          line: index,
          type: "todo",
          icon: "circle-large",
        });
      }
      if (match5) {
        markArr.push({
          label: `TAG ${match5[1]}`,
          line: index,
          type: "tag",
          icon: "issues",
        });
      }
      if (match6) {
        markArr.push({
          label: `DONE ${match6[1]}`,
          line: index,
          type: "done",
          icon: "pass",
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
    this.iconPath = this.getIconPath(comment.icon, comment.type);
  }

  getIconPath(icon, type) {
    let color;
    switch (type) {
      case "style":
      case "script":
      case "template":
        color = new vscode.ThemeColor("charts.yellow");
        break;
      case "tag":
        color = new vscode.ThemeColor("charts.blue");
        break;
      case "todo":
        color = new vscode.ThemeColor("charts.red");
        break;
      case "done":
        color = new vscode.ThemeColor("charts.green");
        break;
      default:
        color = new vscode.ThemeColor("charts.purple");
        break;
    }
    return new vscode.ThemeIcon(icon, color);
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
