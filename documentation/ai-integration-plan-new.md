# DB Canvas Manager: Piano di Integrazione AI

Questo documento descrive come integrare funzionalità di intelligenza artificiale nel DB Canvas Manager utilizzando l'API OpenRouterAI, permettendo agli utenti di generare schemi, ottimizzare database e creare query SQL tramite LLM (Large Language Models).

## Visione Generale

Convertire il DB Canvas Manager in uno strumento assistito da AI che può:

- Generare schemi di database da descrizioni testuali
- Suggerire ottimizzazioni per schemi esistenti
- Creare query SQL complesse da richieste in linguaggio naturale
- Generare dati di test realistici e script di migrazione

## 1. Infrastruttura Base

### 1.1 Configurare le Variabili d'Ambiente

- **Descrizione**: Impostare le variabili d'ambiente per OpenRouterAI.
- **File da Creare**:
  - `.env.example` - Template con variabili d'ambiente richieste
  - `.env` - File locale con chiavi API (ignorato da git)
- **File Influenzati**:
  - `vite.config.ts` - Per assicurare che le variabili siano disponibili

```
# .env.example
VITE_OPENROUTER_API_KEY=your_api_key_here
VITE_DEFAULT_MODEL=anthropic/claude-3-opus:beta
VITE_FAST_MODEL=anthropic/claude-3-haiku:beta
```

### 1.2 Implementare il Servizio AI

- **Descrizione**: Creare servizi per interagire con l'API OpenRouterAI.
- **File da Creare**:
  - `src/services/ai/openRouterService.ts` - Client API base
  - `src/services/ai/llmService.ts` - Funzionalità specifiche per LLM
- **File Influenzati**:
  - `package.json` - Aggiunta dipendenza axios

```typescript
// src/services/ai/openRouterService.ts
import axios from 'axios';

export class OpenRouterService {
  private apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  async generateCompletion(options: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    response_format?: { type: string };
  }) {
    try {
      const response = await axios.post(this.baseUrl, options, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  }
}

export const openRouterService = new OpenRouterService();
```

```typescript
// src/services/ai/llmService.ts
import { openRouterService } from './openRouterService';
import { Project } from '@/types/schema';

const MODELS = {
  DEFAULT: 'anthropic/claude-3-opus:beta',
  FAST: 'anthropic/claude-3-haiku:beta',
};

export class LLMService {
  async generateSchema(description: string) {
    const prompt = `Create a database schema from this description: "${description}"
    Return as JSON with tables array and connections array.`;

    const response = await openRouterService.generateCompletion({
      model: MODELS.DEFAULT,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response);
  }

  async optimizeSchema(schema: Project) {
    const prompt = `Analyze and optimize this database schema: ${JSON.stringify(schema)}
    Return recommendations and optimized schema as JSON.`;

    const response = await openRouterService.generateCompletion({
      model: MODELS.DEFAULT,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response);
  }

  async generateSQL(schema: Project, request: string) {
    const prompt = `Schema: ${JSON.stringify(schema)}
    Generate SQL for: "${request}"`;

    return await openRouterService.generateCompletion({
      model: MODELS.DEFAULT,
      messages: [{ role: 'user', content: prompt }],
    });
  }

  async generateTestData(schema: Project, rowCount: number = 10) {
    const prompt = `Generate ${rowCount} rows of test data for each table in: ${JSON.stringify(schema)}
    Return as JSON with tables object containing arrays of row objects.`;

    const response = await openRouterService.generateCompletion({
      model: MODELS.DEFAULT,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response);
  }
}

export const llmService = new LLMService();
```

### 1.3 Creare AI Context Provider

- **Descrizione**: Implementare context provider React per l'AI.
- **File da Creare**:
  - `src/contexts/AIContext.tsx` - Provider di contesto per l'AI
- **File Influenzati**:
  - `src/App.tsx` - Per integrare il provider

```typescript
// src/contexts/AIContext.tsx
import { createContext, useState, useContext, ReactNode } from 'react';
import { llmService } from '@/services/ai/llmService';
import { Project } from '@/types/schema';

interface AIContextType {
  isProcessing: boolean;
  error: string | null;
  generateSchema: (description: string) => Promise<any>;
  optimizeSchema: (schema: Project) => Promise<any>;
  generateSQL: (schema: Project, request: string) => Promise<string>;
  generateTestData: (schema: Project, rowCount?: number) => Promise<any>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSchema = async (description: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await llmService.generateSchema(description);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Implementazioni simili per optimizeSchema, generateSQL, generateTestData

  return (
    <AIContext.Provider value={{
      isProcessing,
      error,
      generateSchema,
      optimizeSchema,
      generateSQL,
      generateTestData
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) throw new Error('useAI must be used within AIProvider');
  return context;
}
```

## 2. Componenti UI per l'AI

### 2.1 Creare Componente Assistente AI

- **Descrizione**: Implementare interfaccia utente dell'assistente AI.
- **File da Creare**:
  - `src/components/AIAssistant/AIAssistantPanel.tsx` - Pannello principale
  - `src/components/AIAssistant/index.ts` - Export del componente
- **File Influenzati**:
  - `src/pages/Editor.tsx` - Per integrare il componente
  - `package.json` - Per syntax highlighting (react-syntax-highlighter)

```typescript
// src/components/AIAssistant/AIAssistantPanel.tsx
import { useState } from 'react';
import { useAI } from '@/contexts/AIContext';
import { useProject } from '@/hooks/useProject';
import { Button, Tabs, Textarea, Card, Alert } from '@/components/ui/';
import { Sparkles, Database, Code } from 'lucide-react';
import SyntaxHighlighter from 'react-syntax-highlighter';

export function AIAssistantPanel() {
  const { currentProject, updateFullProject } = useProject();
  const { isProcessing, error, generateSchema, optimizeSchema, generateSQL } = useAI();

  const [activeTab, setActiveTab] = useState('generate');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Funzione per gestire le richieste AI
  const handleSubmit = async () => {
    setResult(null);

    try {
      switch (activeTab) {
        case 'generate':
          const schema = await generateSchema(prompt);
          setResult(schema);
          break;
        // Altri casi per optimize, sql, ecc.
      }
    } catch (error) {
      console.error('AI error:', error);
    }
  };

  // Funzione per applicare lo schema generato
  const applyGeneratedSchema = () => {
    if (!result || !updateFullProject) return;

    // Conversione dal formato LLM al formato progetto
    const newProject = {
      id: crypto.randomUUID(),
      name: 'AI Generated Schema',
      tables: result.tables.map(table => ({
        id: crypto.randomUUID(),
        name: table.name,
        fields: table.fields.map(field => ({
          id: crypto.randomUUID(),
          name: field.name,
          type: field.type,
          notNull: field.notNull || false,
          primary: field.primary || false,
          unique: field.unique || false
        })),
        position: { x: Math.random() * 600, y: Math.random() * 400 }
      })),
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Aggiungere connessioni e relazioni

    updateFullProject(() => newProject);
    setPrompt('');
    setResult(null);
  };

  // UI per diverse modalità (generate, optimize, sql, test data)
  const renderContent = () => {
    switch (activeTab) {
      case 'generate':
        return (
          <>
            <Textarea
              placeholder="Describe your database schema..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            {result && (
              <Button onClick={applyGeneratedSchema}>
                Apply Generated Schema
              </Button>
            )}
          </>
        );
      // Altri casi per le diverse modalità
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Sparkles /> AI Assistant
      </Button>
    );
  }

  return (
    <Card className="fixed right-5 bottom-5 w-96 shadow-lg">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">Generate Schema</TabsTrigger>
          <TabsTrigger value="optimize">Optimize</TabsTrigger>
          <TabsTrigger value="sql">Generate SQL</TabsTrigger>
        </TabsList>

        {renderContent()}

        <Button onClick={handleSubmit} disabled={isProcessing}>
          {isProcessing ? 'Processing...' : 'Generate with AI'}
        </Button>

        <Button variant="ghost" onClick={() => setIsOpen(false)}>
          Close
        </Button>
      </Tabs>
    </Card>
  );
}
```

### 2.2 Modificare Editor.tsx per Includere l'Assistente

- **Descrizione**: Integrare l'assistente AI nell'interfaccia dell'editor.
- **File da Modificare**:
  - `src/pages/Editor.tsx`

```typescript
// Aggiungi a src/pages/Editor.tsx
import { AIAssistantPanel } from '@/components/AIAssistant';

// All'interno del componente Editor
return (
  <div className="h-screen flex flex-col">
    {/* ...contenuto esistente... */}

    {/* Aggiungi assistente AI */}
    <AIAssistantPanel />
  </div>
);
```

## 3. Funzionalità AI Specifiche

### 3.1 Generazione Schema da Descrizione

- **Descrizione**: Implementare generazione schemi DB da testo.
- **File Coinvolti**:
  - `src/services/ai/llmService.ts`
  - `src/components/AIAssistant/AIAssistantPanel.tsx`

### 3.2 Ottimizzazione Schema Esistente

- **Descrizione**: Analizzare e ottimizzare schemi DB esistenti.
- **File Coinvolti**:
  - `src/services/ai/llmService.ts`
  - `src/components/AIAssistant/AIAssistantPanel.tsx`

### 3.3 Generazione SQL da Linguaggio Naturale

- **Descrizione**: Generare query SQL da richieste testuali.
- **File Coinvolti**:
  - `src/services/ai/llmService.ts`
  - `src/components/AIAssistant/AIAssistantPanel.tsx`

### 3.4 Generazione Dati di Test

- **Descrizione**: Creare dati realistici per testing.
- **File Coinvolti**:
  - `src/services/ai/llmService.ts`
  - `src/components/AIAssistant/AIAssistantPanel.tsx`

## 4. Dipendenze e Configurazione

### 4.1 Aggiornare package.json

- **Descrizione**: Aggiungere dipendenze necessarie.
- **File da Modificare**:
  - `package.json`

```json
{
  "dependencies": {
    // ...dipendenze esistenti
    "axios": "^1.6.2",
    "react-syntax-highlighter": "^15.5.0"
  }
}
```

### 4.2 Aggiornare App.tsx

- **Descrizione**: Aggiungere AIProvider al wrapper principale.
- **File da Modificare**:
  - `src/App.tsx`

```typescript
// In src/App.tsx
import { AIProvider } from '@/contexts/AIContext';

// Aggiungere AIProvider all'albero dei componenti
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AIProvider>
          <ProjectProvider>
            {/* ...resto dell'applicazione... */}
          </ProjectProvider>
        </AIProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
```

## 5. Test e Documentazione

### 5.1 Implementare Test di Integrazione

- **Descrizione**: Testare l'integrazione AI.
- **File da Creare**:
  - `src/__tests__/ai/llmService.test.ts`
  - `src/__tests__/components/AIAssistant.test.tsx`

### 5.2 Creare Documentazione

- **Descrizione**: Documentare funzionalità AI.
- **File da Creare**:
  - `docs/ai-features.md`
