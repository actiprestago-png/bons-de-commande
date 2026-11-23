import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { initialCatalog } from '../data/catalog';

const STORAGE_KEY = 'bons-livres-v2';
const CATALOG_VERSION = 2026;

export type Book = {
  id: string;
  title: string;
  price: number;
};

export type OrderLine = {
  bookId: string;
  quantity: number;
};

type PersistedState = {
  books: Book[];
  clientName: string;
  lines: OrderLine[];
  catalogVersion?: number;
};

type Store = {
  ready: boolean;
  books: Book[];
  clientName: string;
  lines: OrderLine[];
  setClientName: (name: string) => void;
  addBook: (title: string, price: number) => void;
  updateBook: (id: string, title: string, price: number) => void;
  deleteBook: (id: string) => void;
  addLine: (bookId: string) => void;
  setQuantity: (bookId: string, quantity: number) => void;
  removeLine: (bookId: string) => void;
  clearOrder: () => void;
};

const StoreContext = createContext<Store | null>(null);

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [clientName, setClientName] = useState('');
  const [lines, setLines] = useState<OrderLine[]>([]);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) {
          return;
        }
        if (!raw) {
          setBooks(initialCatalog);
          return;
        }
        const parsed = JSON.parse(raw) as PersistedState;
        const hasImportedList =
          Array.isArray(parsed.books) && parsed.books.some((book) => book.id.startsWith('livre-'));
        if (!hasImportedList) {
          setBooks(initialCatalog);
          setClientName('');
          setLines([]);
          return;
        }
        if (Array.isArray(parsed.books)) {
          setBooks(parsed.books);
        }
        if (typeof parsed.clientName === 'string') {
          setClientName(parsed.clientName);
        }
        if (Array.isArray(parsed.lines)) {
          setLines(parsed.lines);
        }
      })
      .catch(() => {
        // A missing or unreadable save starts from an empty catalog.
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const payload: PersistedState = { books, clientName, lines, catalogVersion: CATALOG_VERSION };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {
      // The next edit retries the save.
    });
  }, [ready, books, clientName, lines]);

  const value = useMemo<Store>(
    () => ({
      ready,
      books,
      clientName,
      lines,
      setClientName,
      addBook: (title, price) => {
        setBooks((current) => [...current, { id: createId(), title: title.trim(), price }]);
      },
      updateBook: (id, title, price) => {
        setBooks((current) =>
          current.map((book) => (book.id === id ? { ...book, title: title.trim(), price } : book)),
        );
      },
      deleteBook: (id) => {
        setBooks((current) => current.filter((book) => book.id !== id));
        setLines((current) => current.filter((line) => line.bookId !== id));
      },
      addLine: (bookId) => {
        setLines((current) => {
          const existing = current.find((line) => line.bookId === bookId);
          if (!existing) {
            return [...current, { bookId, quantity: 1 }];
          }
          return current.map((line) =>
            line.bookId === bookId ? { ...line, quantity: line.quantity + 1 } : line,
          );
        });
      },
      setQuantity: (bookId, quantity) => {
        const next = Math.min(999, Math.max(1, Math.round(quantity)));
        setLines((current) =>
          current.map((line) => (line.bookId === bookId ? { ...line, quantity: next } : line)),
        );
      },
      removeLine: (bookId) => {
        setLines((current) => current.filter((line) => line.bookId !== bookId));
      },
      clearOrder: () => {
        setClientName('');
        setLines([]);
      },
    }),
    [ready, books, clientName, lines],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return store;
}

