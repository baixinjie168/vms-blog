import { atom } from 'nanostores';
import type { AlbumItem } from '../services/blogService';

export const $isAlbumModalOpen = atom<boolean>(false);
export const $editingAlbum = atom<AlbumItem | null>(null);

export function openAlbumModal(album?: AlbumItem) {
  $editingAlbum.set(album || null);
  $isAlbumModalOpen.set(true);
}

export function closeAlbumModal() {
  $isAlbumModalOpen.set(false);
  $editingAlbum.set(null);
}
