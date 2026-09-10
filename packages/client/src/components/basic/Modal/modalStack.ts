// Every open modal listens for Escape and Ctrl+Enter on the window, so a key
// press reaches all of them at once. The stack records the order modals opened
// in, and only the one on top acts on the key - a confirmation opened over
// another modal closes itself and leaves the one beneath it standing.

const openModals: symbol[] = [];

export const pushModal = (id: symbol): void => {
  openModals.push(id);
};

export const removeModal = (id: symbol): void => {
  const index = openModals.lastIndexOf(id);
  if (index !== -1) {
    openModals.splice(index, 1);
  }
};

export const isTopmostModal = (id: symbol): boolean =>
  openModals[openModals.length - 1] === id;
