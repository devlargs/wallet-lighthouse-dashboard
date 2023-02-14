import { create } from 'zustand';

type Urls = Record<string, any>; // TODO: typecheck this better

export const useUrls = create<{
  urls: Array<Urls>;
  setUrls: (urls: Urls) => void;
}>((set) => ({
  urls: [],
  setUrls: (urls: Array<Urls>): void => set({ urls }),
}));
