import { db } from "../db";
import { payrollRecords, workerTaxInfo, timesheets, shifts, users } from "@shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";

interface TaxCalculation {
  grossPay: number;
  taxDeduction: number;
  niDeduction: number;
  pensionDeduction: number;
  studentLoanDeduction: number;
  netPay: number;
}

interface PayrollSummary {
  workerId: string;
  workerName: string;
  grossPay: number;
  taxDeduction: number;
  niDeduction: number;
  pensionDeduction: number;
  otherDeductions: number;
  netPay: number;
  hoursWorked: number;
  taxCode: string;
  niNumber?: string;
}

export class PayrollService {
  // UK Tax bands for 2024-25 tax year
  private readonly TAX_BANDS = [
    { min: 0, max: 12570, rate: 0 }, // Personal Allowance
    { min: 12570, max: 50270, rate: 0.20 }, // Basic rate
    { min: 50270, max: 125140, rate: 0.40 }, // Higher rate
    { min: 125140, max: Infinity, rate: 0.45 }, // Additional rate
  ];

  // UK National Insurance bands for 2024-25
  private readonly NI_BANDS = [
    { min: 0, max: 12570, rate: 0 }, // Primary threshold
    { min: 12570, max: 50270, rate: 0.12 }, // Main rate
    { min: 50270, max: Infinity, rate: 0.02 }, // Upper rate
  ];

  // Student loan repayment rates
  private readonly STUDENT_LOAN_RATES = {
    "1": { threshold: 22015, rate: 0.09 },
    "2": { threshold: 27295, rate: 0.09 },
    "4": { threshold: 27660, rate: 0.09 },
    "postgrad": { threshold: 21000, rate: 0.06 }
  };

  /**
   * Calculate annual tax liability
   */
  private calculateTax(annualGross: number, taxCode: string = "1257L"): number {
    // Parse tax code - most common format is ####L
    const allowanceMatch = taxCode.match(/^(\d+)[LMTXY]?$/);
    const personalAllowance = allowanceMatch ? parseInt(allowanceMatch[1]) * 10 : 12570;
    
    const taxableIncome = Math.max(0, annualGross - personalAllowance);
    let tax = 0;

    for (const band of this.TAX_BANDS) {
      if (taxableIncome <= band.min) break;
      
      const taxableAtThisBand = Math.min(taxableIncome, band.max) - band.min;
      tax += taxableAtThisBand * band.rate;
    }

    return Math.round(tax * 100) / 100;
  }

  /**
   * Calculate annual National Insurance contribution
   */
  private calculateNI(annualGross: number): number {
    let ni = 0;

    for (const band of this.NI_BANDS) {
      if (annualGross <= band.min) break;
      
      const niableAtThisBand = Math.min(annualGross, band.max) - band.min;
      ni += niableAtThisBand * band.rate;
    }

    return Math.round(ni * 100) / 100;
  }

  /**
   * Calculate student loan repayment
   */
  private calculateStudentLoan(annualGross: number, plan?: string): number {
    if (!plan || !(plan in this.STUDENT_LOAN_RATES)) return 0;
    
    const { threshold, rate } = this.STUDENT_LOAN_RATES[plan as keyof typeof this.STUDENT_LOAN_RATES];
    const repayableIncome = Math.max(0, annualGross - threshold);
    
    return Math.round(repayableIncome * rate * 100) / 100;
  }

  /**
   * Calculate pension contribution
   */
  private calculatePension(grossPay: number, pensionRate: number): number {
    return Math.round(grossPay * (pensionRate / 100) * 100) / 100;
  }

  /**
   * Calculate monthly tax and deductions from annual figures
   */
  calculateMonthlyDeductions(
    monthlyGross: number, 
    taxInfo: any
  ): TaxCalculation {
    // Annualize for tax calculation
    const annualGross = monthlyGross * 12;
    
    // Calculate annual deductions
    const annualTax = this.calculateTax(annualGross, taxInfo.taxCode || "1257L");
    const annualNI = this.calculateNI(annualGross);
    const annualStudentLoan = this.calculateStudentLoan(annualGross, taxInfo.studentLoanPlan);
    
    // Convert to monthly
    const taxDeduction = Math.round((annualTax / 12) * 100) / 100;
    const niDeduction = Math.round((annualNI / 12) * 100) / 100;
    const studentLoanDeduction = Math.round((annualStudentLoan / 12) * 100) / 100;
    const pensionDeduction = taxInfo.pensionScheme ? 
      this.calculatePension(monthlyGross, taxInfo.pensionRate || 3) : 0;

    const netPay = monthlyGross - taxDeduction - niDeduction - pensionDeduction - studentLoanDeduction;

    return {
      grossPay: monthlyGross,
      taxDeduction,
      niDeduction,
      pensionDeduction,
      studentLoanDeduction,
      netPay: Math.round(netPay * 100) / 100
    };
  }

  /**
   * Generate payroll for a specific period
   */
  async generatePayrollForPeriod(startDate: Date, endDate: Date): Promise<PayrollSummary[]> {
    // Get all approved timesheets for the period
    const timesheetData = await db
      .select({
        workerId: timesheets.workerId,
        workerName: users.firstName,
        workerLastName: users.lastName,
        hoursWorked: timesheets.hoursWorked,
        hourlyRate: shifts.hourlyRate,
        taxCode: workerTaxInfo.taxCode,
        niNumber: workerTaxInfo.niNumber,
        pensionScheme: workerTaxInfo.pensionScheme,
        pensionRate: workerTaxInfo.pensionRate,
        studentLoan: workerTaxInfo.studentLoan,
        studentLoanPlan: workerTaxInfo.studentLoanPlan,
      })
      .from(timesheets)
      .innerJoin(shifts, eq(timesheets.shiftId, shifts.id))
      .innerJoin(users, eq(timesheets.workerId, users.id))
      .leftJoin(workerTaxInfo, eq(timesheets.workerId, workerTaxInfo.workerId))
      .where(
        and(
          eq(timesheets.status, "approved"),
          gte(timesheets.clockIn, startDate),
          lte(timesheets.clockOut, endDate)
        )
      );

    // Group by worker and calculate totals
    const workerTotals = new Map<string, any>();
    
    for (const record of timesheetData) {
      const workerId = record.workerId;
      const grossForShift = parseFloat(record.hoursWorked || "0") * parseFloat(record.hourlyRate || "0");
      
      if (!workerTotals.has(workerId)) {
        workerTotals.set(workerId, {
          workerId,
          workerName: `${record.workerName || ""} ${record.workerLastName || ""}`.trim(),
          grossPay: 0,
          hoursWorked: 0,
          taxCode: record.taxCode || "1257L",
          niNumber: record.niNumber,
          taxInfo: {
            taxCode: record.taxCode || "1257L",
            pensionScheme: record.pensionScheme || false,
            pensionRate: parseFloat(record.pensionRate || "3"),
            studentLoan: record.studentLoan || false,
            studentLoanPlan: record.studentLoanPlan
          }
        });
      }
      
      const worker = workerTotals.get(workerId);
      worker.grossPay += grossForShift;
      worker.hoursWorked += parseFloat(record.hoursWorked || "0");
    }

    // Calculate deductions for each worker
    const payrollSummary: PayrollSummary[] = [];
    
    for (const worker of Array.from(workerTotals.values())) {
      const calculation = this.calculateMonthlyDeductions(worker.grossPay, worker.taxInfo);
      
      payrollSummary.push({
        workerId: worker.workerId,
        workerName: worker.workerName,
        grossPay: calculation.grossPay,
        taxDeduction: calculation.taxDeduction,
        niDeduction: calculation.niDeduction,
        pensionDeduction: calculation.pensionDeduction,
        otherDeductions: calculation.studentLoanDeduction,
        netPay: calculation.netPay,
        hoursWorked: worker.hoursWorked,
        taxCode: worker.taxCode,
        niNumber: worker.niNumber
      });
    }

    return payrollSummary;
  }

  /**
   * Generate HMRC CSV format for Real Time Information (RTI) submission
   */
  async generateHMRCCSV(taxYear: string, payPeriod: string): Promise<string> {
    const [startYear, endYear] = taxYear.split('-');
    const [year, month] = payPeriod.split('-');
    
    const periodStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const periodEnd = endOfMonth(periodStart);

    const payrollData = await this.generatePayrollForPeriod(periodStart, periodEnd);

    // HMRC CSV header for FPS (Full Payment Submission)
    const headers = [
      "Employee_Reference",
      "NI_Number", 
      "Surname",
      "Forename",
      "Tax_Code",
      "Pay_Frequency",
      "Payment_Date",
      "Tax_Period",
      "Taxable_Pay_This_Period",
      "Tax_Deducted_This_Period",
      "NI_Category",
      "NI_Earnings_This_Period", 
      "NI_Deducted_This_Period",
      "Student_Loan_Plan",
      "Student_Loan_Deducted",
      "Pension_Contributions",
      "Hours_Worked"
    ];

    const csvRows = [headers.join(",")];

    for (const worker of payrollData) {
      const [firstName, ...lastNameParts] = worker.workerName.split(" ");
      const lastName = lastNameParts.join(" ");
      
      const row = [
        `"EMP_${worker.workerId}"`, // Employee Reference
        `"${worker.niNumber || ""}"`, // NI Number
        `"${lastName}"`, // Surname
        `"${firstName || ""}"`, // Forename
        `"${worker.taxCode}"`, // Tax Code
        '"Monthly"', // Pay Frequency
        `"${format(periodEnd, 'dd/MM/yyyy')}"`, // Payment Date
        `"${parseInt(month)}"`, // Tax Period (month number)
        `"${worker.grossPay.toFixed(2)}"`, // Taxable Pay
        `"${worker.taxDeduction.toFixed(2)}"`, // Tax Deducted
        '"A"', // NI Category (standard)
        `"${worker.grossPay.toFixed(2)}"`, // NI Earnings
        `"${worker.niDeduction.toFixed(2)}"`, // NI Deducted
        `"${payrollData.find(p => p.workerId === worker.workerId)?.niNumber ? '2' : ''}"`, // Student Loan Plan
        `"${worker.otherDeductions.toFixed(2)}"`, // Student Loan Deducted
        `"${worker.pensionDeduction.toFixed(2)}"`, // Pension Contributions
        `"${worker.hoursWorked.toFixed(2)}"` // Hours Worked
      ];
      
      csvRows.push(row.join(","));
    }

    return csvRows.join("\n");
  }

  /**
   * Save payroll records to database
   */
  async savePayrollRecords(payrollData: PayrollSummary[], payPeriodStart: Date, payPeriodEnd: Date): Promise<void> {
    for (const worker of payrollData) {
      await db.insert(payrollRecords).values({
        workerId: worker.workerId,
        payPeriodStart,
        payPeriodEnd,
        grossPay: worker.grossPay.toString(),
        taxDeduction: worker.taxDeduction.toString(),
        niDeduction: worker.niDeduction.toString(),
        pensionDeduction: worker.pensionDeduction.toString(),
        otherDeductions: worker.otherDeductions.toString(),
        netPay: worker.netPay.toString(),
        status: "calculated"
      });
    }
  }

  /**
   * Get payroll records for a worker in a specific period
   */
  async getWorkerPayrollRecords(workerId: string, year: number, month?: number) {
    let startDate = new Date(year, 0, 1); // Start of year
    let endDate = new Date(year, 11, 31); // End of year
    
    if (month !== undefined) {
      startDate = new Date(year, month - 1, 1);
      endDate = endOfMonth(startDate);
    }

    return await db
      .select()
      .from(payrollRecords)
      .where(
        and(
          eq(payrollRecords.workerId, workerId),
          gte(payrollRecords.payPeriodStart, startDate),
          lte(payrollRecords.payPeriodEnd, endDate)
        )
      )
      .orderBy(desc(payrollRecords.payPeriodStart));
  }

  /**
   * Get all payroll records for HMRC reporting
   */
  async getPayrollForHMRC(taxYear: string) {
    const [startYear] = taxYear.split('-');
    const taxYearStart = new Date(parseInt(startYear), 3, 6); // 6th April
    const taxYearEnd = new Date(parseInt(startYear) + 1, 3, 5); // 5th April next year

    return await db
      .select({
        payrollRecord: payrollRecords,
        worker: users,
        taxInfo: workerTaxInfo
      })
      .from(payrollRecords)
      .innerJoin(users, eq(payrollRecords.workerId, users.id))
      .leftJoin(workerTaxInfo, eq(payrollRecords.workerId, workerTaxInfo.workerId))
      .where(
        and(
          gte(payrollRecords.payPeriodStart, taxYearStart),
          lte(payrollRecords.payPeriodEnd, taxYearEnd),
          eq(payrollRecords.status, "approved")
        )
      )
      .orderBy(desc(payrollRecords.payPeriodStart));
  }
}

export const payrollService = new PayrollService();