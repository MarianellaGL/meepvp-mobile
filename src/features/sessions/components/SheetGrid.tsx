import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { cellLabel, rowHint, type Sheet, type SheetRow } from '@/features/sessions/sheet';
import { tokens } from '@/theme';

type SheetGridProps = {
  sheet: Sheet;
  selfPlayerId: string | null;
  /** Without it the sheet is read-only, as in a finished or paused game. */
  onEdit?: (row: SheetRow, playerIndex: number) => void;
};

const labelWidth = 132;
const minColumn = 68;
const headerHeight = 58;
const rowHeight = 56;

/** The paper score sheet: categories down the side, one column per player, totals on top. */
export function SheetGrid({ sheet, selfPlayerId, onEdit }: SheetGridProps) {
  const [width, setWidth] = useState(0);
  const columnWidth = Math.max(minColumn, Math.floor((width - labelWidth) / Math.max(sheet.columns.length, 1)));

  return <View style={styles.grid} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
    <View style={{ width: labelWidth }}>
      <View style={[styles.header, styles.labelHeader]}><Text style={styles.headerLabel}>TOTAL</Text></View>
      {sheet.rows.map((row) => <View key={row.id} style={[styles.label, row.kind === 'other' && styles.otherRow]}>
        <Text style={styles.labelName} numberOfLines={2}>{row.name}</Text>
        <Text style={styles.labelHint} numberOfLines={1}>{rowHint(row)}</Text>
      </View>)}
    </View>

    <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
      {sheet.columns.map((column, index) => {
        const self = column.playerId === selfPlayerId;
        return <View key={column.playerId} style={[{ width: columnWidth }, self && styles.selfColumn]}>
          <View style={styles.header} accessibilityLabel={`${column.name}${self ? ', vos' : ''}: ${column.total} puntos${column.leader ? ', va ganando' : ''}`}>
            <Text style={[styles.player, self && styles.self]} numberOfLines={1}>{column.name}</Text>
            <Text style={[styles.total, column.leader && styles.leader]}>{column.total}</Text>
          </View>
          {sheet.rows.map((row) => {
            const cell = row.cells[index];
            const label = cellLabel(row, cell);
            return <Pressable
              key={row.id}
              disabled={!onEdit}
              onPress={() => onEdit?.(row, index)}
              accessibilityRole="button"
              accessibilityLabel={`${row.name}, ${column.name}: ${cell.points} puntos`}
              style={({ pressed }) => [styles.cell, row.kind === 'other' && styles.otherRow, pressed && styles.pressed]}
            >
              <Text style={[styles.points, label.points === '–' && styles.empty]}>{label.points}</Text>
              {label.detail && <Text style={styles.detail}>{label.detail}</Text>}
            </Pressable>;
          })}
        </View>;
      })}
    </ScrollView>
  </View>;
}

const line = { borderBottomColor: tokens.color.border, borderBottomWidth: StyleSheet.hairlineWidth };

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', marginHorizontal: -tokens.space.xs },
  header: { ...line, alignItems: 'center', borderBottomWidth: 1, height: headerHeight, justifyContent: 'center', paddingHorizontal: 4 },
  labelHeader: { alignItems: 'flex-start' },
  headerLabel: { color: tokens.color.secondaryText, fontFamily: tokens.font.semibold, fontSize: 11, letterSpacing: 1.2 },
  player: { color: tokens.color.secondaryText, fontFamily: tokens.font.semibold, fontSize: 12 },
  self: { color: tokens.color.gold },
  total: { color: tokens.color.primaryText, fontFamily: tokens.font.semibold, fontSize: 22, fontVariant: ['tabular-nums'] },
  leader: { color: tokens.color.gold },
  selfColumn: { backgroundColor: tokens.color.elevated, borderRadius: tokens.radius.small },
  label: { ...line, height: rowHeight, justifyContent: 'center', paddingRight: tokens.space.sm },
  labelName: { color: tokens.color.primaryText, fontFamily: tokens.font.semibold, fontSize: 13, lineHeight: 16 },
  labelHint: { color: tokens.color.secondaryText, fontFamily: tokens.font.body, fontSize: 11, marginTop: 2 },
  otherRow: { opacity: 0.8 },
  cell: { ...line, alignItems: 'center', height: rowHeight, justifyContent: 'center' },
  pressed: { backgroundColor: tokens.color.border },
  points: { color: tokens.color.primaryText, fontFamily: tokens.font.semibold, fontSize: 17, fontVariant: ['tabular-nums'] },
  empty: { color: tokens.color.secondaryText },
  detail: { color: tokens.color.secondaryText, fontFamily: tokens.font.body, fontSize: 11, fontVariant: ['tabular-nums'] },
});
