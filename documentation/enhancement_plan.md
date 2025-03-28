# DB Canvas Enhancement Plan

**Overall Goal:** Enhance the DB Canvas with connection deletion (including FK removal) and table duplication (copy/paste), while improving code structure.

## 1. Information Gathering & Analysis (Completed)

*   Reviewed project structure via `list_files`.
*   Examined key files:
    *   `src/components/DBCanvas.tsx` (React Flow setup, event handling)
    *   `src/contexts/NewProjectContext.tsx` (State management, localStorage, API hook initialization)
    *   `src/hooks/useTables.ts` (Table CRUD operations)
    *   `src/hooks/useConnections.ts` (Connection CRUD operations)
*   Identified that connection deletion currently only removes the connection object, not the associated foreign key property on the table field.
*   Identified that table duplication logic needs to be added.
*   Noted `DBCanvas.tsx` exceeds the desired line count.

## 2. Feature: Delete Connection & Foreign Key

*   **Rationale:** When a connection (React Flow edge) is deleted, the corresponding foreign key constraint stored in the source table's field data should also be removed.
*   **Step 2.1: Enhance `deleteConnection` Logic:**
    *   Modify the `deleteConnection` function within `src/hooks/useConnections.ts`.
    *   Before updating the project state, find the connection object being deleted using the provided `id`.
    *   Identify the `sourceId` and `sourceField` from the connection object.
    *   Find the source `TableNode` in the `project.tables` array using `sourceId`.
    *   Prepare an updated version of the source table where the `foreignKey` property is removed from the field matching `sourceField`.
*   **Step 2.2: Update Project State Holistically:**
    *   Modify the `updateProject` callback call within `deleteConnection` in `src/hooks/useConnections.ts`.
    *   Ensure the callback updates *both* the `connections` array (by filtering out the deleted connection) *and* the `tables` array (by replacing the source table with its updated version without the `foreignKey`).
*   **Step 2.3: Integrate with React Flow:**
    *   In `src/components/DBCanvas.tsx`, the `onEdgesChange` handler (provided by `useEdgesState`) automatically receives edge removal events when the user deletes an edge (e.g., selecting it and pressing Backspace).
    *   Verify that `onEdgesChange` correctly identifies 'remove' type changes and triggers `connectionsApi.deleteConnection(edge.id)` for each removed edge. This should work automatically with the existing `useEdgesState` hook, but needs confirmation during implementation/testing.

## 3. Feature: Duplicate Table (Copy/Paste)

*   **Rationale:** Allow users to quickly create copies of existing tables.
*   **Step 3.1: Implement Copy Logic:**
    *   In `src/components/DBCanvas.tsx`, add component state to store the data of the copied table: `const [copiedTableData, setCopiedTableData] = useState<Omit<TableNode, 'id' | 'position'> | null>(null);`
    *   Implement a copy trigger mechanism:
        *   *Option A (Keyboard):* Add a `useEffect` hook to listen for `keydown` events. If `Ctrl/Cmd + C` is pressed and a single node is selected, find the corresponding `TableNode` data from `project.tables`, extract relevant fields (name, fields, color, etc.), and store it in `copiedTableData`.
        *   *Option B (Context Menu):* Add a context menu to the `TableNodeComponent` that includes a "Copy" action, triggering the same logic.
*   **Step 3.2: Implement Paste Logic:**
    *   Implement a paste trigger mechanism:
        *   *Option A (Keyboard):* In the `keydown` listener, if `Ctrl/Cmd + V` is pressed and `copiedTableData` exists, proceed with pasting.
        *   *Option B (Context Menu):* Add a context menu to the canvas background that includes a "Paste" action.
    *   When pasting:
        *   Retrieve the data from `copiedTableData`.
        *   Generate a new unique `id` using `uuidv4`.
        *   Create a modified name (e.g., `${copiedTableData.name} (Copy)`).
        *   Determine a suitable `position` for the new node (e.g., slightly offset from the original if possible, or near the current mouse pointer/view center).
        *   Construct the full new `TableNode` object.
        *   Call `tablesApi.addTable(newTableData, newPosition)`.

## 4. Refactoring & Code Quality

*   **Rationale:** Improve maintainability and adhere to the < 200 lines guideline.
*   **Step 4.1: Extract `FloatingEdge` Component:**
    *   Create a new file: `src/components/FloatingEdge.tsx`.
    *   Move the `FloatingEdge` functional component definition (currently lines 31-86 in `DBCanvas.tsx`) into this new file.
    *   Update `src/components/DBCanvas.tsx` to import `FloatingEdge` and remove the local definition.
*   **Step 4.2: Review `DBCanvas.tsx` Length:**
    *   After extracting `FloatingEdge`, check the line count of `DBCanvas.tsx`.
    *   If it still significantly exceeds 200 lines, analyze if other parts (e.g., `onConnect` logic, `useEffect` hooks, helper functions) can be further extracted into smaller, focused hooks or utility functions.
*   **Step 4.3: General Code Review (Optional but Recommended):**
    *   Review code for consistency, clarity, and adherence to TypeScript/React best practices.
    *   Look for opportunities to streamline logic (e.g., validation checks).

## Mermaid Diagram (Data Flow)

```mermaid
graph LR
    subgraph DBCanvas.tsx
        RF[ReactFlow Component]
        OC[onConnect]
        OEC[onEdgesChange]
        OND[onNodeDragStop]
        CP[Copy/Paste Logic]
    end

    subgraph NewProjectContext.tsx
        CTX[ProjectContext.Provider]
        STATE[Project State (tables, connections)]
        UP[updateProject Callback]
        LS[LocalStorage Sync]
    end

    subgraph Hooks
        UT[useTables (tablesApi)]
        UC[useConnections (connectionsApi)]
    end

    RF -- Triggers Events --> OC
    RF -- Triggers Events --> OEC
    RF -- Triggers Events --> OND
    RF -- Triggers Events --> CP

    OC -- Calls --> UC(addConnection)
    OEC -- Calls --> UC(deleteConnection)
    OND -- Calls --> UT(updateTable)
    CP -- Calls --> UT(addTable)

    UC -- Calls --> UP
    UT -- Calls --> UP

    UP -- Updates --> STATE
    STATE -- Updates --> LS
    LS -- Loads --> STATE

    CTX -- Provides --> UP
    CTX -- Provides --> UT
    CTX -- Provides --> UC
    CTX -- Provides --> STATE

    DBCanvas.tsx -- Consumes --> CTX