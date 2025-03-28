# Complete Directory Structure

```
.
├── .gitignore
├── bun.lockb
├── components.json
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── documentation/
│   └── directory_structure.md
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
└── src/
    ├── App.css
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── vite-env.d.ts
    ├── components/
    │   ├── AddTableDialog.tsx
    │   ├── DBCanvas.tsx
    │   ├── EditTableDialog.tsx
    │   ├── Sidebar.tsx
    │   ├── TableNodeComponent.tsx
    │   ├── ThemeToggle.tsx
    │   └── ui/ [all UI components]
    ├── contexts/
    │   ├── NewProjectContext.tsx
    │   └── ThemeContext.tsx
    ├── hooks/
    │   ├── use-mobile.tsx
    │   ├── use-toast.ts
    │   ├── useConnections.ts
    │   └── useTables.ts
    ├── lib/
    │   └── utils.ts
    ├── pages/
    │   ├── Dashboard.tsx
    │   ├── Editor.tsx
    │   ├── Index.tsx
    │   └── NotFound.tsx
    └── types/
        └── schema.ts