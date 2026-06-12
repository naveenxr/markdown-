import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, FolderOpen, FileText, Search, Menu, X, 
  Download, Copy, Moon, Sun, Bold, Italic, Code, Link, 
  Image, Quote, Heading1, Heading2, Heading3, List, 
  ListOrdered, CheckSquare, Grid, Eye, BookOpen, 
  Trash, Save, ClipboardCheck, Sparkles, FileDown, Check,
  ChevronLeft, FileCode
} from 'lucide-react';
import { marked } from 'marked';
import './App.css';

// Default document to populate when user opens the app for the first time
const WELCOME_DOCUMENT = {
  id: 'welcome-doc-123456',
  title: 'Welcome to AetherMark.md',
  content: `# 🌌 Welcome to AetherMark!

AetherMark is a next-generation, premium **Markdown Editor & Live Previewer** designed for writers, developers, and creators. It combines rich typography, smooth animations, and a glassmorphism interface to create the ultimate distraction-free workspace.

---

## 🚀 Get Started

1. **Write Markdown** in the editor pane on the left.
2. **See Live Updates** immediately rendered on the right.
3. **Use the Formatting Toolbar** above to quickly insert markdown tags.
4. **Manage Documents** in the collapsible sidebar on the left.
5. **View Markdown Cheatsheet** by clicking the **Cheatsheet** button in the header.

---

## 🎨 Markdown Elements Demo

### Headers & Formatting
You can create headers using \`#\` symbols:
# Heading 1
## Heading 2
### Heading 3

Make text **bold** with double asterisks, *italicized* with single asterisks, or ~~strikethrough~~ with double tildes. Highlight key phrases like \`this inline code\`.

### Blockquotes
> "Logic will get you from A to B. Imagination will take you everywhere." 
> — *Albert Einstein*

### Lists
- Bullet list item 1
- Bullet list item 2
  - Nested list item
- Bullet list item 3

1. Numbered list item 1
2. Numbered list item 2
3. Numbered list item 3

### Checklist
- [x] Create a premium markdown editor
- [x] Design a stunning glassmorphism theme
- [ ] Write a novel in Markdown
- [ ] Export files to PDF or HTML

### Tables

| Syntax | Description | Performance |
| :--- | :--- | :---: |
| **AetherMark** | Glassmorphism | Fast |
| **Vanilla CSS** | Fully Responsive | Instant |
| **Marked.js** | GFM Compliant | Robust |

### Code Block
\`\`\`javascript
// AetherMark Word Counter Function
const getWordCount = (text) => {
  if (!text.trim()) return 0;
  return text.trim().split(/\\s+/).length;
};
console.log(\`Word count: \${getWordCount("Hello World!")}\`);
\`\`\`

---

*Enjoy writing with AetherMark!*
`,
  lastModified: new Date().toISOString()
};

// Markdown cheatsheet card definitions
const CHEATSHEET_CARDS = [
  { label: 'Heading 1', syntax: '# Title', value: '# Heading 1\n' },
  { label: 'Heading 2', syntax: '## Subtitle', value: '## Heading 2\n' },
  { label: 'Heading 3', syntax: '### Header 3', value: '### Heading 3\n' },
  { label: 'Bold Text', syntax: '**text**', value: '**bold text**' },
  { label: 'Italic Text', syntax: '*text*', value: '*italic text*' },
  { label: 'Link', syntax: '[label](url)', value: '[Link Title](https://example.com)' },
  { label: 'Image', syntax: '![alt](url)', value: '![AetherMark logo](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80)' },
  { label: 'Blockquote', syntax: '> quote text', value: '> "Knowledge is power."\n' },
  { label: 'Code Block', syntax: '```lang\\ncode\\n```', value: '```javascript\nconst hello = "world";\nconsole.log(hello);\n```\n' },
  { label: 'Inline Code', syntax: '`code`', value: '`const app = true;`' },
  { label: 'Bullet List', syntax: '- Item', value: '- List item 1\n- List item 2\n' },
  { label: 'Numbered List', syntax: '1. Item', value: '1. First item\n2. Second item\n' },
  { label: 'Checklist', syntax: '- [ ] Item', value: '- [ ] Uncompleted task\n- [x] Completed task\n' },
  { label: 'Table', syntax: '| cell | cell |', value: '| Header 1 | Header 2 |\n| --- | --- |\n| Content 1 | Content 2 |\n' },
  { label: 'Horizontal Rule', syntax: '---', value: '\n---\n' }
];

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
  silent: true
});

function App() {
  // --- States ---
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('aethermark_docs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed parsing saved documents, using default.', e);
      }
    }
    return [WELCOME_DOCUMENT];
  });

  const [activeId, setActiveId] = useState(() => {
    const savedActive = localStorage.getItem('aethermark_active_id');
    if (savedActive) {
      return savedActive;
    }
    return WELCOME_DOCUMENT.id;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCheatsheetOpen, setIsCheatsheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'editor' | 'preview'
  const [isSaving, setIsSaving] = useState(false);
  const [copiedHTML, setCopiedHTML] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aethermark_theme') || 'dark';
  });

  // --- Refs ---
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const fileInputRef = useRef(null);

  // Active document object helper
  const activeDoc = documents.find(doc => doc.id === activeId) || documents[0] || null;

  // --- Side Effects ---
  // Theme management
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
    localStorage.setItem('aethermark_theme', theme);
  }, [theme]);

  // Sync documents to LocalStorage
  useEffect(() => {
    localStorage.setItem('aethermark_docs', JSON.stringify(documents));
  }, [documents]);

  // Sync active ID to LocalStorage
  useEffect(() => {
    if (activeId) {
      localStorage.setItem('aethermark_active_id', activeId);
    }
  }, [activeId]);

  // Gutter scroll sync
  const handleEditorScroll = (e) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.target.scrollTop;
    }
  };

  // --- Document Logic ---
  const handleContentChange = (newContent) => {
    if (!activeDoc) return;
    
    // Show quick autosaving flash
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 500);

    setDocuments(prev => prev.map(doc => {
      if (doc.id === activeDoc.id) {
        return {
          ...doc,
          content: newContent,
          lastModified: new Date().toISOString()
        };
      }
      return doc;
    }));
  };

  const handleTitleChange = (newTitle) => {
    if (!activeDoc) return;
    setDocuments(prev => prev.map(doc => {
      if (doc.id === activeDoc.id) {
        return {
          ...doc,
          title: newTitle,
          lastModified: new Date().toISOString()
        };
      }
      return doc;
    }));
  };

  const handleCreateDocument = () => {
    const newId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const newDoc = {
      id: newId,
      title: 'Untitled Document.md',
      content: '# Untitled Document\n\nWrite something amazing here...',
      lastModified: new Date().toISOString()
    };
    
    setDocuments(prev => [newDoc, ...prev]);
    setActiveId(newId);
    
    // Refocus onto textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  const handleDeleteDocument = (idToDelete, e) => {
    e.stopPropagation();
    
    if (documents.length <= 1) {
      alert('You must have at least one document. Create a new one before deleting this.');
      return;
    }

    const confirmDelete = window.confirm('Are you sure you want to delete this document? This cannot be undone.');
    if (!confirmDelete) return;

    const remainingDocs = documents.filter(doc => doc.id !== idToDelete);
    setDocuments(remainingDocs);

    // If active document is deleted, switch to the first remaining one
    if (activeId === idToDelete) {
      setActiveId(remainingDocs[0].id);
    }
  };

  const handleClearAllData = () => {
    const confirmClear = window.confirm('WARNING: This will delete ALL documents and restore the default state. Are you sure?');
    if (!confirmClear) return;
    
    localStorage.removeItem('aethermark_docs');
    localStorage.removeItem('aethermark_active_id');
    setDocuments([WELCOME_DOCUMENT]);
    setActiveId(WELCOME_DOCUMENT.id);
  };

  // --- Markdown Formatting Helpers ---
  const insertMarkdown = (syntaxType) => {
    const textarea = textareaRef.current;
    if (!textarea || !activeDoc) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (syntaxType) {
      case 'bold':
        replacement = `**${selected || 'bold text'}**`;
        cursorOffset = selected ? 0 : 2;
        break;
      case 'italic':
        replacement = `*${selected || 'italic text'}*`;
        cursorOffset = selected ? 0 : 1;
        break;
      case 'code':
        replacement = `\`${selected || 'code'}\``;
        cursorOffset = selected ? 0 : 1;
        break;
      case 'heading1':
        replacement = `\n# ${selected || 'Heading 1'}\n`;
        cursorOffset = selected ? 0 : 1;
        break;
      case 'heading2':
        replacement = `\n## ${selected || 'Heading 2'}\n`;
        cursorOffset = selected ? 0 : 1;
        break;
      case 'heading3':
        replacement = `\n### ${selected || 'Heading 3'}\n`;
        cursorOffset = selected ? 0 : 1;
        break;
      case 'link':
        replacement = `[${selected || 'Link Title'}](https://example.com)`;
        cursorOffset = selected ? 0 : 21; // position cursor on URL
        break;
      case 'image':
        replacement = `![${selected || 'Image Description'}](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400)`;
        cursorOffset = selected ? 0 : 43;
        break;
      case 'quote':
        replacement = `\n> ${selected || 'Blockquote'}\n`;
        cursorOffset = selected ? 0 : 1;
        break;
      case 'bullet':
        replacement = `\n- ${selected || 'List item'}\n`;
        cursorOffset = selected ? 0 : 1;
        break;
      case 'number':
        replacement = `\n1. ${selected || 'List item'}\n`;
        cursorOffset = selected ? 0 : 1;
        break;
      case 'checklist':
        replacement = `\n- [ ] ${selected || 'Task item'}\n`;
        cursorOffset = selected ? 0 : 1;
        break;
      case 'codeblock':
        replacement = `\n\`\`\`javascript\n${selected || '// code goes here'}\n\`\`\`\n`;
        cursorOffset = selected ? 0 : 5;
        break;
      case 'table':
        replacement = `\n| Header 1 | Header 2 |\n| :--- | :--- |\n| ${selected || 'Content 1'} | Content 2 |\n`;
        cursorOffset = 0;
        break;
      case 'hr':
        replacement = `\n---\n`;
        cursorOffset = 0;
        break;
      default:
        break;
    }

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    handleContentChange(newContent);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      if (!selected && cursorOffset > 0) {
        textarea.setSelectionRange(
          start + replacement.length - cursorOffset,
          start + replacement.length - cursorOffset
        );
      } else {
        textarea.setSelectionRange(start, start + replacement.length);
      }
    }, 50);
  };

  // Tab indent behavior handler
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      const newContent = text.substring(0, start) + '  ' + text.substring(end);
      handleContentChange(newContent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, start + 2);
      }, 50);
    }
  };

  // --- Import / Export Handlers ---
  const handleExportMarkdown = () => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', activeDoc.title.endsWith('.md') ? activeDoc.title : `${activeDoc.title}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportHTML = () => {
    if (!activeDoc) return;
    const compiledHTML = marked.parse(activeDoc.content);
    const htmlPageContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${activeDoc.title.replace('.md', '')}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css">
  <style>
    body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
    }
    @media (max-width: 767px) {
      body {
        padding: 15px;
      }
    }
  </style>
</head>
<body class="markdown-body">
  ${compiledHTML}
</body>
</html>`;

    const blob = new Blob([htmlPageContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeDoc.title.replace('.md', '')}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyHTML = () => {
    if (!activeDoc) return;
    const compiledHTML = marked.parse(activeDoc.content);
    navigator.clipboard.writeText(compiledHTML).then(() => {
      setCopiedHTML(true);
      setTimeout(() => setCopiedHTML(false), 2000);
    });
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportMarkdown = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const newId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const newDoc = {
        id: newId,
        title: file.name.endsWith('.md') ? file.name : `${file.name}.md`,
        content: content,
        lastModified: new Date().toISOString()
      };

      setDocuments(prev => [newDoc, ...prev]);
      setActiveId(newId);
    };
    reader.readAsText(file);
    // Reset file input value so same file can be uploaded again
    e.target.value = null;
  };

  // --- Statistics Helpers ---
  const getStats = () => {
    const text = activeDoc ? activeDoc.content : '';
    const charCount = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    const lines = text.split('\n').length;
    return { charCount, wordCount, readTime, lines };
  };

  const stats = getStats();

  // Line numbers sequence generator
  const getLineNumbers = () => {
    const lineCount = stats.lines || 1;
    return Array.from({ length: lineCount }, (_, i) => i + 1);
  };

  // Filtering documents based on search
  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Parse HTML for markdown output dangerously
  const getParsedHTML = () => {
    if (!activeDoc) return '';
    return { __html: marked.parse(activeDoc.content) };
  };

  const formatDate = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-container">
      {/* Hidden file input for import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportMarkdown} 
        accept=".md,.txt" 
        style={{ display: 'none' }} 
      />

      {/* Sidebar Document Manager */}
      <aside className={`sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <Sparkles className="logo-icon" size={20} />
            <span className="logo-text">AetherMark</span>
          </div>
          <button 
            className="sidebar-trigger" 
            onClick={() => setIsSidebarOpen(false)}
            title="Collapse Sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <button className="new-doc-btn" onClick={handleCreateDocument}>
          <Plus size={16} /> New Document
        </button>

        <div className="search-container">
          <Search className="search-icon" size={14} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="doc-list">
          {filteredDocs.map((doc) => (
            <div 
              key={doc.id}
              className={`doc-item ${doc.id === activeId ? 'active' : ''}`}
              onClick={() => {
                setActiveId(doc.id);
                // On mobile, collapse sidebar when document is selected
                if (window.innerWidth <= 768) {
                  setIsSidebarOpen(false);
                }
              }}
            >
              <div className="doc-info">
                <div className="doc-title-row">
                  <FileText size={14} className="doc-icon" />
                  <span className="doc-title">{doc.title}</span>
                </div>
                <div className="doc-meta">
                  <span>{formatDate(doc.lastModified)}</span>
                </div>
                <span className="doc-snippet">
                  {doc.content.replace(/[#*`>_\-]/g, '').substring(0, 40) || 'Empty document'}
                </span>
              </div>
              <div className="doc-actions">
                <button 
                  className="doc-action-btn"
                  onClick={(e) => handleDeleteDocument(doc.id, e)}
                  title="Delete Document"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {filteredDocs.length === 0 && (
            <div className="empty-state">
              <p>No documents found</p>
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <button 
            className="theme-toggle-btn" 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button 
            className="clear-data-btn"
            onClick={handleClearAllData}
            title="Reset Application State"
          >
            <Trash size={14} />
            <span>Reset All</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="workspace">
        {/* Navbar */}
        <header className="navbar">
          <div className="navbar-left">
            {!isSidebarOpen && (
              <button 
                className="sidebar-trigger" 
                onClick={() => setIsSidebarOpen(true)}
                title="Expand Sidebar"
              >
                <Menu size={18} />
              </button>
            )}
            
            {activeDoc ? (
              <div className="title-input-container">
                <input 
                  type="text" 
                  className="title-input" 
                  value={activeDoc.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  title="Click to rename document"
                />
                <span className="save-badge">
                  {isSaving ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="saving-dot"></div>
                      <span>Saving...</span>
                    </div>
                  ) : 'Auto-saved'}
                </span>
              </div>
            ) : (
              <span className="logo-text">AetherMark</span>
            )}
          </div>

          <div className="navbar-right">
            {activeDoc && (
              <>
                <button className="nav-btn" onClick={triggerFileInput} title="Upload Markdown file">
                  <FolderOpen size={14} />
                  <span>Import</span>
                </button>
                <button className="nav-btn" onClick={handleExportMarkdown} title="Download Markdown file">
                  <Download size={14} />
                  <span>Export MD</span>
                </button>
                <button className="nav-btn" onClick={handleExportHTML} title="Download standard styled HTML page">
                  <FileDown size={14} />
                  <span>Export HTML</span>
                </button>
                <button 
                  className={`nav-btn ${copiedHTML ? 'success' : ''}`} 
                  onClick={handleCopyHTML} 
                  title="Copy parsed HTML string to clipboard"
                >
                  {copiedHTML ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedHTML ? 'Copied!' : 'Copy HTML'}</span>
                </button>
              </>
            )}

            <div className="view-toggle-group">
              <button 
                className={`view-toggle-btn ${viewMode === 'editor' ? 'active' : ''}`}
                onClick={() => setViewMode('editor')}
                title="Editor Mode"
              >
                <FileCode size={14} />
                <span>Editor</span>
              </button>
              <button 
                className={`view-toggle-btn ${viewMode === 'split' ? 'active' : ''}`}
                onClick={() => setViewMode('split')}
                title="Split View"
              >
                <Grid size={14} />
                <span>Split</span>
              </button>
              <button 
                className={`view-toggle-btn ${viewMode === 'preview' ? 'active' : ''}`}
                onClick={() => setViewMode('preview')}
                title="Preview Mode"
              >
                <Eye size={14} />
                <span>Preview</span>
              </button>
            </div>

            <button 
              className={`nav-btn primary ${isCheatsheetOpen ? 'active' : ''}`}
              onClick={() => setIsCheatsheetOpen(prev => !prev)}
            >
              <BookOpen size={14} />
              <span>Cheatsheet</span>
            </button>
          </div>
        </header>

        {/* Toolbar */}
        {activeDoc && viewMode !== 'preview' && (
          <div className="toolbar">
            <div className="toolbar-group">
              <button className="toolbar-btn" onClick={() => insertMarkdown('heading1')} data-tooltip="H1 Header">
                <Heading1 size={14} />
              </button>
              <button className="toolbar-btn" onClick={() => insertMarkdown('heading2')} data-tooltip="H2 Header">
                <Heading2 size={14} />
              </button>
              <button className="toolbar-btn" onClick={() => insertMarkdown('heading3')} data-tooltip="H3 Header">
                <Heading3 size={14} />
              </button>
            </div>

            <div className="toolbar-group">
              <button className="toolbar-btn" onClick={() => insertMarkdown('bold')} data-tooltip="Bold Text (Ctrl+B)">
                <Bold size={14} />
              </button>
              <button className="toolbar-btn" onClick={() => insertMarkdown('italic')} data-tooltip="Italic Text (Ctrl+I)">
                <Italic size={14} />
              </button>
              <button className="toolbar-btn" onClick={() => insertMarkdown('code')} data-tooltip="Inline Code">
                <Code size={14} />
              </button>
            </div>

            <div className="toolbar-group">
              <button className="toolbar-btn" onClick={() => insertMarkdown('link')} data-tooltip="Hyperlink">
                <Link size={14} />
              </button>
              <button className="toolbar-btn" onClick={() => insertMarkdown('image')} data-tooltip="Insert Image">
                <Image size={14} />
              </button>
              <button className="toolbar-btn" onClick={() => insertMarkdown('quote')} data-tooltip="Blockquote">
                <Quote size={14} />
              </button>
            </div>

            <div className="toolbar-group">
              <button className="toolbar-btn" onClick={() => insertMarkdown('bullet')} data-tooltip="Bullet List">
                <List size={14} />
              </button>
              <button className="toolbar-btn" onClick={() => insertMarkdown('number')} data-tooltip="Numbered List">
                <ListOrdered size={14} />
              </button>
              <button className="toolbar-btn" onClick={() => insertMarkdown('checklist')} data-tooltip="Task Checklist">
                <CheckSquare size={14} />
              </button>
            </div>

            <div className="toolbar-group">
              <button className="toolbar-btn" onClick={() => insertMarkdown('codeblock')} data-tooltip="Code Block">
                <FileCode size={14} />
              </button>
              <button className="toolbar-btn" onClick={() => insertMarkdown('table')} data-tooltip="Insert Table">
                <Grid size={14} />
              </button>
              <button className="toolbar-btn" onClick={() => insertMarkdown('hr')} data-tooltip="Horizontal Line">
                <span>---</span>
              </button>
            </div>
          </div>
        )}

        {/* Panes Workspace */}
        {activeDoc ? (
          <div className="pane-container">
            {/* Editor Pane */}
            <div className={`pane ${viewMode === 'preview' ? 'hidden' : ''}`}>
              <div className="editor-wrapper">
                <div className="line-numbers" ref={gutterRef}>
                  {getLineNumbers().map(num => (
                    <div key={num}>{num}</div>
                  ))}
                </div>
                <textarea
                  ref={textareaRef}
                  className="editor-textarea"
                  value={activeDoc.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onScroll={handleEditorScroll}
                  onKeyDown={handleKeyDown}
                  placeholder="Start writing markdown..."
                  autoFocus
                />
              </div>
            </div>

            {/* Preview Pane */}
            <div 
              className={`pane preview-pane ${viewMode === 'editor' ? 'hidden' : ''}`}
            >
              <div 
                className="markdown-body"
                dangerouslySetInnerHTML={getParsedHTML()}
              />
            </div>

            {/* Markdown Cheatsheet Drawer */}
            <div className={`cheatsheet-drawer ${isCheatsheetOpen ? 'open' : ''}`}>
              <div className="cheatsheet-header">
                <h3><Sparkles size={16} /> Quick Cheat Sheet</h3>
                <button 
                  className="sidebar-trigger" 
                  onClick={() => setIsCheatsheetOpen(false)}
                  title="Close Cheatsheet"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="cheatsheet-body">
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Click any card to inject syntax at your cursor location.
                </p>
                {CHEATSHEET_CARDS.map((card, idx) => (
                  <div 
                    key={idx} 
                    className="cheatsheet-card"
                    onClick={() => insertMarkdown(card.label.toLowerCase().replace(' ', ''))}
                  >
                    <div className="cheatsheet-label">{card.label}</div>
                    <div className="cheatsheet-syntax">{card.syntax}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ flexGrow: 1 }}>
            <FileText size={48} className="logo-icon" />
            <h2>No Document Selected</h2>
            <p>Select an existing document from the sidebar or create a new one to begin editing.</p>
            <button className="new-doc-btn" onClick={handleCreateDocument} style={{ margin: '0' }}>
              <Plus size={16} /> Create Document
            </button>
          </div>
        )}

        {/* Status Bar */}
        <footer className="status-bar">
          <div className="status-left">
            {activeDoc && (
              <>
                <span>Lines: <strong>{stats.lines}</strong></span>
                <span>Words: <strong>{stats.wordCount}</strong></span>
                <span>Characters: <strong>{stats.charCount}</strong></span>
              </>
            )}
          </div>
          <div className="status-right">
            {activeDoc && (
              <span>Reading time: <strong>~{stats.readTime} min</strong></span>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
