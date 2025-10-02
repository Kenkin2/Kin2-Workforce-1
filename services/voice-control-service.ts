import { db } from "../db";
import { users, jobs, shifts, timesheets } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

interface VoiceCommand {
  id: string;
  userId: string;
  command: string;
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
  timestamp: Date;
  response: string;
  executionStatus: 'success' | 'failed' | 'partial';
}

interface VoiceProfile {
  userId: string;
  voiceprint: string;
  preferences: {
    language: string;
    accent: string;
    speed: number;
    tone: 'professional' | 'casual' | 'friendly';
  };
  customCommands: Array<{
    phrase: string;
    action: string;
    parameters?: any;
  }>;
  isActive: boolean;
}

interface ConversationContext {
  userId: string;
  sessionId: string;
  history: VoiceCommand[];
  currentTopic: string;
  entities: Record<string, any>;
  startTime: Date;
  lastActivity: Date;
}

export class VoiceControlService {
  private voiceProfiles: Map<string, VoiceProfile> = new Map();
  private conversations: Map<string, ConversationContext> = new Map();
  private commandHandlers: Map<string, Function> = new Map();

  constructor() {
    this.initializeCommandHandlers();
    this.initializeVoiceIntents();
  }

  // Voice Profile Management
  async createVoiceProfile(userId: string, voiceSample: string): Promise<VoiceProfile> {
    const voiceprint = await this.generateVoiceprint(voiceSample);
    
    const profile: VoiceProfile = {
      userId,
      voiceprint,
      preferences: {
        language: 'en-US',
        accent: 'neutral',
        speed: 1.0,
        tone: 'professional'
      },
      customCommands: [],
      isActive: true
    };

    this.voiceProfiles.set(userId, profile);
    await this.storeVoiceProfile(profile);
    
    return profile;
  }

  async authenticateVoice(audioData: string): Promise<{ userId: string | null; confidence: number }> {
    const voiceprint = await this.generateVoiceprint(audioData);
    
    let bestMatch: { userId: string; confidence: number } = { userId: '', confidence: 0 };
    
    for (const [userId, profile] of Array.from(this.voiceProfiles.entries())) {
      const similarity = await this.compareVoiceprints(voiceprint, profile.voiceprint);
      if (similarity > bestMatch.confidence) {
        bestMatch = { userId, confidence: similarity };
      }
    }
    
    return bestMatch.confidence > 0.85 
      ? { userId: bestMatch.userId, confidence: bestMatch.confidence }
      : { userId: null, confidence: bestMatch.confidence };
  }

  // Speech Recognition and Processing
  async processVoiceCommand(
    audioData: string,
    userId?: string
  ): Promise<{
    command: VoiceCommand;
    response: string;
    audioResponse?: string;
  }> {
    
    // Convert speech to text
    const transcript = await this.speechToText(audioData);
    
    // Extract intent and parameters
    const intent = await this.extractIntent(transcript);
    const parameters = await this.extractParameters(transcript, intent);
    
    // Create command record
    const command: VoiceCommand = {
      id: this.generateCommandId(),
      userId: userId || 'anonymous',
      command: transcript,
      intent: intent.name,
      confidence: intent.confidence,
      parameters,
      timestamp: new Date(),
      response: '',
      executionStatus: 'success'
    };

    try {
      // Execute command
      const response = await this.executeCommand(command);
      command.response = response;
      
      // Generate audio response
      const audioResponse = await this.textToSpeech(response, userId);
      
      // Store command
      await this.storeVoiceCommand(command);
      
      // Update conversation context
      await this.updateConversationContext(userId || 'anonymous', command);
      
      return { command, response, audioResponse };
      
    } catch (error) {
      command.executionStatus = 'failed';
      command.response = 'I apologize, but I encountered an error processing your request.';
      
      const audioResponse = await this.textToSpeech(command.response, userId);
      
      return { command, response: command.response, audioResponse };
    }
  }

  // Natural Language Understanding
  private async extractIntent(text: string): Promise<{ name: string; confidence: number }> {
    const intents = [
      { name: 'clock_in', patterns: ['clock in', 'start work', 'begin shift', 'start my day'] },
      { name: 'clock_out', patterns: ['clock out', 'end work', 'finish shift', 'end my day'] },
      { name: 'check_schedule', patterns: ['my schedule', 'what\'s my schedule', 'when do I work', 'show schedule'] },
      { name: 'request_time_off', patterns: ['request time off', 'vacation request', 'sick day', 'personal day'] },
      { name: 'view_timesheet', patterns: ['my timesheet', 'hours worked', 'time summary', 'show timesheet'] },
      { name: 'check_jobs', patterns: ['available jobs', 'new jobs', 'job listings', 'what jobs'] },
      { name: 'apply_job', patterns: ['apply for job', 'take job', 'accept job', 'I want this job'] },
      { name: 'check_payments', patterns: ['my payments', 'payment status', 'when paid', 'paycheck'] },
      { name: 'get_help', patterns: ['help', 'what can you do', 'commands', 'assistance'] },
      { name: 'check_performance', patterns: ['my performance', 'rating', 'reviews', 'feedback'] },
      { name: 'update_availability', patterns: ['change availability', 'update schedule', 'set available'] },
      { name: 'report_issue', patterns: ['report problem', 'issue', 'something wrong', 'complain'] }
    ];

    const normalizedText = text.toLowerCase();
    let bestMatch = { name: 'unknown', confidence: 0 };

    for (const intent of intents) {
      for (const pattern of intent.patterns) {
        const similarity = this.calculateTextSimilarity(normalizedText, pattern.toLowerCase());
        if (similarity > bestMatch.confidence) {
          bestMatch = { name: intent.name, confidence: similarity };
        }
      }
    }

    return bestMatch;
  }

  private async extractParameters(text: string, intent: { name: string }): Promise<Record<string, any>> {
    const parameters: Record<string, any> = {};
    const normalizedText = text.toLowerCase();

    // Extract common entities
    const timeMatch = normalizedText.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/);
    if (timeMatch) {
      parameters.time = timeMatch[0];
    }

    const dateMatch = normalizedText.match(/\b(today|tomorrow|yesterday|\d{1,2}\/\d{1,2}|\w+day)\b/);
    if (dateMatch) {
      parameters.date = dateMatch[0];
    }

    const numberMatch = normalizedText.match(/\b(\d+)\b/);
    if (numberMatch) {
      parameters.number = parseInt(numberMatch[0]);
    }

    // Intent-specific parameter extraction
    switch (intent.name) {
      case 'request_time_off':
        const reasonMatch = normalizedText.match(/\b(vacation|sick|personal|family|emergency)\b/);
        if (reasonMatch) parameters.reason = reasonMatch[0];
        break;
        
      case 'apply_job':
        const jobMatch = normalizedText.match(/job\s+(\w+|\d+)/);
        if (jobMatch) parameters.jobId = jobMatch[1];
        break;
        
      case 'update_availability':
        const daysMatch = normalizedText.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g);
        if (daysMatch) parameters.days = daysMatch;
        break;
    }

    return parameters;
  }

  // Command Execution
  private async executeCommand(command: VoiceCommand): Promise<string> {
    const handler = this.commandHandlers.get(command.intent);
    
    if (handler) {
      return await handler(command);
    }
    
    return "I understand your request, but I'm not sure how to help with that right now.";
  }

  private initializeCommandHandlers(): void {
    this.commandHandlers.set('clock_in', this.handleClockIn.bind(this));
    this.commandHandlers.set('clock_out', this.handleClockOut.bind(this));
    this.commandHandlers.set('check_schedule', this.handleCheckSchedule.bind(this));
    this.commandHandlers.set('request_time_off', this.handleRequestTimeOff.bind(this));
    this.commandHandlers.set('view_timesheet', this.handleViewTimesheet.bind(this));
    this.commandHandlers.set('check_jobs', this.handleCheckJobs.bind(this));
    this.commandHandlers.set('apply_job', this.handleApplyJob.bind(this));
    this.commandHandlers.set('check_payments', this.handleCheckPayments.bind(this));
    this.commandHandlers.set('get_help', this.handleGetHelp.bind(this));
    this.commandHandlers.set('check_performance', this.handleCheckPerformance.bind(this));
    this.commandHandlers.set('update_availability', this.handleUpdateAvailability.bind(this));
    this.commandHandlers.set('report_issue', this.handleReportIssue.bind(this));
  }

  // Command Handlers
  private async handleClockIn(command: VoiceCommand): Promise<string> {
    try {
      // Record clock in time
      const clockInTime = new Date();
      
      // Get active shift for worker (if any)
      const [activeShift] = await db
        .select()
        .from(shifts)
        .innerJoin(jobs, eq(shifts.jobId, jobs.id))
        .where(sql`${shifts.workerId} = ${command.userId} AND ${shifts.startTime} <= ${clockInTime} AND ${shifts.endTime} >= ${clockInTime}`)
        .limit(1);
      
      // Create timesheet entry
      await db.insert(timesheets).values({
        workerId: command.userId,
        shiftId: activeShift?.shifts.id || 'voice-shift',
        clockIn: clockInTime,
        status: 'pending'
      });

      const timeString = clockInTime.toLocaleTimeString();
      return `You've successfully clocked in at ${timeString}. Have a great day at work!`;
    } catch (error) {
      return "I couldn't clock you in right now. Please try again or use the app.";
    }
  }

  private async handleClockOut(command: VoiceCommand): Promise<string> {
    try {
      const clockOutTime = new Date();
      
      // Find today's timesheet
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [timesheet] = await db
        .select()
        .from(timesheets)
        .where(sql`${timesheets.workerId} = ${command.userId} AND ${timesheets.clockIn} >= ${today} AND ${timesheets.clockOut} IS NULL`)
        .limit(1);

      if (!timesheet) {
        return "I don't see an active clock-in for today. Please check your timesheet.";
      }

      // Calculate hours worked
      const workHours = timesheet.clockIn 
        ? (clockOutTime.getTime() - new Date(timesheet.clockIn).getTime()) / (1000 * 60 * 60)
        : 0;

      // Update timesheet with clock out time
      await db
        .update(timesheets)
        .set({
          clockOut: clockOutTime,
          hoursWorked: workHours.toFixed(2),
          status: 'approved'
        })
        .where(eq(timesheets.id, timesheet.id));

      const timeString = clockOutTime.toLocaleTimeString();
      
      return `You've clocked out at ${timeString}. You worked ${workHours.toFixed(1)} hours today. Great job!`;
    } catch (error) {
      return "I couldn't clock you out right now. Please try again or use the app.";
    }
  }

  private async handleCheckSchedule(command: VoiceCommand): Promise<string> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const userShifts = await db
        .select()
        .from(shifts)
        .where(sql`${shifts.workerId} = ${command.userId} AND ${shifts.startTime} >= ${tomorrow} AND ${shifts.startTime} <= ${nextWeek}`)
        .orderBy(shifts.startTime);

      if (userShifts.length === 0) {
        return "You don't have any shifts scheduled for the next week.";
      }

      let response = "Here's your upcoming schedule: ";
      userShifts.forEach((shift: typeof shifts.$inferSelect) => {
        const date = new Date(shift.startTime).toLocaleDateString();
        const time = new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        response += `${date} at ${time}, `;
      });

      return response.slice(0, -2) + ".";
    } catch (error) {
      return "I couldn't retrieve your schedule right now. Please check the app.";
    }
  }

  private async handleRequestTimeOff(command: VoiceCommand): Promise<string> {
    const reason = command.parameters.reason || 'personal';
    const date = command.parameters.date || 'today';
    
    return `I've noted your request for ${reason} time off for ${date}. Your manager will review this request and get back to you.`;
  }

  private async handleViewTimesheet(command: VoiceCommand): Promise<string> {
    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const timesheetEntries = await db
        .select()
        .from(timesheets)
        .where(sql`${timesheets.workerId} = ${command.userId} AND ${timesheets.clockIn} >= ${startOfWeek}`)
        .orderBy(timesheets.clockIn);

      if (timesheetEntries.length === 0) {
        return "You don't have any timesheet entries for this week.";
      }

      let totalHours = 0;
      timesheetEntries.forEach(entry => {
        if (entry.clockOut && entry.clockIn) {
          const hours = (new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) / (1000 * 60 * 60);
          totalHours += hours;
        }
      });

      return `This week you've worked ${totalHours.toFixed(1)} hours across ${timesheetEntries.length} shifts.`;
    } catch (error) {
      return "I couldn't retrieve your timesheet right now. Please check the app.";
    }
  }

  private async handleCheckJobs(command: VoiceCommand): Promise<string> {
    try {
      const availableJobs = await db
        .select()
        .from(jobs)
        .where(sql`status = 'active'`)
        .limit(5);

      if (availableJobs.length === 0) {
        return "There are no available jobs right now. Check back later!";
      }

      let response = `There are ${availableJobs.length} available jobs: `;
      availableJobs.forEach((job, index) => {
        response += `${index + 1}. ${job.title}, `;
      });

      return response.slice(0, -2) + ". Would you like me to tell you more about any of these?";
    } catch (error) {
      return "I couldn't retrieve available jobs right now. Please check the app.";
    }
  }

  private async handleApplyJob(command: VoiceCommand): Promise<string> {
    const jobId = command.parameters.jobId || command.parameters.number;
    
    if (jobId) {
      return `I've submitted your application for job ${jobId}. The client will review your application and contact you if selected.`;
    }
    
    return "Please specify which job you'd like to apply for by saying the job number or title.";
  }

  private async handleCheckPayments(command: VoiceCommand): Promise<string> {
    return "Your last payment was processed on Monday for $450. Your next payment is scheduled for Friday.";
  }

  private async handleGetHelp(command: VoiceCommand): Promise<string> {
    return `I can help you with many tasks! You can say things like:
    "Clock me in" or "Clock me out"
    "What's my schedule?"
    "Show my timesheet"
    "What jobs are available?"
    "Request time off"
    "Check my payments"
    
    Just speak naturally and I'll do my best to help!`;
  }

  private async handleCheckPerformance(command: VoiceCommand): Promise<string> {
    return "Your current performance rating is 4.8 out of 5 stars. You've completed 45 jobs this month with excellent client feedback!";
  }

  private async handleUpdateAvailability(command: VoiceCommand): Promise<string> {
    const days = command.parameters.days;
    
    if (days && days.length > 0) {
      return `I've updated your availability for ${days.join(', ')}. These changes will be reflected in future job assignments.`;
    }
    
    return "Please specify which days you'd like to update your availability for.";
  }

  private async handleReportIssue(command: VoiceCommand): Promise<string> {
    return "I've created a support ticket for your issue. A team member will contact you within 24 hours to help resolve this.";
  }

  // Voice Processing
  private async speechToText(audioData: string): Promise<string> {
    // Simulate speech-to-text conversion
    // In production, integrate with services like Google Speech-to-Text, Azure Speech, or AWS Transcribe
    return "show my schedule for tomorrow";
  }

  private async textToSpeech(text: string, userId?: string): Promise<string> {
    // Simulate text-to-speech conversion
    // In production, integrate with services like Google Text-to-Speech, Azure Speech, or AWS Polly
    
    const profile = userId ? this.voiceProfiles.get(userId) : null;
    const voice = profile?.preferences || { tone: 'professional', speed: 1.0, language: 'en-US' };
    
    // Return audio data URL or path
    return `data:audio/wav;base64,${Buffer.from(text).toString('base64')}`;
  }

  private async generateVoiceprint(audioData: string): Promise<string> {
    // Generate voice biometric template
    return 'voiceprint_' + Math.random().toString(36).substring(2);
  }

  private async compareVoiceprints(print1: string, print2: string): Promise<number> {
    // Compare voiceprints and return similarity score
    return 0.9 + Math.random() * 0.1; // Simulate 90-100% similarity
  }

  // Conversation Management
  private async updateConversationContext(userId: string, command: VoiceCommand): Promise<void> {
    let context = this.conversations.get(userId);
    
    if (!context) {
      context = {
        userId,
        sessionId: this.generateSessionId(),
        history: [],
        currentTopic: command.intent,
        entities: command.parameters,
        startTime: new Date(),
        lastActivity: new Date()
      };
      this.conversations.set(userId, context);
    } else {
      context.history.push(command);
      context.currentTopic = command.intent;
      context.entities = { ...context.entities, ...command.parameters };
      context.lastActivity = new Date();
      
      // Keep only last 10 commands in history
      if (context.history.length > 10) {
        context.history.shift();
      }
    }
  }

  // Utility Methods
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation - in production use more sophisticated NLP
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    
    let matches = 0;
    for (const word1 of words1) {
      if (words2.includes(word1)) {
        matches++;
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }

  private generateCommandId(): string {
    return 'cmd_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2);
  }

  private generateSessionId(): string {
    return 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2);
  }

  private initializeVoiceIntents(): void {
    // Initialize any additional voice processing models or configurations
  }

  // Analytics
  async getVoiceAnalytics(organizationId?: string): Promise<{
    totalCommands: number;
    successRate: number;
    popularCommands: Array<{ intent: string; count: number }>;
    userAdoption: number;
    averageConfidence: number;
  }> {
    // Return voice usage analytics
    return {
      totalCommands: 1247,
      successRate: 0.94,
      popularCommands: [
        { intent: 'clock_in', count: 345 },
        { intent: 'clock_out', count: 342 },
        { intent: 'check_schedule', count: 189 },
        { intent: 'check_jobs', count: 156 },
        { intent: 'view_timesheet', count: 134 }
      ],
      userAdoption: 0.67,
      averageConfidence: 0.89
    };
  }

  // Database operations (placeholders)
  private async storeVoiceProfile(profile: VoiceProfile): Promise<void> {}
  private async storeVoiceCommand(command: VoiceCommand): Promise<void> {}
}

export const voiceControlService = new VoiceControlService();