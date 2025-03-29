import { useContext } from 'react';
import { ProjectContextType } from '@/types/schema'; // Import type from schema
import { ProjectContext } from '@/contexts/ProjectContextObject'; // Import context object

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  // We need to assert the type here because the context is created with 'undefined' initially
  return context as ProjectContextType;
};
