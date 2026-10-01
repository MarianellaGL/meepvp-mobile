"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreCalendar = ScoreCalendar;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("../theme");
const two = (value) => String(value).padStart(2, '0');
const keyOf = (year, month, day) => `${year}-${two(month + 1)}-${two(day)}`;
const monthKey = (year, month) => `${year}-${two(month + 1)}`;
function readMonth(input) {
    if (input && /^\d{4}-\d{2}/.test(input)) {
        const year = Number(input.slice(0, 4));
        const month = Number(input.slice(5, 7)) - 1;
        if (month >= 0 && month < 12)
            return { year, month };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
}
function ScoreCalendar({ selectedDate = null, onSelect, initialMonth, onMonthChange, minDate, maxDate, markedDates = [], firstDayOfWeek = 1, locale = 'es-AR', accentColor = theme_1.tokens.color.gold, }) {
    const [visible, setVisible] = (0, react_1.useState)(() => readMonth(initialMonth ?? selectedDate));
    const first = new Date(Date.UTC(visible.year, visible.month, 1)).getUTCDay();
    const offset = (first - firstDayOfWeek + 7) % 7;
    const count = new Date(Date.UTC(visible.year, visible.month + 1, 0)).getUTCDate();
    const cells = Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => {
        const day = index - offset + 1;
        return day > 0 && day <= count ? day : null;
    });
    const title = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(visible.year, visible.month, 1)));
    const weekdays = Array.from({ length: 7 }, (_, index) => {
        const sundayBased = (index + firstDayOfWeek) % 7;
        return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + sundayBased)));
    });
    const today = new Date();
    const todayKey = keyOf(today.getFullYear(), today.getMonth(), today.getDate());
    const marks = new Set(markedDates);
    function moveMonth(delta) {
        const next = new Date(Date.UTC(visible.year, visible.month + delta, 1));
        const month = { year: next.getUTCFullYear(), month: next.getUTCMonth() };
        setVisible(month);
        onMonthChange?.(monthKey(month.year, month.month));
    }
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.calendar, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.header, children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.title, children: title }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.monthButtons, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { accessibilityRole: "button", accessibilityLabel: "Mes anterior", onPress: () => moveMonth(-1), style: styles.monthButton, children: (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "chevron-left", size: 24, color: theme_1.tokens.color.primaryText }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { accessibilityRole: "button", accessibilityLabel: "Mes siguiente", onPress: () => moveMonth(1), style: styles.monthButton, children: (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "chevron-right", size: 24, color: theme_1.tokens.color.primaryText }) })] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.grid, children: [weekdays.map((name, index) => (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.cell, children: (0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: styles.weekday, children: name }) }, `weekday-${index}`)), cells.map((day, index) => {
                        if (day === null)
                            return (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.cell }, `blank-${index}`);
                        const date = keyOf(visible.year, visible.month, day);
                        const selected = selectedDate === date;
                        const disabled = (minDate !== undefined && date < minDate) || (maxDate !== undefined && date > maxDate);
                        return (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.cell, children: (0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { accessibilityRole: "button", accessibilityLabel: new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(Date.UTC(visible.year, visible.month, day))), accessibilityState: { selected, disabled }, disabled: disabled, hitSlop: 4, onPress: () => onSelect?.(date), style: [styles.day, date === todayKey && !selected && { borderColor: accentColor, borderWidth: 1 }, selected && { backgroundColor: accentColor }], children: [(0, jsx_runtime_1.jsx)(react_native_paper_1.Text, { style: [styles.dayText, disabled && styles.disabledText, selected && styles.selectedText], children: day }), marks.has(date) && (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.mark, { backgroundColor: selected ? theme_1.tokens.color.canvas : accentColor }] })] }) }, date);
                    })] })] }));
}
const styles = react_native_1.StyleSheet.create({
    calendar: { backgroundColor: theme_1.tokens.color.surface, borderRadius: theme_1.tokens.radius.large, padding: 16, gap: 14 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { color: theme_1.tokens.color.primaryText, fontFamily: theme_1.tokens.font.heading, fontSize: 20, textTransform: 'capitalize' },
    monthButtons: { flexDirection: 'row', gap: 4 },
    monthButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: '14.2857%', height: 48, alignItems: 'center', justifyContent: 'center' },
    weekday: { color: theme_1.tokens.color.secondaryText, fontFamily: theme_1.tokens.font.semibold, fontSize: 12, textTransform: 'uppercase' },
    day: { width: '100%', maxWidth: 44, aspectRatio: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    dayText: { color: theme_1.tokens.color.primaryText, fontFamily: theme_1.tokens.font.medium, fontSize: 14 },
    disabledText: { color: theme_1.tokens.color.border },
    selectedText: { color: theme_1.tokens.color.canvas, fontFamily: theme_1.tokens.font.semibold },
    mark: { position: 'absolute', bottom: 5, width: 4, height: 4, borderRadius: 2 },
});
//# sourceMappingURL=ScoreCalendar.js.map