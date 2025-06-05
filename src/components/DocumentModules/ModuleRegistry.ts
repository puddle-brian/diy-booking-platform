import React from 'react';

/**
 * Core interfaces for the document module system
 */
export interface ModuleDefinition {
  id: string;
  title: string;
  owner: 'artist' | 'venue' | 'shared';
  order: number;
  defaultStatus: 'draft' | 'proposed' | 'committed' | 'locked';
  
  // Check permissions
  canEdit: (viewerType: string, status: string) => boolean;
  canView: (viewerType: string) => boolean;
  
  // Extract data from context
  extractData: (context: any) => any;
  
  // React component for rendering
  component: React.ComponentType<ModuleComponentProps>;
}

export interface ModuleComponentProps {
  data: any;
  isEditing: boolean;
  status: string;
  viewerType: string;
  canEdit: boolean;
  onDataChange: (data: any) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onStartEdit: () => void;
  isSaving?: boolean;
  errors?: string[];
}

/**
 * Module Registry - This is where we register all available modules
 * Adding a new module is as simple as importing it and adding it to this registry
 */
class DocumentModuleRegistry {
  private modules: Map<string, ModuleDefinition> = new Map();

  register(module: ModuleDefinition) {
    this.modules.set(module.id, module);
  }

  get(id: string): ModuleDefinition | undefined {
    return this.modules.get(id);
  }

  getAll(): ModuleDefinition[] {
    return Array.from(this.modules.values()).sort((a, b) => a.order - b.order);
  }

  getByOwner(owner: 'artist' | 'venue' | 'shared'): ModuleDefinition[] {
    return this.getAll().filter(module => module.owner === owner);
  }
}

// Export the singleton registry
export const moduleRegistry = new DocumentModuleRegistry();

/**
 * Helper function to initialize modules from context data
 */
export function initializeModules(context: any, viewerType: string) {
  const modules = moduleRegistry.getAll();
  
  return modules.map(module => {
    const data = module.extractData(context);
    const status = determineModuleStatus(module, data, context);
    
    return {
      id: module.id,
      title: module.title,
      owner: module.owner,
      status,
      data,
      canEdit: module.canEdit(viewerType, status),
      canView: module.canView(viewerType)
    };
  });
}

/**
 * Smart status determination based on data completeness and context
 */
function determineModuleStatus(module: ModuleDefinition, data: any, context: any): string {
  // If it's a confirmed show, most things should be committed
  if (context.show) {
    return hasData(data) ? 'committed' : 'draft';
  }
  
  // If it's a bid, venue modules are proposed, others are draft
  if (context.bid) {
    if (module.owner === 'venue') {
      return hasData(data) ? 'proposed' : 'draft';
    }
    return hasData(data) ? 'draft' : 'draft';
  }
  
  // If it's a tour request, artist modules are proposed, others are draft
  if (context.tourRequest) {
    if (module.owner === 'artist') {
      return hasData(data) ? 'proposed' : 'draft';
    }
    return hasData(data) ? 'draft' : 'draft';
  }
  
  return module.defaultStatus;
}

/**
 * Check if module data has meaningful content
 */
function hasData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  // Check if object has any non-empty values
  const values = Object.values(data).filter(value => {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    return true;
  });
  
  return values.length > 0;
} 