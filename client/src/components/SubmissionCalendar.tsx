import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, ChevronLeft, ChevronRight, Clock, FileText } from "lucide-react";
import { format, addDays, addWeeks, addMonths, addQuarters, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from "date-fns";

interface SubmissionReminder {
  templateId: number;
  templateName: string;
  frequency: string;
  lastSubmissionDate: Date | null;
  nextDueDate: Date;
  status: 'upcoming' | 'due' | 'overdue';
  occurrenceIndex?: number;
}

interface SubmissionCalendarProps {
  userId: number;
  category: number;
}

export function SubmissionCalendar({ userId, category }: SubmissionCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get templates for user's category (API already filters by user's category)
  const { data: templates } = useQuery({
    queryKey: ["/api/templates/with-rules"],
    queryFn: async () => {
      const response = await fetch("/api/templates/with-rules");
      return response.json();
    },
  });

  // Get user's submissions to calculate last submission dates
  const { data: submissions } = useQuery({
    queryKey: ["/api/submissions", userId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("userId", userId.toString());
      const response = await fetch(`/api/submissions?${params}`);
      return response.json();
    },
  });

  // Calculate multiple recurring due dates for the current month view
  const calculateRecurringDates = (frequency: string, lastSubmissionDate: Date | null): Date[] => {
    const baseDate = lastSubmissionDate || new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const dates: Date[] = [];
    
    // Start from the last submission date or beginning of current month
    let currentDate = lastSubmissionDate ? new Date(baseDate) : new Date(monthStart);
    
    // If we have a last submission date, calculate the next due date
    if (lastSubmissionDate) {
      switch (frequency?.toLowerCase()) {
        case 'daily':
          currentDate = addDays(baseDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(baseDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(baseDate, 1);
          break;
        case 'quarterly':
          currentDate = addQuarters(baseDate, 1);
          break;
        case 'half_yearly':
          currentDate = addMonths(baseDate, 6);
          break;
        case 'yearly':
          currentDate = addMonths(baseDate, 12);
          break;
        default:
          currentDate = addMonths(baseDate, 1);
      }
    }
    
    // Generate recurring dates within the current month view
    while (currentDate <= monthEnd) {
      if (currentDate >= monthStart) {
        dates.push(new Date(currentDate));
      }
      
      // Add next occurrence based on frequency
      switch (frequency?.toLowerCase()) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        case 'quarterly':
          currentDate = addQuarters(currentDate, 1);
          break;
        case 'half_yearly':
          currentDate = addMonths(currentDate, 6);
          break;
        case 'yearly':
          currentDate = addMonths(currentDate, 12);
          break;
        default:
          currentDate = addMonths(currentDate, 1);
      }
      
      // Prevent infinite loop for very frequent occurrences
      if (frequency?.toLowerCase() === 'daily' && dates.length > 31) break;
      if (frequency?.toLowerCase() === 'weekly' && dates.length > 5) break;
    }
    
    return dates;
  };

  const getStatus = (dueDate: Date): 'upcoming' | 'due' | 'overdue' => {
    const today = new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return 'overdue';
    if (daysDiff <= 3) return 'due';
    return 'upcoming';
  };

  // Generate all recurring reminders for the current month
  const reminders: SubmissionReminder[] = templates?.flatMap((template: any) => {
    const lastSubmission = submissions?.find((s: any) => s.templateId === template.id);
    const lastSubmissionDate = lastSubmission ? parseISO(lastSubmission.createdAt) : null;
    const recurringDates = calculateRecurringDates(template.frequency, lastSubmissionDate);
    
    return recurringDates.map((dueDate, index) => ({
      templateId: template.id,
      templateName: template.name,
      frequency: template.frequency || 'monthly',
      lastSubmissionDate,
      nextDueDate: dueDate,
      status: getStatus(dueDate),
      occurrenceIndex: index, // To distinguish multiple occurrences
    }));
  }) || [];

  // Get days for calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get reminders for a specific day
  const getRemindersForDay = (date: Date) => {
    return reminders.filter(reminder => isSameDay(reminder.nextDueDate, date));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-gradient-to-r from-red-50/90 via-rose-50/80 to-pink-50/70 text-red-700 border-red-200/60 border-l-red-400 shadow-red-100/40';
      case 'due':
        return 'bg-gradient-to-r from-amber-50/90 via-yellow-50/80 to-orange-50/70 text-amber-700 border-amber-200/60 border-l-amber-400 shadow-amber-100/40';
      case 'upcoming':
        return 'bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-cyan-50/70 text-blue-700 border-blue-200/60 border-l-blue-400 shadow-blue-100/40';
      default:
        return 'bg-gradient-to-r from-slate-50/90 via-gray-50/80 to-zinc-50/70 text-slate-700 border-slate-200/60 border-l-slate-400 shadow-slate-100/40';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? addMonths(prev, -1) : addMonths(prev, 1)
    );
  };

  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Submission Calendar
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Calendar Header with gradient background */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="hover:bg-white/80 transition-all duration-200 shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="hover:bg-white/80 transition-all duration-200 shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Days of Week Header with beautiful gradient styling */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-slate-700 bg-gradient-to-br from-slate-100/80 via-blue-50/40 to-indigo-50/30 rounded-lg border border-slate-200/50 shadow-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid with modern styling and responsive design */}
          <div className="grid grid-cols-7 gap-2 lg:gap-3">
            {calendarDays.map(day => {
              const dayReminders = getRemindersForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isDayToday = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] lg:min-h-[120px] p-2 lg:p-3 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group cursor-pointer ${
                    isCurrentMonth 
                      ? 'bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 border-blue-200/50 hover:border-blue-400/60 hover:bg-gradient-to-br hover:from-blue-50/40 hover:via-indigo-50/30 hover:to-purple-50/20 hover:shadow-blue-100/50' 
                      : 'bg-gradient-to-br from-slate-50/70 via-gray-50/50 to-stone-50/60 border-slate-200/50 hover:border-slate-300/60 hover:bg-gradient-to-br hover:from-slate-100/50 hover:via-gray-100/40 hover:to-stone-100/30'
                  } ${isDayToday ? 'ring-2 ring-blue-400 ring-offset-2 bg-gradient-to-br from-blue-100/80 via-indigo-100/60 to-purple-100/40 border-blue-400/70 shadow-lg shadow-blue-200/30' : ''}`}
                >
                  <div className={`text-sm mb-2 flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${
                    isDayToday 
                      ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white font-bold shadow-lg shadow-blue-300/50' 
                      : isCurrentMonth 
                        ? 'text-slate-800 group-hover:text-blue-600 group-hover:bg-gradient-to-r group-hover:from-blue-100/80 group-hover:to-indigo-100/60 group-hover:font-semibold group-hover:shadow-sm' 
                        : 'text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-100/50'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  {dayReminders.length > 0 && (
                    <div className="space-y-1.5">
                      {dayReminders.slice(0, 2).map((reminder, index) => (
                        <div
                          key={`${reminder.templateId}-${reminder.occurrenceIndex || 0}-${index}`}
                          className={`text-xs p-2 rounded-lg shadow-sm border-l-4 transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${getStatusColor(reminder.status)}`}
                          title={`${reminder.templateName} - ${reminder.frequency}`}
                        >
                          <div className="truncate font-semibold">{reminder.templateName}</div>
                          <div className="text-[10px] opacity-80 mt-0.5">{reminder.frequency}</div>
                        </div>
                      ))}
                      {dayReminders.length > 2 && (
                        <div className="text-xs text-slate-600 font-medium bg-gradient-to-r from-slate-100/80 via-gray-100/60 to-zinc-100/50 rounded-lg p-1.5 text-center shadow-sm border border-slate-200/50">
                          +{dayReminders.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Reminders Summary with enhanced design */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Upcoming Submissions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {reminders.length === 0 ? (
            <Alert className="border-dashed border-2 border-gray-300 bg-gray-50/50">
              <AlertDescription className="text-center py-4">
                <div className="text-gray-500 mb-2">📋</div>
                <div className="font-medium text-gray-700">No templates found for your category</div>
                <div className="text-sm text-gray-500 mt-1">
                  Contact your administrator to set up submission templates.
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {reminders
                .sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime())
                .slice(0, 5)
                .map((reminder, index) => (
                  <div
                    key={`${reminder.templateId}-${reminder.occurrenceIndex || 0}-${index}`}
                    className="group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        reminder.status === 'overdue' 
                          ? 'bg-red-100 text-red-600' 
                          : reminder.status === 'due'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-blue-100 text-blue-600'
                      }`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                          {reminder.templateName}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <span className="capitalize">{reminder.frequency}</span> submission • 
                          <span className="font-medium">Due {format(reminder.nextDueDate, 'MMM d, yyyy')}</span>
                        </div>
                        {reminder.lastSubmissionDate && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            Last submitted: {format(reminder.lastSubmissionDate, 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant={reminder.status === 'overdue' ? 'destructive' : 
                              reminder.status === 'due' ? 'secondary' : 'outline'}
                      className="px-3 py-1 font-medium capitalize shadow-sm"
                    >
                      {reminder.status}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}