const editor = document.getElementById('editor');
const preview = document.getElementById('preview');

mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'loose',
    suppressErrorIndicators: true // Attempt to suppress internal errors
});

const initialContent = `# Advanced Study Notes 📚

## 1. Lists Test (Print Check)
* This is an unordered list item
* This should be visible in PDF
* Using \`inline code\` with blue border

## 2. Mathematical Formulas (LaTeX)
The Quadratic Formula:
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

## 3. Dynamic Mindmaps (Mermaid)
\`\`\`mermaid
mindmap
  root((Computer Science))
    Languages
      Java
      Python
      C
    Data Structures
      Arrays
      Trees
\`\`\`

## 4. Tables
| Feature | Java | Python |
| :--- | :--- | :--- |
| Typing | Static | Dynamic |

## 5. VS Code Code Blocks
\`\`\`java
public class Main {
    public static void main(String[] args) {
        System.out.println("Colors should be VS Code style!");
    }
}
\`\`\`
`;

async function render() {
    const currentScroll = preview.scrollTop;
    const md = editor.value;
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
