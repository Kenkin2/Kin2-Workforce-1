import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Plus, Edit, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';

interface MobileCalendarProps {
  shifts: any[];
  onCreateShift: (date: Date, time: string) => void;
  onEditShift: (shift: any) => void;
  onDeleteShift: (shiftId: string) => void;
  isLoading: boolean;
}

const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00'
];

export default function MobileCalendar({ 
  shifts, 
  onCreateShift, 
  onEditShift, 
  onDeleteShift, 
  isLoading 
}: MobileCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [draggedShift, setDraggedShift] = useState<any>(null);
  const [dropTarget, setDropTarget] = useState<{ date: Date; time: string } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getShiftsForDateTime = (date: Date, time: string) => {
    return shifts.filter(shift => {
      const shiftStart = parseISO(shift.startTime);
      const shiftHour = format(shiftStart, 'HH:mm');
      return isSameDay(shiftStart, date) && shiftHour === time;
    });
  };

  const handleTouchStart = (e: React.TouchEvent, shift: any) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    setDraggedShift(shift);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedShift || !touchStartRef.current) return;
    
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropSlot = element?.closest('[data-drop-target]');
    
    if (dropSlot) {
      const date = new Date(dropSlot.getAttribute('data-date') || '');
      const time = dropSlot.getAttribute('data-time') || '';
      setDropTarget({ date, time });
    } else {
      setDropTarget(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!draggedShift || !touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const timeDiff = Date.now() - touchStartRef.current.time;
    const distance = Math.sqrt(
      Math.pow(touch.clientX - touchStartRef.current.x, 2) +
      Math.pow(touch.clientY - touchStartRef.current.y, 2)
    );

    // If it's a short tap (< 300ms) and small movement (< 10px), treat as click
    if (timeDiff < 300 && distance < 10) {
      setSelectedShift(draggedShift);
    } else if (dropTarget) {
      // Handle the drop
      handleShiftDrop(draggedShift, dropTarget);
    }

    // Reset drag state
    setDraggedShift(null);
    setDropTarget(null);
    touchStartRef.current = null;
  };

  const handleShiftDrop = (shift: any, target: { date: Date; time: string }) => {
    const newStartTime = new Date(target.date);
    const [hours, minutes] = target.time.split(':').map(Number);
    newStartTime.setHours(hours, minutes, 0, 0);
    
    // Calculate duration and set end time
    const originalStart = parseISO(shift.startTime);
    const originalEnd = parseISO(shift.endTime);
    const duration = originalEnd.getTime() - originalStart.getTime();
    const newEndTime = new Date(newStartTime.getTime() + duration);

    // Update the shift (this would call an API endpoint)
    onEditShift({
      ...shift,
      startTime: newStartTime.toISOString(),
      endTime: newEndTime.toISOString()
    });
  };

  return (
    <div className="mobile-calendar md:hidden">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 py-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
          data-testid="button-prev-week-mobile"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="text-center">
          <div className="font-semibold">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
          data-testid="button-next-week-mobile"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Daily View - Scrollable */}
      <div className="space-y-4">
        {weekDays.map((date, dayIndex) => (
          <Card key={dayIndex}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{format(date, 'EEEE')}</h4>
                  <p className="text-sm text-muted-foreground">{format(date, 'MMM d')}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCreateShift(date, '09:00')}
                  data-testid={`button-add-shift-${dayIndex}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Time Slots for this day */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {TIME_SLOTS.map((time) => {
                  const dayShifts = getShiftsForDateTime(date, time);
                  
                  return (
                    <div
                      key={time}
                      className={`min-h-12 p-2 rounded border-2 border-dashed transition-colors ${
                        dropTarget && 
                        isSameDay(dropTarget.date, date) && 
                        dropTarget.time === time
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      data-drop-target="true"
                      data-date={date.toISOString()}
                      data-time={time}
                      onClick={() => dayShifts.length === 0 && onCreateShift(date, time)}
                    >
                      <div className="text-xs text-muted-foreground mb-1">{time}</div>
                      
                      {dayShifts.length === 0 ? (
                        <div className="text-xs text-center text-muted-foreground py-2">
                          Tap to add shift
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {dayShifts.map((shift) => (
                            <div
                              key={shift.id}
                              className={`p-2 rounded border text-xs cursor-pointer select-none transition-transform ${
                                draggedShift?.id === shift.id ? 'scale-95 opacity-50' : 'hover:scale-105'
                              } ${
                                shift.status === 'published' ? 'bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800' :
                                shift.status === 'assigned' ? 'bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800' :
                                'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                              }`}
                              onTouchStart={(e) => handleTouchStart(e, shift)}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                              data-testid={`shift-mobile-${shift.id}`}
                            >
                              <div className="font-medium truncate">{shift.title}</div>
                              <div className="text-muted-foreground">
                                {format(parseISO(shift.startTime), 'HH:mm')} - {format(parseISO(shift.endTime), 'HH:mm')}
                              </div>
                              {shift.workerId && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  Assigned
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Shift Details Modal */}
      <Dialog open={!!selectedShift} onOpenChange={() => setSelectedShift(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              {selectedShift?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedShift && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Date:</strong> {format(parseISO(selectedShift.startTime), 'MMM d, yyyy')}
                </div>
                <div>
                  <strong>Time:</strong> {format(parseISO(selectedShift.startTime), 'HH:mm')} - {format(parseISO(selectedShift.endTime), 'HH:mm')}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <Badge className="ml-2" variant={
                    selectedShift.status === 'published' ? 'default' :
                    selectedShift.status === 'assigned' ? 'secondary' : 'outline'
                  }>
                    {selectedShift.status}
                  </Badge>
                </div>
                <div>
                  <strong>Rate:</strong> ${selectedShift.hourlyRate}/hr
                </div>
              </div>
              
              {selectedShift.location && (
                <div>
                  <strong>Location:</strong> {selectedShift.location}
                </div>
              )}
              
              {selectedShift.requirements && (
                <div>
                  <strong>Requirements:</strong> {selectedShift.requirements}
                </div>
              )}
              
              <div className="flex space-x-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => {
                    onEditShift(selectedShift);
                    setSelectedShift(null);
                  }}
                  data-testid="button-edit-shift-mobile"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Shift
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    onDeleteShift(selectedShift.id);
                    setSelectedShift(null);
                  }}
                  data-testid="button-delete-shift-mobile"
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Loading overlay for mobile */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading schedule...</p>
          </div>
        </div>
      )}

      {/* Drag indicator */}
      {draggedShift && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
          Moving: {draggedShift.title}
        </div>
      )}
    </div>
  );
}