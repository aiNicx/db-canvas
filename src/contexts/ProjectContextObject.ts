import { createContext } from 'react';
import { ProjectContextType } from '@/types/schema'; // Import type from its new location

// Create and export the context object
export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);
