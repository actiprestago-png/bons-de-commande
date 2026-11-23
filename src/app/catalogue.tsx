import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Card, Muted, PrimaryButton, SectionTitle, usePalette, useScreenInsets } from '@/components/screen';
import { formatEuro, parsePrice } from '@/lib/money';
import { useStore, type Book } from '@/state/store';

export default function CatalogueScreen() {
  const colors = usePalette();
  const insets = useScreenInsets();
  const { books, addBook, updateBook, deleteBook } = useStore();
  const [editing, setEditing] = useState<Book | null>(null);
  const [creating, setCreating] = useState(false);

  const sorted = books;

  function confirmDelete(book: Book) {
    Alert.alert('Supprimer ce titre', `« ${book.title} » sera retiré du catalogue et des bons en cours.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteBook(book.id) },
    ]);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}>
        <View style={styles.header}>
          <SectionTitle>Catalogue</SectionTitle>
          <Muted>Ajoutez, modifiez ou retirez les titres et leurs tarifs. Cette liste est enregistrée sur l’iPhone.</Muted>
        </View>

        <PrimaryButton label="Nouveau titre" onPress={() => setCreating(true)} />

        {sorted.length === 0 ? (
          <Card>
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>Aucun titre</Text>
            <Muted>La liste est prête à recevoir vos livres. Vous pourrez la compléter à tout moment.</Muted>
          </Card>
        ) : (
          sorted.map((book) => (
            <Card key={book.id}>
              <Text style={[styles.title, { color: colors.ink }]}>{book.title}</Text>
              <Text style={[styles.price, { color: colors.accent }]}>{formatEuro(book.price)}</Text>
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" onPress={() => setEditing(book)} style={styles.action}>
                  <Text style={[styles.actionLabel, { color: colors.ink }]}>Modifier</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => confirmDelete(book)} style={styles.action}>
                  <Text style={[styles.actionLabel, { color: colors.danger }]}>Supprimer</Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {creating || editing ? (
        <BookForm
          title={editing ? 'Modifier le titre' : 'Nouveau titre'}
          initialTitle={editing?.title ?? ''}
          initialPrice={editing ? editing.price.toFixed(2).replace('.', ',') : ''}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(title, price) => {
            if (editing) {
              updateBook(editing.id, title, price);
            } else {
              addBook(title, price);
            }
            setCreating(false);
            setEditing(null);
          }}
        />
      ) : null}
    </View>
  );
}

function BookForm({
  title,
  initialTitle,
  initialPrice,
  onClose,
  onSave,
}: {
  title: string;
  initialTitle: string;
  initialPrice: string;
  onClose: () => void;
  onSave: (title: string, price: number) => void;
}) {
  const colors = usePalette();
  const insets = useScreenInsets();
  const [name, setName] = useState(initialTitle);
  const [price, setPrice] = useState(initialPrice);
  const [error, setError] = useState('');

  function save() {
    const parsed = parsePrice(price);
    if (!name.trim()) {
      setError('Indiquez le titre du livre.');
      return;
    }
    if (parsed === null) {
      setError('Indiquez un tarif valide, par exemple 12,90.');
      return;
    }
    onSave(name, parsed);
  }

  return (
    <Modal animationType="slide" visible onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.screen, { backgroundColor: colors.bg }]}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: insets.horizontal, gap: 14 }}>
          <SectionTitle>{title}</SectionTitle>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Titre</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Titre du livre"
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.card }]}
          />
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Tarif (€)</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="12,90"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.card }]}
          />
          {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
          <PrimaryButton label="Enregistrer" onPress={save} />
          <PrimaryButton label="Annuler" tone="ghost" onPress={onClose} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  action: {
    minHeight: 32,
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  fieldLabel: {
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
});
