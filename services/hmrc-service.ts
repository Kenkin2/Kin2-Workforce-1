import { db } from "../db";
import { hmrcSubmissions, payrollRecords, workerTaxInfo, users } from "@shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { payrollService } from "./payroll-service";

export class HMRCService {
  private readonly EMPLOYER_REFERENCE = "123/AB12345"; // This would be configured per organization

  /**
   * Generate Full Payment Submission (FPS) CSV for HMRC
   */
  async generateFPSSubmission(taxYear: string, payPeriod: string): Promise<string> {
    const payrollData = await payrollService.getPayrollForHMRC(taxYear);
    
    // FPS Header
    const headers = [
      "Employer_PAYE_Reference",
      "Employee_Reference", 
      "NI_Number",
      "Surname",
      "Forename",
      "Date_of_Birth",
      "Gender",
      "Address",
      "Postcode",
      "Start_Date",
      "Tax_Code",
      "Pay_Frequency",
      "Payment_Date",
      "Tax_Period",
      "Taxable_Pay_This_Period",
      "Taxable_Pay_Year_to_Date",
      "Tax_Deducted_This_Period",
      "Tax_Deducted_Year_to_Date",
      "NI_Category",
      "NI_Earnings_This_Period",
      "NI_Earnings_Year_to_Date", 
      "NI_Deducted_This_Period",
      "NI_Deducted_Year_to_Date",
      "Student_Loan_Plan",
      "Student_Loan_Deducted_This_Period",
      "Student_Loan_Deducted_Year_to_Date",
      "Pension_Contributions_This_Period",
      "Pension_Contributions_Year_to_Date",
      "Directors_NI",
      "Irregular_Employment",
      "On_Strike"
    ];

    const csvRows = [headers.join(",")];

    // Group by worker to calculate year-to-date figures
    const workerYTD = new Map<string, any>();
    
    for (const record of payrollData) {
      const workerId = record.payrollRecord.workerId;
      if (!workerYTD.has(workerId)) {
        workerYTD.set(workerId, {
          taxablePayYTD: 0,
          taxDeductedYTD: 0,
          niEarningsYTD: 0,
          niDeductedYTD: 0,
          studentLoanYTD: 0,
          pensionYTD: 0
        });
      }
      
      const ytd = workerYTD.get(workerId);
      ytd.taxablePayYTD += parseFloat(record.payrollRecord.grossPay);
      ytd.taxDeductedYTD += parseFloat(record.payrollRecord.taxDeduction);
      ytd.niEarningsYTD += parseFloat(record.payrollRecord.grossPay);
      ytd.niDeductedYTD += parseFloat(record.payrollRecord.niDeduction);
      ytd.studentLoanYTD += parseFloat(record.payrollRecord.otherDeductions);
      ytd.pensionYTD += parseFloat(record.payrollRecord.pensionDeduction);
    }

    // Generate CSV rows for current period
    const currentPeriodRecords = payrollData.filter(record => {
      const recordDate = new Date(record.payrollRecord.payPeriodStart);
      return recordDate.getFullYear().toString() === payPeriod.split('-')[0] && 
             (recordDate.getMonth() + 1).toString().padStart(2, '0') === payPeriod.split('-')[1];
    });

    for (const record of currentPeriodRecords) {
      const worker = record.worker;
      const payroll = record.payrollRecord;
      const taxInfo = record.taxInfo;
      const ytd = workerYTD.get(payroll.workerId);

      const row = [
        `"${this.EMPLOYER_REFERENCE}"`, // Employer PAYE Reference
        `"EMP_${payroll.workerId}"`, // Employee Reference
        `"${taxInfo?.niNumber || ""}"`, // NI Number
        `"${worker.lastName || ""}"`, // Surname
        `"${worker.firstName || ""}"`, // Forename
        `"${taxInfo?.dateOfBirth ? format(new Date(taxInfo.dateOfBirth), 'dd/MM/yyyy') : ""}"`, // Date of Birth
        `"${taxInfo?.gender || ""}"`, // Gender
        `"${taxInfo?.address || ""}"`, // Address
        `"${taxInfo?.postcode || ""}"`, // Postcode
        `"${taxInfo?.startDate ? format(new Date(taxInfo.startDate), 'dd/MM/yyyy') : ""}"`, // Start Date
        `"${taxInfo?.taxCode || "1257L"}"`, // Tax Code
        '"Monthly"', // Pay Frequency
        `"${format(new Date(payroll.payPeriodEnd), 'dd/MM/yyyy')}"`, // Payment Date
        `"${new Date(payroll.payPeriodStart).getMonth() + 1}"`, // Tax Period
        `"${parseFloat(payroll.grossPay).toFixed(2)}"`, // Taxable Pay This Period
        `"${ytd.taxablePayYTD.toFixed(2)}"`, // Taxable Pay YTD
        `"${parseFloat(payroll.taxDeduction).toFixed(2)}"`, // Tax Deducted This Period
        `"${ytd.taxDeductedYTD.toFixed(2)}"`, // Tax Deducted YTD
        '"A"', // NI Category (standard)
        `"${parseFloat(payroll.grossPay).toFixed(2)}"`, // NI Earnings This Period
        `"${ytd.niEarningsYTD.toFixed(2)}"`, // NI Earnings YTD
        `"${parseFloat(payroll.niDeduction).toFixed(2)}"`, // NI Deducted This Period
        `"${ytd.niDeductedYTD.toFixed(2)}"`, // NI Deducted YTD
        `"${taxInfo?.studentLoanPlan || ""}"`, // Student Loan Plan
        `"${parseFloat(payroll.otherDeductions).toFixed(2)}"`, // Student Loan Deducted This Period
        `"${ytd.studentLoanYTD.toFixed(2)}"`, // Student Loan Deducted YTD
        `"${parseFloat(payroll.pensionDeduction).toFixed(2)}"`, // Pension This Period
        `"${ytd.pensionYTD.toFixed(2)}"`, // Pension YTD
        `"${taxInfo?.directorsNi ? 'Y' : 'N'}"`, // Directors NI
        '"N"', // Irregular Employment
        '"N"' // On Strike
      ];

      csvRows.push(row.join(","));
    }

    return csvRows.join("\n");
  }

  /**
   * Save HMRC submission record
   */
  async saveHMRCSubmission(
    submissionType: string,
    taxYear: string, 
    payPeriod: string,
    csvData: string
  ) {
    const submission = await db.insert(hmrcSubmissions).values({
      submissionType: submissionType as any,
      taxYear,
      payPeriod,
      employerReference: this.EMPLOYER_REFERENCE,
      submissionData: {
        recordCount: csvData.split('\n').length - 1,
        generatedAt: new Date().toISOString()
      },
      csvData,
      status: "ready"
    }).returning();

    return submission[0];
  }

  /**
   * Generate P60 annual summary
   */
  async generateP60Data(workerId: string, taxYear: string) {
    const payrollRecords = await payrollService.getWorkerPayrollRecords(
      workerId, 
      parseInt(taxYear.split('-')[0])
    );

    const totals = payrollRecords.reduce((acc, record) => ({
      grossPay: acc.grossPay + parseFloat(record.grossPay),
      taxDeducted: acc.taxDeducted + parseFloat(record.taxDeduction),
      niDeducted: acc.niDeducted + parseFloat(record.niDeduction),
      pensionContributions: acc.pensionContributions + parseFloat(record.pensionDeduction),
      studentLoanDeductions: acc.studentLoanDeductions + parseFloat(record.otherDeductions)
    }), {
      grossPay: 0,
      taxDeducted: 0, 
      niDeducted: 0,
      pensionContributions: 0,
      studentLoanDeductions: 0
    });

    return {
      taxYear,
      workerId,
      ...totals,
      netPay: totals.grossPay - totals.taxDeducted - totals.niDeducted - 
              totals.pensionContributions - totals.studentLoanDeductions
    };
  }

  /**
   * Generate comprehensive payroll report
   */
  async generatePayrollReport(startDate: Date, endDate: Date) {
    const payrollData = await payrollService.generatePayrollForPeriod(startDate, endDate);
    
    const summary = {
      totalWorkers: payrollData.length,
      totalGrossPay: payrollData.reduce((sum, p) => sum + p.grossPay, 0),
      totalTaxDeducted: payrollData.reduce((sum, p) => sum + p.taxDeduction, 0),
      totalNIDeducted: payrollData.reduce((sum, p) => sum + p.niDeduction, 0),
      totalPensionDeducted: payrollData.reduce((sum, p) => sum + p.pensionDeduction, 0),
      totalNetPay: payrollData.reduce((sum, p) => sum + p.netPay, 0),
      totalHoursWorked: payrollData.reduce((sum, p) => sum + p.hoursWorked, 0),
      averageHourlyRate: payrollData.length > 0 ? 
        payrollData.reduce((sum, p) => sum + (p.grossPay / p.hoursWorked), 0) / payrollData.length : 0
    };

    return {
      summary,
      workers: payrollData,
      periodStart: format(startDate, 'dd/MM/yyyy'),
      periodEnd: format(endDate, 'dd/MM/yyyy')
    };
  }
}

export const hmrcService = new HMRCService();