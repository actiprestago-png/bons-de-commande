import { discountCents, formatEuroFromCents, lineTotalCents } from '@/lib/money';
import type { Book, OrderLine } from '@/state/store';

export type PricedLine = {
  book: Book;
  quantity: number;
  unitCents: number;
  lineCents: number;
};

export function priceLines(books: Book[], lines: OrderLine[]): PricedLine[] {
  return lines.flatMap((line) => {
    const book = books.find((item) => item.id === line.bookId);
    if (!book) {
      return [];
    }
    const unitCents = Math.round(book.price * 100);
    return [
      {
        book,
        quantity: line.quantity,
        unitCents,
        lineCents: lineTotalCents(unitCents, line.quantity),
      },
    ];
  });
}

export function summarize(priced: PricedLine[]) {
  const subtotalCents = priced.reduce((sum, line) => sum + line.lineCents, 0);
  const remiseCents = discountCents(subtotalCents);
  const totalCents = subtotalCents - remiseCents;
  return { subtotalCents, remiseCents, totalCents };
}

export function buildOrderText(clientName: string, priced: PricedLine[]): string {
  const { subtotalCents, remiseCents, totalCents } = summarize(priced);
  const date = new Date().toLocaleDateString('fr-FR');
  const client = clientName.trim() || '—';
  const body =
    priced.length === 0
      ? 'Aucun titre.'
      : priced
          .map(
            (line) =>
              `• ${line.book.title}\n  ${line.quantity} × ${formatEuroFromCents(line.unitCents)} = ${formatEuroFromCents(line.lineCents)}`,
          )
          .join('\n');

  return [
    'BON DE COMMANDE',
    `Date : ${date}`,
    `Client : ${client}`,
    '',
    body,
    '',
    `Prix non remisé : ${formatEuroFromCents(subtotalCents)}`,
    `Remise 9 % : −${formatEuroFromCents(remiseCents)}`,
    `Prix remisé : ${formatEuroFromCents(totalCents)}`,
  ].join('\n');
}
