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
}

interface SubmissionCalendarProps {
  userId: number;
  category: string;
}

export function SubmissionCalendar({ userId, category }: SubmissionCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get templates for user's category
  const { data: templates } = useQuery({
    queryKey: ["/api/templates", category],
    queryFn: async () => {
      const response = await fetch("/api/templates/with-rules");
      const allTemplates = await response.json();
      return allTemplates.filter((t: any) => t.category === category);
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

  // Calculate submission reminders
  const calculateNextDueDate = (frequency: string, lastSubmissionDate: Date | null): Date => {
    const baseDate = lastSubmissionDate || new Date();
    
    switch (frequency?.toLowerCase()) {
      case 'weekly':
        return addWeeks(baseDate, 1);
      case 'monthly':
        return addMonths(baseDate, 1);
      case 'quarterly':
        return addQuarters(baseDate, 1);
      case 'yearly':
        return addMonths(baseDate, 12);
      default:
        return addMonths(baseDate, 1); // Default to monthly
    }
  };

  const getStatus = (dueDate: Date): 'upcoming' | 'due' | 'overdue' => {
    const today = new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return 'overdue';
    if (daysDiff <= 3) return 'due';
    return 'upcoming';
  };

  const reminders: SubmissionReminder[] = templates?.map((template: any) => {
    const lastSubmission = submissions?.find((s: any) => s.templateId === template.id);
    const lastSubmissionDate = lastSubmission ? parseISO(lastSubmission.createdAt) : null;
    const nextDueDate = calculateNextDueDate(template.frequency, lastSubmissionDate);
    
    return {
      templateId: template.id,
      templateName: template.name,
      frequency: template.frequency || 'monthly',
      lastSubmissionDate,
      nextDueDate,
      status: getStatus(nextDueDate),
    };
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
        return 'bg-red-100 text-red-800 border-red-200';
      case 'due':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? addMonths(prev, -1) : addMonths(prev, 1)
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Submission Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const dayReminders = getRemindersForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isDayToday = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[80px] p-1 border rounded-lg ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isDayToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className={`text-sm ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'} ${isDayToday ? 'font-bold' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  {dayReminders.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayReminders.slice(0, 2).map(reminder => (
                        <div
                          key={reminder.templateId}
                          className={`text-xs p-1 rounded border ${getStatusColor(reminder.status)}`}
                          title={`${reminder.templateName} - ${reminder.frequency}`}
                        >
                          <div className="truncate">{reminder.templateName}</div>
                        </div>
                      ))}
                      {dayReminders.length > 2 && (
                        <div className="text-xs text-gray-500">
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

      {/* Upcoming Reminders Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <Alert>
              <AlertDescription>
                No templates found for your category. Contact your administrator to set up submission templates.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {reminders
                .sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime())
                .slice(0, 5)
                .map(reminder => (
                  <div
                    key={reminder.templateId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="font-medium">{reminder.templateName}</div>
                        <div className="text-sm text-gray-600">
                          {reminder.frequency} submission • Due {format(reminder.nextDueDate, 'MMM d, yyyy')}
                        </div>
                        {reminder.lastSubmissionDate && (
                          <div className="text-xs text-gray-500">
                            Last submitted: {format(reminder.lastSubmissionDate, 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant={reminder.status === 'overdue' ? 'destructive' : 
                                  reminder.status === 'due' ? 'secondary' : 'outline'}>
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