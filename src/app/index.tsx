import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Card, Muted, PrimaryButton, SectionTitle, usePalette, useScreenInsets } from '@/components/screen';
import { buildOrderText, priceLines, summarize } from '@/lib/order';
import { formatEuroFromCents } from '@/lib/money';
import { useStore } from '@/state/store';

export default function OrderScreen() {
  const colors = usePalette();
  const insets = useScreenInsets();
  const { ready, books, clientName, lines, setClientName, addLine, setQuantity, removeLine, clearOrder } =
    useStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  const priced = useMemo(() => priceLines(books, lines), [books, lines]);
  const totals = useMemo(() => summarize(priced), [priced]);
  const sortedBooks = books;
  const visibleBooks = sortedBooks.filter((book) =>
    book.title.toLocaleLowerCase('fr').includes(query.trim().toLocaleLowerCase('fr')),
  );

  async function shareOrder() {
    const message = buildOrderText(clientName, priced);
    if (Platform.OS === 'web') {
      try {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title: 'Bon de commande', text: message });
          return;
        }
        await navigator.clipboard.writeText(message);
        setNotice('Bon copié dans le presse-papiers.');
      } catch {
        setNotice('Le partage a été annulé.');
      }
      return;
    }
    await Share.share({ message });
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 220 },
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <SectionTitle>Bon de commande</SectionTitle>
          <Muted>Choisissez les titres, puis envoyez le total avant et après la remise de 9 %.</Muted>
        </View>

        <Card>
          <Text style={[styles.label, { color: colors.muted }]}>Client</Text>
          <TextInput
            value={clientName}
            onChangeText={setClientName}
            placeholder="Nom du client"
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.bg }]}
          />
        </Card>

        {priced.length === 0 ? (
          <Card>
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>Aucun livre pour l’instant</Text>
            <Muted>
              {books.length === 0
                ? 'Le catalogue est vide. Ajoutez vos titres dans l’onglet Catalogue, puis revenez ici.'
                : 'Ajoutez un titre du catalogue pour commencer le bon.'}
            </Muted>
          </Card>
        ) : (
          priced.map((line) => (
            <Card key={line.book.id}>
              <View style={styles.lineHeader}>
                <Text style={[styles.bookTitle, { color: colors.ink }]}>{line.book.title}</Text>
                <Pressable accessibilityRole="button" onPress={() => removeLine(line.book.id)}>
                  <Text style={[styles.remove, { color: colors.danger }]}>Retirer</Text>
                </Pressable>
              </View>
              <Text style={[styles.unit, { color: colors.muted }]}>
                Tarif {formatEuroFromCents(line.unitCents)}
              </Text>
              <View style={styles.lineFooter}>
                <View style={[styles.stepper, { borderColor: colors.line }]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Diminuer la quantité"
                    onPress={() =>
                      line.quantity <= 1 ? removeLine(line.book.id) : setQuantity(line.book.id, line.quantity - 1)
                    }
                    style={styles.step}>
                    <Text style={[styles.stepLabel, { color: colors.ink }]}>−</Text>
                  </Pressable>
                  <Text style={[styles.qty, { color: colors.ink }]}>{line.quantity}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Augmenter la quantité"
                    onPress={() => setQuantity(line.book.id, line.quantity + 1)}
                    style={styles.step}>
                    <Text style={[styles.stepLabel, { color: colors.ink }]}>+</Text>
                  </Pressable>
                </View>
                <Text style={[styles.lineTotal, { color: colors.ink }]}>{formatEuroFromCents(line.lineCents)}</Text>
              </View>
            </Card>
          ))
        )}

        <PrimaryButton
          label="Ajouter un titre"
          disabled={!ready || books.length === 0}
          onPress={() => {
            setQuery('');
            setPickerOpen(true);
          }}
        />
        {lines.length > 0 ? (
          <PrimaryButton
            label="Vider le bon"
            tone="ghost"
            onPress={() =>
              Alert.alert('Vider le bon', 'Le client et les titres choisis seront effacés.', [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Vider', style: 'destructive', onPress: clearOrder },
              ])
            }
          />
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.summaryDock,
          {
            backgroundColor: colors.card,
            borderColor: colors.line,
            paddingBottom: insets.bottom + 12,
          },
        ]}>
        <View style={styles.summaryInner}>
          <SummaryRow label="Prix non remisé" value={formatEuroFromCents(totals.subtotalCents)} />
          <SummaryRow label="Remise 9 %" value={`−${formatEuroFromCents(totals.remiseCents)}`} />
          <View style={[styles.totalRow, { backgroundColor: colors.highlight }]}>
            <Text style={[styles.totalLabel, { color: colors.ink }]}>Prix remisé</Text>
            <Text style={[styles.totalValue, { color: colors.accent }]}>{formatEuroFromCents(totals.totalCents)}</Text>
          </View>
          {notice ? <Text style={[styles.notice, { color: colors.muted }]}>{notice}</Text> : null}
          <PrimaryButton label="Partager le bon" disabled={priced.length === 0} onPress={shareOrder} />
        </View>
      </View>

      <Modal animationType="slide" visible={pickerOpen} onRequestClose={() => setPickerOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modal, { backgroundColor: colors.bg }]}>
          <View style={{ paddingTop: insets.top + 12, paddingHorizontal: insets.horizontal, gap: 12, flex: 1 }}>
            <SectionTitle>Choisir un titre</SectionTitle>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.card }]}
            />
            <FlatList
              data={visibleBooks}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 8, paddingBottom: 24 }}
              ListEmptyComponent={<Muted>Aucun titre ne correspond.</Muted>}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    addLine(item.id);
                    setPickerOpen(false);
                  }}
                  style={[styles.pickRow, { backgroundColor: colors.card, borderColor: colors.line }]}>
                  <Text style={[styles.bookTitle, { color: colors.ink, flex: 1 }]}>{item.title}</Text>
                  <Text style={[styles.unit, { color: colors.muted }]}>
                    {formatEuroFromCents(Math.round(item.price * 100))}
                  </Text>
                </Pressable>
              )}
            />
            <PrimaryButton label="Fermer" tone="ghost" onPress={() => setPickerOpen(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const colors = usePalette();
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  scroll: {
    width: '100%',
  },
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  bookTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  remove: {
    fontSize: 15,
    fontWeight: '600',
  },
  unit: {
    fontSize: 14,
  },
  lineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  step: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 22,
    lineHeight: 24,
  },
  qty: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  lineTotal: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
  },
  summaryInner: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  notice: {
    fontSize: 13,
  },
  modal: {
    flex: 1,
  },
  pickRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
