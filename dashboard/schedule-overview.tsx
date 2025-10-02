import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function ScheduleOverview() {
  const scheduleData = [
    { day: "Monday", shifts: 8 },
    { day: "Tuesday", shifts: 12 },
    { day: "Wednesday", shifts: 6 },
    { day: "Thursday", shifts: 10 },
    { day: "Friday", shifts: 15 },
  ];

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">This Week's Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scheduleData.map((item) => (
            <div key={item.day} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.day}</span>
              <span className="text-sm font-medium text-foreground" data-testid={`schedule-${item.day.toLowerCase()}`}>
                {item.shifts} shifts
              </span>
            </div>
          ))}
        </div>
        <Link href="/schedule">
          <Button 
            variant="outline" 
            className="w-full mt-4 text-sm text-primary hover:text-primary/80 font-medium border border-primary/20 hover:bg-primary/5 transition-colors"
            data-testid="button-view-full-calendar"
          >
            View Full Calendar
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
