const editor = document.getElementById('editor');
const preview = document.getElementById('preview');

mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'loose',
    suppressErrorIndicators: true 
});

const initialContent = `# 🧪 MDPress

Welcome to the **MDPress preview**. This document have all major features.

---

## ✍️ Text Formatting

- **Bold text**
- *Italic text*
- ***Bold + Italic***
- ~~Strikethrough~~
- Inline code: \`const x = 10;\`

---

## 🔗 Links

- [OpenAI](https://openai.com)
- [Markdown Guide](https://www.markdownguide.org)

---

## 📋 Lists

### Unordered
- Item 1
- Item 2
  - Nested Item

### Ordered
1. First
2. Second
3. Third

---

## 📊 Table

| Name     | Age | Role        |
|----------|-----|------------|
| Alice    | 25  | Developer  |
| Bob      | 30  | Designer   |
| Charlie  | 28  | Manager    |

---

## 💻 Code Blocks

### JavaScript
\`\`\`javascript
function greet(name) {
  return \`Hello, \\\${name}!\`;
}
console.log(greet("MDPress"));
\`\`\`

### Python

\`\`\`python
def greet(name):
    return f"Hello, {name}!"

print(greet("MDPress"))
\`\`\`

---

## 📐 LaTeX (Math Support)

### Inline Math

Euler’s formula: $e^{i\\pi} + 1 = 0$

### Block Math

$$
\\int_{0}^{\\infty} e^{-x} dx = 1
$$

### Matrix

$$
\\begin{bmatrix}1 & 2 
\\3 & 4
\\end{bmatrix}
$$

---

## 📈 Mermaid Diagrams

### Flowchart

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great! 🎉]
    B -->|No| D[Fix it 🔧]
    D --> B
\`\`\`

### Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant User
    participant MDPress
    User->>MDPress: Load Markdown
    MDPress-->>User: Render Preview
\`\`\`

### Class Diagram

\`\`\`mermaid
classDiagram
    Animal <|-- Dog
    Animal <|-- Cat
    Animal: +name
    Animal: +eat()
    Dog: +bark()
    Cat: +meow()
\`\`\`

---

## 🧾 Blockquote

> "Markdown is not a replacement for HTML, but a complement."
>
> — Someone wise

---

## ✅ Task List

* [x] Markdown
* [x] Code blocks
* [x] Tables
* [x] LaTeX
* [x] Mermaid diagrams
* [ ] Add more features

---

## 🔥 Horizontal Rule

---

## 🧪 HTML Support

<div style="color: green; font-weight: bold;">
  This is raw HTML inside Markdown.
</div>

---`;


function preprocessLaTeX(text) {
    if (!text || typeof text !== "string") return text;

    const parts = text.split(/(```[\s\S]*?```|`[^`]*`)/g);

    return parts.map(part => {
        // Skip code blocks & inline code
        if (part.startsWith("```") || part.startsWith("`")) {
            return part;
        }

        // Process only normal text
        return part
            .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_, c) => `$$${c.trim()}$$`)
            .replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (_, c) => `$${c.trim()}$`)
            .replace(/^\[([\s\S]*?)\]$/gm, (m, c) => {
                const t = c.trim();
                const looksLikeLatex = /\\[a-zA-Z]+|[\^_{}]|=|\+|-/.test(t);
                return looksLikeLatex ? `$$${t}$$` : m;
            });

    }).join("");
}

async function render() {
    const currentScroll = preview.scrollTop;
    let md = editor.value;
    md = preprocessLaTeX(md);
    preview.innerHTML = marked.parse(md);

    renderMathInElement(preview, {
        delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
        ],
        throwOnError: false
    });

    const codeBlocks = preview.querySelectorAll('pre code');
    for (const block of codeBlocks) {
        const parent = block.parentElement;

        if (block.className.includes('language-mermaid')) {
            const content = block.innerText.trim();
            const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);

            try {
                // Check if syntax is valid before trying to render
                const isValid = await mermaid.parse(content, { suppressErrors: true });
                if (isValid) {
                    const { svg } = await mermaid.render(id, content);
                    const diagDiv = document.createElement('div');
                    diagDiv.className = 'mermaid';
                    diagDiv.innerHTML = svg;
                    parent.replaceWith(diagDiv);
                } else {
                    // If invalid, keep it as a highlighted code block
                    block.classList.add('hljs');
                    hljs.highlightElement(block);
                    addCopyButton(parent);
                }
            } catch (e) {
                // Catch-all for rendering errors
                block.classList.add('hljs');
                hljs.highlightElement(block);
                addCopyButton(parent);
            }
        } else {
            hljs.highlightElement(block);
            addCopyButton(parent);
        }
    }

    preview.scrollTop = currentScroll;
}

function addCopyButton(parent) {
    if (!parent || parent.querySelector('.copy-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.innerText = 'Copy';
    btn.onclick = () => {
        const code = parent.querySelector('code');
        if (!code) return;
        navigator.clipboard.writeText(code.innerText);
        btn.innerText = 'Done!';
        setTimeout(() => btn.innerText = 'Copy', 1500);
    };
    parent.appendChild(btn);
}

function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
}

function downloadMD() {
    const blob = new Blob([editor.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'notes.md'; a.click();
}

let debounceTimer;
editor.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(render, 300);
});

editor.value = initialContent;
render();