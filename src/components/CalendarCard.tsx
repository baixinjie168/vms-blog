import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Calendar, ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { $filter, filterByDate, resetFilter, toggleSwapCards } from '../stores/filterStore';

interface CalendarCardProps {
  initialDots?: Record<string, number>;
  daysCount?: number;
}

const SEASONAL_LABELS = [
  '丙午年 · 孟春立春',
  '丙午年 · 仲春惊蛰',
  '丙午年 · 季春清明',
  '丙午年 · 孟夏立夏',
  '丙午年 · 仲夏芒种',
  '丙午年 · 季夏小暑',
  '丙午年 · 孟秋立秋',
  '丙午年 · 仲秋白露',
  '丙午年 · 仲秋秋分',
  '丙午年 · 孟冬立冬',
  '丙午年 · 仲冬大雪',
  '丙午年 · 季冬小寒'
];

export default function CalendarCard({ initialDots = {}, daysCount = 430 }: CalendarCardProps) {
  const filter = useStore($filter);

  // 初始化年月（基线为当前时间或 2026 年）
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0 - 11
  const [dots, setDots] = useState<Record<string, number>>(initialDots);
  const [loading, setLoading] = useState(false);

  // 格式化今日日期
  const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // 切换月份获取对应打点
  const fetchMonthDots = async (year: number, monthIndex: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/calendar?year=${year}&month=${monthIndex + 1}`);
      const json = await res.json();
      if (json.success && json.dots) {
        setDots(json.dots);
      }
    } catch (e) {
      console.error('Failed to load month dots', e);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta: number) => {
    let nextMonth = currentMonth + delta;
    let nextYear = currentYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    } else if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    }
    setCurrentYear(nextYear);
    setCurrentMonth(nextMonth);
    fetchMonthDots(nextYear, nextMonth);
  };

  const resetToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    fetchMonthDots(now.getFullYear(), now.getMonth());
    resetFilter();
  };

  // 计算本月日历排布
  const firstDay = new Date(currentYear, currentMonth, 1);
  let startingDay = firstDay.getDay(); // 0 是周日
  startingDay = startingDay === 0 ? 6 : startingDay - 1; // 周一排首位 (0 - 6)

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  // 上月补齐格子
  const prevCells: number[] = [];
  for (let i = startingDay - 1; i >= 0; i--) {
    prevCells.push(prevMonthDays - i);
  }

  // 当月格子
  const monthCells: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    monthCells.push(d);
  }

  // 下月补齐格子 (保证填满最后一行)
  const totalRendered = startingDay + daysInMonth;
  const nextCellsCount = (7 - (totalRendered % 7)) % 7;
  const nextCells: number[] = [];
  for (let d = 1; d <= nextCellsCount; d++) {
    nextCells.push(d);
  }

  const subLabel = SEASONAL_LABELS[currentMonth] || `${currentYear}年 · 知行时令`;

  return (
    <div
      id="calendar-card"
      className="bg-white rounded-2xl p-3 border border-stone-200/90 shadow-sm overflow-hidden select-none h-[190px] xl:h-[200px] flex flex-col justify-between flex-shrink-0 transition-all duration-200"
    >
      {/* 日历头部与切换 */}
      <div className="flex items-center justify-between pb-1 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-center space-x-1.5">
          <div className="w-5 h-5 rounded-md bg-limeBrand/10 text-limeDark flex items-center justify-center">
            <Calendar className="w-3 h-3 text-limeBrand" />
          </div>
          <span className="font-serif font-bold text-xs text-stone-900 tracking-wide">
            {currentYear}年 {currentMonth + 1}月
          </span>
          {loading && <span className="w-1.5 h-1.5 rounded-full bg-limeBrand animate-ping" />}
        </div>

        <div className="flex items-center space-x-0.5">
          <button
            onClick={() => changeMonth(-1)}
            className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            title="上一月"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={resetToToday}
            className="px-1.5 py-0.5 rounded text-[9px] font-mono text-stone-500 hover:text-limeDark hover:bg-stone-100 transition cursor-pointer"
            title="返回今天"
          >
            今
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            title="下一月"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
          <button
            onClick={toggleSwapCards}
            className="p-1 rounded text-stone-300 hover:text-limeDark hover:bg-stone-100 transition ml-0.5 cursor-pointer"
            title="与右侧个人独白互换位置"
          >
            <ArrowLeftRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 节气与日期状态栏 */}
      <div className="flex items-center justify-between text-[9px] text-stone-500 font-serif py-0.5 border-b border-stone-100/70 flex-shrink-0">
        <span className="flex items-center gap-1 text-stone-600 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-limeBrand"></span>
          <span>{subLabel}</span>
        </span>
        <span className="font-mono text-stone-400 text-[9px]">
          耕耘 <span className="text-stone-700 font-bold">{daysCount}</span> 天
        </span>
      </div>

      {/* 星期标题行 (周一至周日) */}
      <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-serif text-stone-400 font-medium py-0.5 flex-shrink-0">
        <span>一</span>
        <span>二</span>
        <span>三</span>
        <span>四</span>
        <span>五</span>
        <span className="text-stone-500">六</span>
        <span className="text-limeDark font-semibold">日</span>
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-0.5 text-center flex-1 content-between">
        {/* 上月日期补齐 */}
        {prevCells.map((d, idx) => (
          <div
            key={`prev-${idx}`}
            className="py-0 text-[10px] font-mono text-stone-300 flex flex-col items-center justify-center h-4 xl:h-4.5 rounded cursor-default"
          >
            {d}
          </div>
        ))}

        {/* 当月日期 */}
        {monthCells.map((d) => {
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isToday = dateStr === todayDateStr;
          const articleCount = dots[dateStr] || 0;
          const hasArticle = articleCount > 0;
          const isSelected = filter.mode === 'date' && filter.date === dateStr;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => {
                if (hasArticle) {
                  filterByDate(dateStr);
                } else if (isSelected) {
                  resetFilter();
                }
              }}
              title={
                hasArticle
                  ? `${dateStr}：已沉淀 ${articleCount} 篇文卷 (点击查看)`
                  : isToday
                  ? `${dateStr} (今日)`
                  : dateStr
              }
              className={`relative py-0 text-[10px] font-mono flex flex-col items-center justify-center h-4 xl:h-4.5 rounded transition select-none cursor-pointer ${
                isSelected
                  ? 'bg-stone-900 text-white font-bold shadow-xs ring-1 ring-stone-900'
                  : isToday
                  ? 'bg-limeBrand text-white font-bold shadow-xs'
                  : hasArticle
                  ? 'font-bold text-stone-900 hover:bg-limeBrand/15'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span>{d}</span>
              {hasArticle && (
                <span
                  className={`w-1 h-1 rounded-full -mt-0.5 ${
                    isSelected ? 'bg-limeBrand' : isToday ? 'bg-white' : 'bg-limeBrand'
                  }`}
                />
              )}
            </button>
          );
        })}

        {/* 下月日期补齐 */}
        {nextCells.map((d, idx) => (
          <div
            key={`next-${idx}`}
            className="py-0 text-[10px] font-mono text-stone-300 flex flex-col items-center justify-center h-4 xl:h-4.5 rounded cursor-default"
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}
