# Table Management Enhancement Plan

## Goals
1. Unify UI for adding/editing table fields
2. Allow explicit foreign key management in dialogs
3. Support default values and field reordering
4. Enhance data type specificity
5. Ensure consistency between canvas interactions and dialog edits

## Implementation Details

### 1. Data Structure Updates (`src/types/schema.ts`)
- Add `defaultValue?: string | number | boolean | null` to `Field` interface
- Review `foreignKey` structure
- Modify data types handling to support more specific types (e.g., `VARCHAR(n)`)

### 2. New FieldEditorTable Component (`src/components/FieldEditorTable.tsx`)
- Table-based layout for field editing
- Features:
  - Inputs for name, type, constraints
  - Default value input
  - Foreign key management UI
  - Drag-and-drop reordering
  - Add/remove field buttons

### 3. Dialog Refactoring
- **AddTableDialog.tsx**:
  - Replace current field UI with FieldEditorTable
  - Update submit handler for new data structure
- **EditTableDialog.tsx**:
  - Replace table implementation with FieldEditorTable
  - Ensure proper initialization of field data

### 4. Canvas Interaction Updates (`DBCanvas.tsx`)
- Keep current connection creation flow
- Modify connection deletion to preserve FK markers
- Ensure proper state updates

### 5. Hook Updates
- Update `useTables` and `useConnections` to handle:
  - Default values
  - Field reordering
  - Explicit FK management
  - Connection deletion behavior

## Flow Diagram
```mermaid
graph TD
    subgraph "User Interaction"
        A[Opens Add/Edit Dialog] --> B{Dialog Component};
    end

    subgraph "Dialog Component (Add/Edit)"
        B --> C[Renders Table Name Input];
        B --> D[Renders Table Color Picker (Edit Only)];
        B --> E[Renders FieldEditorTable];
    end

    subgraph "FieldEditorTable Component"
        E --> F[Displays Fields in Table];
        F --> G{User Edits Field (Name, Type, PK, Unique, NN, Default, FK)};
        F --> H[User Adds/Removes Field];
        F --> I[User Reorders Fields];
        G --> E; H --> E; I --> E;
    end

    subgraph "Data Handling (Hooks)"
        B -- On Save --> J[Calls tablesApi.addTable / updateTable];
        J --> K[Updates Project State via useProject];
        K --> L[Triggers Re-render of DBCanvas];
    end

    subgraph "Canvas Interaction (Connections)"
        M[User Draws Connection] --> N[DBCanvas onConnect];
        N --> O[Calls connectionsApi.addConnection];
        N --> P[Calls tablesApi.updateTable (Sets initial FK)];
        Q[User Deletes Connection] --> R[DBCanvas handleEdgesChange];
        R --> S[Calls connectionsApi.deleteConnection];
        S --> K; O --> K; P --> K;
        R --- T(FK marker on field is NOT removed by edge deletion);
    end
```

## Next Steps
1. Implement data structure updates
2. Create FieldEditorTable component
3. Refactor dialogs to use new component
4. Update canvas interaction logic
5. Test and validate all changes