import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Node } from 'reactflow';
import { TableNode } from '@/types/schema';
import { useProject } from './useProject'; // Assuming tablesApi comes from useProject

// Define the arguments the hook will need
interface UseClipboardHandlingArgs {
  nodes: Node[];
  projectTables: TableNode[];
  tablesApi: ReturnType<typeof useProject>['tablesApi']; // Get the type from useProject
}

export const useClipboardHandling = ({
  nodes,
  projectTables,
  tablesApi,
}: UseClipboardHandlingArgs): void => {
  // State for the copied table data is now internal to the hook
  const [copiedTableData, setCopiedTableData] = useState<Omit<TableNode, 'id' | 'position'> | null>(
    null
  );

  // Handle Copy/Paste keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const copyKeyPressed = (isMac ? event.metaKey : event.ctrlKey) && event.key === 'c';
      const pasteKeyPressed = (isMac ? event.metaKey : event.ctrlKey) && event.key === 'v';

      // Temporarily removed input/textarea focus check for debugging
      // const targetElement = event.target as HTMLElement;
      // if (targetElement && (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA')) {
      //   return;
      // }

      if (copyKeyPressed) {
        // Find the selected node
        const selectedNode = nodes.find((node) => node.selected);
        if (selectedNode && selectedNode.type === 'table') {
          // Find the full table data from the project tables
          const tableData = projectTables.find((t) => t.id === selectedNode.id);
          if (tableData) {
            // Exclude id and position for copying
            const { ...dataToCopy } = tableData;
            setCopiedTableData(dataToCopy);
            toast.info(`Copied table "${dataToCopy.name}"`);
            event.preventDefault(); // Prevent default browser copy action
          }
        }
      }

      if (pasteKeyPressed && copiedTableData) {
        // Calculate a slightly offset position for the new table
        const pastePosition = { x: 100, y: 100 }; // Simple default position
        const selectedNode = nodes.find((node) => node.selected);
        if (selectedNode) {
          pastePosition.x = selectedNode.position.x + 50;
          pastePosition.y = selectedNode.position.y + 50;
        }

        const newTableData: Omit<TableNode, 'id' | 'position'> = {
          ...copiedTableData,
          name: `${copiedTableData.name} (Copy)`,
          fields: copiedTableData.fields.map((field) => ({ ...field })), // Shallow copy fields
        };

        // Call the API to add the new table
        tablesApi.addTable(newTableData, pastePosition);
        toast.success(`Pasted table "${newTableData.name}"`);
        event.preventDefault(); // Prevent default browser paste action
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup listener on hook unmount
    return (): void => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    // Dependencies for the effect within the hook
  }, [nodes, projectTables, copiedTableData, tablesApi, setCopiedTableData]);

  // The hook doesn't need to return anything if state is internal
};
