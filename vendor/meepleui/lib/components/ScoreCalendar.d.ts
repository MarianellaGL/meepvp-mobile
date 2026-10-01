export type ScoreCalendarProps = {
    selectedDate?: string | null;
    onSelect?: (date: string) => void;
    initialMonth?: string;
    onMonthChange?: (month: string) => void;
    minDate?: string;
    maxDate?: string;
    markedDates?: string[];
    firstDayOfWeek?: 0 | 1;
    locale?: string;
    accentColor?: string;
};
export declare function ScoreCalendar({ selectedDate, onSelect, initialMonth, onMonthChange, minDate, maxDate, markedDates, firstDayOfWeek, locale, accentColor, }: ScoreCalendarProps): import("react").JSX.Element;
