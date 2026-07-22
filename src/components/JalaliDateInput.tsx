"use client";

import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { Calendar } from "lucide-react";

interface JalaliDateInputProps {
  value: string; // Gregorian ISO date string, e.g. "2026-07-22"
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

// A drop-in replacement for <input type="date">, showing the Afghan/Iranian
// Shamsi (Jalali) calendar to the user while storing/emitting a standard
// Gregorian "YYYY-MM-DD" string so the rest of the app / API keeps working.
export default function JalaliDateInput({ value, onChange, className, placeholder }: JalaliDateInputProps) {
  return (
    <DatePicker
      value={value ? new DateObject({ date: value, format: "YYYY-MM-DD" }) : ""}
      onChange={(date) => {
        if (!date) { onChange(""); return; }
        const d = (date as DateObject).toDate();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        onChange(`${y}-${m}-${day}`);
      }}
      calendar={persian}
      locale={persian_fa}
      calendarPosition="bottom-right"
      inputClass={
        className ||
        "w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
      }
      placeholder={placeholder || "انتخاب تاریخ"}
      render={(value, openCalendar) => (
        <div className="relative">
          <input
            readOnly
            onFocus={openCalendar}
            onClick={openCalendar}
            value={value as string}
            placeholder={placeholder || "انتخاب تاریخ"}
            className={
              (className ||
                "w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm") +
              " pr-9 cursor-pointer bg-white"
            }
          />
          <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      )}
    />
  );
}
