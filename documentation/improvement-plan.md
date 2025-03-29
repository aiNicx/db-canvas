# DB-Canvas-Manager: Piano di Miglioramento Progressivo

## Piano 1: Miglioramento della Gestione dello Stato

Focus: stabilità, immutabilità e validazione dati

### 1. Implementare Immer per Immutabilità

- [x] Aggiungere Immer a `package.json` come dipendenza
  ```bash
  npm install immer
  ```
- [x] Refactoring di `src/hooks/useTables.ts` per utilizzare Immer

  ```typescript
  import produce from 'immer';

  // Sostituire questo blocco (circa linea 70)
  updateProject((prevProject) => {
    if (!prevProject) return project!;
    const updatedTables = [...prevProject.tables, newTable];
    setTables(updatedTables);
    return {
      ...prevProject,
      tables: updatedTables,
      updatedAt: new Date().toISOString(),
    };
  });

  // Con questo:
  updateProject(
    produce((draft) => {
      draft.tables.push(newTable);
      draft.updatedAt = new Date().toISOString();
      setTables(draft.tables); // Mantenere state locale sincronizzato
    })
  );
  ```

- [x] Refactoring di `src/hooks/useConnections.ts` con stesso pattern Immer
- [x] Aggiornare `src/contexts/NewProjectContext.tsx` per gestire progetti con Immer

### 2. Sistema di Validazione Centrale

- [x] Creare `src/utils/validation.ts` per funzioni di validazione

  ```typescript
  // validation.ts
  import { TableNode, Field, Connection } from '@/types/schema';

  export interface ValidationResult {
    valid: boolean;
    errors: string[];
  }

  export const validateTable = (table: TableNode): ValidationResult => {
    const errors: string[] = [];

    if (!table.name.trim()) {
      errors.push('Table name is required');
    }

    // Altre validazioni...

    return { valid: errors.length === 0, errors };
  };

  export const validateField = (field: Field): ValidationResult => {
    // Implementazione validazione campi
  };

  export const validateConnection = (conn: Connection, tables: TableNode[]): ValidationResult => {
    // Implementazione validazione connessioni
  };
  ```

- [x] Integrare con `src/hooks/useTables.ts` (metodi addTable e updateTable)
- [x] Integrare con `src/hooks/useConnections.ts` (metodi addConnection e updateConnection)
- [] Aggiungere validazione in `src/pages/TableEditorPage.tsx` (metodo handleSubmit)

### 3. Migliorare la Gestione degli Errori

- [x] Creare `src/utils/errorHandling.ts` per gestione centralizzata

  ```typescript
  // errorHandling.ts
  import { toast } from 'sonner';

  interface ErrorOptions {
    silent?: boolean;
    fallback?: any;
    context?: string;
  }

  export const handleError = (error: unknown, message: string, options: ErrorOptions = {}) => {
    const { silent = false, fallback = null, context = '' } = options;

    console.error(`Error in ${context}:`, error);

    if (!silent) {
      toast.error(message);
    }

    return fallback;
  };
  ```

- [x] Implementare in `src/hooks/useTables.ts`
- [x] Aggiungere gestione errori in `src/components/DBCanvas.tsx` (onConnect, onNodeDragStop)

## Piano 2: Ottimizzazioni di Performance

Focus: reattività e gestione efficiente di dataset grandi

### 1. Memoization per Componenti Pesanti

- [x] Ottimizzare `src/components/TableNodeComponent.tsx` con memo più efficiente

  ```typescript
  export const TableNodeComponent = memo(
    (props: ExtendedTableNodeProps) => {
      // Implementazione
    },
    (prevProps, nextProps) => {
      // Controllo personalizzato per re-rendering
      return (
        prevProps.data.name === nextProps.data.name &&
        prevProps.data.color === nextProps.data.color &&
        prevProps.selected === nextProps.selected &&
        areFieldsEqual(prevProps.data.fields, nextProps.data.fields)
      );
    }
  );

  // Funzione helper per confronto profondo
  const areFieldsEqual = (prev: Field[], next: Field[]): boolean => {
    if (prev.length !== next.length) return false;
    return prev.every(
      (field, index) =>
        field.id === next[index].id &&
        field.name === next[index].name &&
        field.type === next[index].type
      // Altri confronti se necessari
    );
  };
  ```

- [x] Implementare `useMemo` in `src/components/FieldEditorTable.tsx`
  ```typescript
  // Per ottimizzare il rendering dei campi
  const memoizedFields = useMemo(() => (
    fields.map((field, index) => (
      <SortableTableRow
        key={field.id}
        field={field}
        index={index}
        handleFieldChange={handleFieldChange}
        handleRemoveField={handleRemoveField}
        fields={fields}
        isDragging={activeId === field.id}
        isOver={overId === field.id && activeId !== field.id}
        availableTables={availableTables}
        handleSetForeignKey={handleSetForeignKey}
        handleRemoveForeignKey={handleRemoveForeignKey}
      />
    ))
  ), [fields, activeId, overId, availableTables]);
  ```
- [] Ottimizzare `src/components/DBCanvas.tsx` con memoization migliorata

### 2. Virtualizzazione per Liste Lunghe

- [] Aggiungere `react-window` a `package.json`
  ```bash
  npm install react-window
  ```
- [] Implementare virtualizzazione in `src/components/Sidebar.tsx`

  ```typescript
  // Importare react-window
  import { FixedSizeList as List } from 'react-window';

  // Sostituire la lista statica con lista virtualizzata
  const TablesList = ({ tables, selectedTable, onTableClick }) => {
    const Row = ({ index, style }) => {
      const table = tables[index];
      return (
        <div
          style={style}
          data-table-id={table.id}
          className={`p-2 rounded-md cursor-pointer ${
            selectedTable?.id === table.id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
          }`}
          onClick={() => onTableClick(table)}
        >
          {/* Contenuto della riga */}
        </div>
      );
    };

    return (
      <List
        height={300}
        width="100%"
        itemCount={tables.length}
        itemSize={40}
      >
        {Row}
      </List>
    );
  };
  ```

- [] Implementare virtualizzazione per campi in `src/components/FieldEditorTable.tsx`

### 3. Code Splitting e Lazy Loading

- [] Configurare code splitting in `src/App.tsx`

  ```typescript
  import { lazy, Suspense } from 'react';

  // Sostituire import statici con lazy loading
  const Dashboard = lazy(() => import('./pages/Dashboard'));
  const Editor = lazy(() => import('./pages/Editor'));
  const TableEditorPage = lazy(() => import('./pages/TableEditorPage'));

  // Aggiungere Suspense al Router
  <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/project/:id" element={<Editor />} />
      {/* Altri routes */}
    </Routes>
  </Suspense>
  ```

- [] Ottimizzare `vite.config.ts` per build più efficienti
  ```typescript
  export default defineConfig({
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@radix-ui/react-dropdown-menu', '@radix-ui/react-dialog'],
            reactflow: ['reactflow'],
          },
        },
      },
    },
  });
  ```

## Piano 3: Pulizia e Consistenza del Codice

Focus: manutenibilità e standardizzazione

### 1. Tipizzazione TypeScript più Rigorosa

- [x] Aggiornare `tsconfig.json` con regole più stringenti
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "noUncheckedIndexedAccess": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true
    }
  }
  ```
- [] Rifattorizzare `src/hooks/useProject.ts` per conformità di tipo
  ```typescript
  export const useProject = (): ProjectContextType => {
    const context = useContext(ProjectContext);
    if (!context) {
      throw new Error('useProject must be used within ProjectProvider');
    }
    return context;
  };
  ```
- [x] Migliorare tipi in `src/types/schema.ts` con generici e literal types
- [] Risolvere tutti gli errori di tipo in `src/hooks/useTables.ts` e `useConnections.ts`

### 2. Standardizzazione degli Stili

- [x] Aggiornare `eslint.config.js` con regole più stringenti
  ```javascript
  export default tseslint.config(
    { ignores: ['dist'] },
    {
      extends: [js.configs.recommended, ...tseslint.configs.recommended],
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
      },
      plugins: {
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
      },
      rules: {
        ...reactHooks.configs.recommended.rules,
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/explicit-function-return-type': 'error',
        'react-hooks/exhaustive-deps': 'error',
      },
    }
  );
  ```
- [x] Creare `.prettierrc` con regole di formattazione
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "printWidth": 100,
    "trailingComma": "es5"
  }
  ```
- [x] Eseguire formattazione automatica su tutti i file

### 3. Documentazione e Pulizia

- [] Aggiungere JSDoc ai file principali
  ```typescript
  /**
   * Hook per la gestione delle tabelle nel progetto corrente.
   *
   * @param project - Il progetto corrente
   * @param updateProject - Funzione per aggiornare il progetto
   * @returns API per manipolare le tabelle
   */
  export const useTables = (
    project: Project | null,
    updateProject: (updater: (prevProject: Project | null) => Project) => void
  ) => {
    // ...implementazione
  };
  ```
- [x] Creare `docs/ARCHITECTURE.md` con la struttura del progetto
- [x] Rimuovere i file obsoleti/inutilizzati:
  - [x] `src/pages/Index.tsx` (fallback inutilizzato)
  - [x] `src/components/ui/use-toast.ts` (sostituito da Sonner)
- [] Consolidare stili duplicati in `src/index.css`

### 4. Refactoring di Componenti

- [] Separare `src/components/DBCanvas.tsx` in sottocomponenti più piccoli
  - [] Estrarre `CanvasControls` come componente separato
  - [] Estrarre `CanvasGrid` come componente separato
- [] Refactoring di `src/components/FieldEditorTable.tsx` per separare presentazione e logica
- [] Migliorare la struttura di `src/components/Sidebar.tsx` per ridurre la complessità

Ogni fase costruisce sulle fondamenta delle precedenti, garantendo una migrazione graduale e sicura verso una codebase più robusta, performante e manutenibile.
