import React from 'react';
import { useStore } from '@nanostores/react';
import { $isSwapped } from '../stores/filterStore';
import CalendarCard from './CalendarCard';
import MonologueCard from './MonologueCard';
import type { AuthorProfile } from '../services/blogService';

interface TopSlotCardProps {
  slotPosition: 'left' | 'right';
  authorProfile?: Partial<AuthorProfile>;
  calendarDots?: Record<string, number>;
  daysCount?: number;
}

export default function TopSlotCard({
  slotPosition,
  authorProfile = {},
  calendarDots = {},
  daysCount = 430,
}: TopSlotCardProps) {
  const isSwapped = useStore($isSwapped);

  // 当 slotPosition 为 'left' 且未对调，或者为 'right' 且已对调时，渲染日历卡片
  const showCalendar = (slotPosition === 'left' && !isSwapped) || (slotPosition === 'right' && isSwapped);

  if (showCalendar) {
    return (
      <CalendarCard
        initialDots={calendarDots}
        daysCount={daysCount}
      />
    );
  }

  return <MonologueCard profile={authorProfile} />;
}
