/**
 * Component Registry
 * Centralized registry for dynamic component loading and management
 */

import { ComponentType, lazy } from 'react';
import { ComponentRegistry } from '../types/base';

// Core component registry
const coreComponents: ComponentRegistry = {
  // UI Core Components
  Button: lazy(() => import('../ui/button').then(module => ({ default: module.Button }))),
  Input: lazy(() => import('../ui/input').then(module => ({ default: module.Input }))),
  Card: lazy(() => import('../ui/card').then(module => ({ default: module.Card }))),
  Badge: lazy(() => import('../ui/badge').then(module => ({ default: module.Badge }))),
  Avatar: lazy(() => import('../ui/avatar').then(module => ({ default: module.Avatar }))),
  
  // UI Form Components
  Checkbox: lazy(() => import('../ui/checkbox').then(module => ({ default: module.Checkbox }))),
  Select: lazy(() => import('../ui/select').then(module => ({ default: module.Select }))),
  Textarea: lazy(() => import('../ui/textarea').then(module => ({ default: module.Textarea }))),
  Switch: lazy(() => import('../ui/switch').then(module => ({ default: module.Switch }))),
  Label: lazy(() => import('../ui/label').then(module => ({ default: module.Label }))),
  
  // UI Feedback Components
  Alert: lazy(() => import('../ui/alert').then(module => ({ default: module.Alert }))),
  LoadingSpinner: lazy(() => import('../ui/LoadingSpinner').then(module => ({ default: module.LoadingSpinner }))),
  Skeleton: lazy(() => import('../ui/Skeleton').then(module => ({ default: module.Skeleton }))),
  
  // UI Navigation Components
  Tabs: lazy(() => import('../ui/tabs').then(module => ({ default: module.Tabs }))),
  
  // UI Overlay Components
  Dialog: lazy(() => import('../ui/dialog').then(module => ({ default: module.Dialog }))),
  AlertDialog: lazy(() => import('../ui/alert-dialog').then(module => ({ default: module.AlertDialog }))),
  DropdownMenu: lazy(() => import('../ui/dropdown-menu').then(module => ({ default: module.DropdownMenu }))),
  Tooltip: lazy(() => import('../ui/tooltip').then(module => ({ default: module.Tooltip }))),
  
  // Feature Components
  ServiceCard: lazy(() => import('../features/ServiceCard')),
  LoginForm: lazy(() => import('../auth/LoginForm')),
  RegisterForm: lazy(() => import('../auth/RegisterForm')),
  
  // Page Components
  HomePageClient: lazy(() => import('../HomePageClient')),
  ModernizedHomePageClient: lazy(() => import('../ModernizedHomePageClient')),
};

// Component registry class
export class ComponentRegistryManager {
  private static instance: ComponentRegistryManager;
  private registry: ComponentRegistry = { ...coreComponents };

  private constructor() {}

  public static getInstance(): ComponentRegistryManager {
    if (!ComponentRegistryManager.instance) {
      ComponentRegistryManager.instance = new ComponentRegistryManager();
    }
    return ComponentRegistryManager.instance;
  }

  /**
   * Register a new component
   */
  public register(name: string, component: ComponentType<any>): void {
    this.registry[name] = component;
  }

  /**
   * Get a component by name
   */
  public get(name: string): ComponentType<any> | undefined {
    return this.registry[name];
  }

  /**
   * Check if a component is registered
   */
  public has(name: string): boolean {
    return name in this.registry;
  }

  /**
   * Get all registered component names
   */
  public getComponentNames(): string[] {
    return Object.keys(this.registry);
  }

  /**
   * Unregister a component
   */
  public unregister(name: string): void {
    delete this.registry[name];
  }

  /**
   * Get the entire registry
   */
  public getRegistry(): ComponentRegistry {
    return { ...this.registry };
  }

  /**
   * Clear all registered components
   */
  public clear(): void {
    this.registry = {};
  }

  /**
   * Reset to default components
   */
  public reset(): void {
    this.registry = { ...coreComponents };
  }
}

// Export singleton instance
export const componentRegistry = ComponentRegistryManager.getInstance();

// Helper functions
export const registerComponent = (name: string, component: ComponentType<any>) => {
  componentRegistry.register(name, component);
};

export const getComponent = (name: string) => {
  return componentRegistry.get(name);
};

export const hasComponent = (name: string) => {
  return componentRegistry.has(name);
};

export const getComponentNames = () => {
  return componentRegistry.getComponentNames();
};