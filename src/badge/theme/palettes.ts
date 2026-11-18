export type BoardId = 'green' | 'black' | 'blue' | 'red' | 'white' | 'midnight';
export type MetalId = 'gold' | 'silver';

export const BOARDS: readonly { id: BoardId; label: string; hidden?: boolean }[] = [
  { id: 'green', label: 'Green' },
  { id: 'black', label: 'Black' },
  { id: 'blue', label: 'Blue' },
  { id: 'red', label: 'Red' },
  { id: 'white', label: 'White' },
  { id: 'midnight', label: 'Midnight', hidden: true },
];

export const METALS: readonly { id: MetalId; label: string }[] = [
  { id: 'gold', label: 'Gold' },
  { id: 'silver', label: 'Silver' },
];

export interface Theme {
  board: BoardId;
  metal: MetalId;
}

export const DEFAULT_THEME: Theme = { board: 'green', metal: 'gold' };
