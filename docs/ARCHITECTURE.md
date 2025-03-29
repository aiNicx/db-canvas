# DB-Canvas Architecture Overview

## Core Components

### 1. State Management

- **Project Context**: Manages the global state of projects and current project
- **Immer Integration**: Ensures immutable state updates
- **Validation System**: Centralized validation for tables, fields and connections

### 2. UI Components

- **DBCanvas**: Main canvas component with ReactFlow integration
- **TableNode**: Visual representation of database tables
- **FieldEditor**: Table field editing interface
- **Sidebar**: Project navigation and table list

### 3. Hooks

- **useTables**: Manages table operations
- **useConnections**: Handles relationships between tables
- **useProject**: Provides access to project context

### 4. Utilities

- **Validation**: Centralized validation logic
- **Error Handling**: Consistent error reporting
- **Type Definitions**: Comprehensive TypeScript types

## Data Flow

1. User interactions trigger state updates
2. Changes are validated and applied via Immer
3. UI components react to state changes
4. Changes are persisted to localStorage

## Tech Stack

- React 18 with TypeScript
- ReactFlow for diagram visualization
- Tailwind CSS for styling
- Vite for build tooling
- Immer for immutable state
- React DnD for drag and drop
