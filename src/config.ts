import { ImmutableObject } from 'jimu-core';

export interface SavedView {
  id: string;
  label: string;
  urlData: string;
}

export interface Config {
  predefinedViews: SavedView[];
}

export type IMConfig = ImmutableObject<Config>;