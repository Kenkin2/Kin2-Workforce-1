import { db } from "../db";
import { payrollRecords, users, workerTaxInfo } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { format } from "date-fns";

interface PayslipData {
  worker: {
    id: string;
    name: string;
    email: string;
    niNumber?: string;
    taxCode: string;
    address?: string;
    postcode?: string;
  };
  payPeriod: {
    start: string;
    end: string;
    payDate: string;
  };
  earnings: {
    hoursWorked: number;
    hourlyRate: number;
    grossPay: number;
  };
  deductions: {
    tax: number;
    nationalInsurance: number;
    pension: number;
    studentLoan: number;
    other: number;
    total: number;
  };
  netPay: number;
  yearToDate: {
    grossPay: number;
    tax: number;
    nationalInsurance: number;
    pension: number;
    netPay: number;
  };
  employer: {
    name: string;
    payeReference: string;
    address: string;
  };
}

export class PayslipService {
  private readonly EMPLOYER_INFO = {
    name: "Kin2 Workforce Ltd",
    payeReference: "123/AB12345",
    address: "123 Business Street, London, SW1A 1AA"
  };

  /**
   * Get payslip data for a specific worker and period
   */
  async getPayslipData(workerId: string, payPeriodStart: Date, payPeriodEnd: Date): Promise<PayslipData | null> {
    // Get payroll record for the period
    const [payrollRecord] = await db
      .select({
        payroll: payrollRecords,
        worker: users,
        taxInfo: workerTaxInfo
      })
      .from(payrollRecords)
      .innerJoin(users, eq(payrollRecords.workerId, users.id))
      .leftJoin(workerTaxInfo, eq(payrollRecords.workerId, workerTaxInfo.workerId))
      .where(
        and(
          eq(payrollRecords.workerId, workerId),
          eq(payrollRecords.payPeriodStart, payPeriodStart),
          eq(payrollRecords.payPeriodEnd, payPeriodEnd)
        )
      );

    if (!payrollRecord) return null;

    // Calculate year-to-date figures
    const taxYearStart = new Date(payPeriodStart.getFullYear(), 3, 6); // 6th April
    const ytdRecords = await db
      .select()
      .from(payrollRecords)
      .where(
        and(
          eq(payrollRecords.workerId, workerId),
          gte(payrollRecords.payPeriodStart, taxYearStart),
          lte(payrollRecords.payPeriodEnd, payPeriodEnd)
        )
      );

    const yearToDate = ytdRecords.reduce((acc, record) => ({
      grossPay: acc.grossPay + parseFloat(record.grossPay),
      tax: acc.tax + parseFloat(record.taxDeduction),
      nationalInsurance: acc.nationalInsurance + parseFloat(record.niDeduction),
      pension: acc.pension + parseFloat(record.pensionDeduction),
      netPay: acc.netPay + parseFloat(record.netPay)
    }), {
      grossPay: 0,
      tax: 0,
      nationalInsurance: 0,
      pension: 0,
      netPay: 0
    });

    const payroll = payrollRecord.payroll;
    const worker = payrollRecord.worker;
    const taxInfo = payrollRecord.taxInfo;

    const totalDeductions = parseFloat(payroll.taxDeduction) + 
                           parseFloat(payroll.niDeduction) + 
                           parseFloat(payroll.pensionDeduction) + 
                           parseFloat(payroll.otherDeductions);

    // Estimate hourly rate and hours from gross pay (simplified)
    const estimatedHours = 160; // Standard monthly hours
    const hourlyRate = parseFloat(payroll.grossPay) / estimatedHours;

    return {
      worker: {
        id: worker.id,
        name: `${worker.firstName || ""} ${worker.lastName || ""}`.trim(),
        email: worker.email || "",
        niNumber: taxInfo?.niNumber ?? undefined,
        taxCode: taxInfo?.taxCode || "1257L",
        address: taxInfo?.address ?? undefined,
        postcode: taxInfo?.postcode ?? undefined
      },
      payPeriod: {
        start: format(payPeriodStart, "dd/MM/yyyy"),
        end: format(payPeriodEnd, "dd/MM/yyyy"),
        payDate: format(payPeriodEnd, "dd/MM/yyyy")
      },
      earnings: {
        hoursWorked: estimatedHours,
        hourlyRate: Math.round(hourlyRate * 100) / 100,
        grossPay: parseFloat(payroll.grossPay)
      },
      deductions: {
        tax: parseFloat(payroll.taxDeduction),
        nationalInsurance: parseFloat(payroll.niDeduction),
        pension: parseFloat(payroll.pensionDeduction),
        studentLoan: parseFloat(payroll.otherDeductions),
        other: 0,
        total: totalDeductions
      },
      netPay: parseFloat(payroll.netPay),
      yearToDate,
      employer: this.EMPLOYER_INFO
    };
  }

  /**
   * Generate HTML payslip template
   */
  generatePayslipHTML(data: PayslipData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payslip - ${data.worker.name}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .payslip {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .employer-info {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .payslip-title {
            font-size: 24px;
            font-weight: bold;
            margin-top: 20px;
        }
        .content {
            padding: 30px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .info-section h3 {
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: 500;
        }
        .value {
            font-weight: bold;
            color: #333;
        }
        .earnings-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: #f9f9f9;
            border-radius: 8px;
            overflow: hidden;
        }
        .earnings-table th {
            background: #667eea;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        .earnings-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #ddd;
        }
        .earnings-table tr:last-child td {
            border-bottom: none;
        }
        .net-pay {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 20px;
            text-align: center;
            margin-top: 20px;
            border-radius: 8px;
        }
        .net-pay-amount {
            font-size: 28px;
            font-weight: bold;
        }
        .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { background: white; }
            .payslip { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="payslip">
        <div class="header">
            <div class="employer-info">${data.employer.name}</div>
            <div>PAYE Reference: ${data.employer.payeReference}</div>
            <div>${data.employer.address}</div>
            <div class="payslip-title">PAYSLIP</div>
        </div>
        
        <div class="content">
            <div class="info-grid">
                <div class="info-section">
                    <h3>Employee Information</h3>
                    <div class="info-row">
                        <span class="label">Name:</span>
                        <span class="value">${data.worker.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Employee ID:</span>
                        <span class="value">EMP_${data.worker.id.slice(-6)}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">NI Number:</span>
                        <span class="value">${data.worker.niNumber || "Not provided"}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Tax Code:</span>
                        <span class="value">${data.worker.taxCode}</span>
                    </div>
                </div>
                
                <div class="info-section">
                    <h3>Pay Period</h3>
                    <div class="info-row">
                        <span class="label">Pay Period:</span>
                        <span class="value">${data.payPeriod.start} - ${data.payPeriod.end}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Pay Date:</span>
                        <span class="value">${data.payPeriod.payDate}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Hours Worked:</span>
                        <span class="value">${data.earnings.hoursWorked}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Hourly Rate:</span>
                        <span class="value">£${data.earnings.hourlyRate.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <table class="earnings-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>This Period</th>
                        <th>Year to Date</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Gross Pay</strong></td>
                        <td><strong>£${data.earnings.grossPay.toFixed(2)}</strong></td>
                        <td><strong>£${data.yearToDate.grossPay.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                        <td>Income Tax</td>
                        <td>-£${data.deductions.tax.toFixed(2)}</td>
                        <td>-£${data.yearToDate.tax.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>National Insurance</td>
                        <td>-£${data.deductions.nationalInsurance.toFixed(2)}</td>
                        <td>-£${data.yearToDate.nationalInsurance.toFixed(2)}</td>
                    </tr>
                    ${data.deductions.pension > 0 ? `
                    <tr>
                        <td>Pension Contribution</td>
                        <td>-£${data.deductions.pension.toFixed(2)}</td>
                        <td>-£${data.yearToDate.pension.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    ${data.deductions.studentLoan > 0 ? `
                    <tr>
                        <td>Student Loan</td>
                        <td>-£${data.deductions.studentLoan.toFixed(2)}</td>
                        <td>-£${(data.yearToDate.grossPay - data.yearToDate.tax - data.yearToDate.nationalInsurance - data.yearToDate.pension - data.yearToDate.netPay).toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    <tr style="border-top: 2px solid #667eea;">
                        <td><strong>Total Deductions</strong></td>
                        <td><strong>-£${data.deductions.total.toFixed(2)}</strong></td>
                        <td><strong>-£${(data.yearToDate.grossPay - data.yearToDate.netPay).toFixed(2)}</strong></td>
                    </tr>
                </tbody>
            </table>

            <div class="net-pay">
                <div>Net Pay</div>
                <div class="net-pay-amount">£${data.netPay.toFixed(2)}</div>
            </div>
        </div>
        
        <div class="footer">
            <p>This payslip was generated automatically by Kin2 Workforce Platform</p>
            <p>Generated on ${format(new Date(), "dd/MM/yyyy 'at' HH:mm")}</p>
            <p>For any queries regarding this payslip, please contact HR or your manager</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate payslip for a worker
   */
  async generatePayslip(workerId: string, payrollRecordId: string): Promise<PayslipData | null> {
    const [record] = await db
      .select({
        payroll: payrollRecords,
        worker: users,
        taxInfo: workerTaxInfo
      })
      .from(payrollRecords)
      .innerJoin(users, eq(payrollRecords.workerId, users.id))
      .leftJoin(workerTaxInfo, eq(payrollRecords.workerId, workerTaxInfo.workerId))
      .where(eq(payrollRecords.id, payrollRecordId));

    if (!record) return null;

    // Calculate YTD figures for this tax year
    const taxYearStart = new Date(record.payroll.payPeriodStart.getFullYear(), 3, 6);
    const ytdRecords = await db
      .select()
      .from(payrollRecords)
      .where(
        and(
          eq(payrollRecords.workerId, workerId),
          gte(payrollRecords.payPeriodStart, taxYearStart),
          lte(payrollRecords.payPeriodEnd, record.payroll.payPeriodEnd)
        )
      );

    const yearToDate = ytdRecords.reduce((acc, ytdRecord) => ({
      grossPay: acc.grossPay + parseFloat(ytdRecord.grossPay),
      tax: acc.tax + parseFloat(ytdRecord.taxDeduction),
      nationalInsurance: acc.nationalInsurance + parseFloat(ytdRecord.niDeduction),
      pension: acc.pension + parseFloat(ytdRecord.pensionDeduction),
      netPay: acc.netPay + parseFloat(ytdRecord.netPay)
    }), {
      grossPay: 0,
      tax: 0,
      nationalInsurance: 0,
      pension: 0,
      netPay: 0
    });

    const payroll = record.payroll;
    const worker = record.worker;
    const taxInfo = record.taxInfo;

    const totalDeductions = parseFloat(payroll.taxDeduction) + 
                           parseFloat(payroll.niDeduction) + 
                           parseFloat(payroll.pensionDeduction) + 
                           parseFloat(payroll.otherDeductions);

    return {
      worker: {
        id: worker.id,
        name: `${worker.firstName || ""} ${worker.lastName || ""}`.trim(),
        email: worker.email || "",
        niNumber: taxInfo?.niNumber ?? undefined,
        taxCode: taxInfo?.taxCode || "1257L",
        address: taxInfo?.address ?? undefined,
        postcode: taxInfo?.postcode ?? undefined
      },
      payPeriod: {
        start: format(new Date(payroll.payPeriodStart), "dd/MM/yyyy"),
        end: format(new Date(payroll.payPeriodEnd), "dd/MM/yyyy"),
        payDate: format(new Date(payroll.payPeriodEnd), "dd/MM/yyyy")
      },
      earnings: {
        hoursWorked: 160, // This should come from timesheet data
        hourlyRate: parseFloat(payroll.grossPay) / 160,
        grossPay: parseFloat(payroll.grossPay)
      },
      deductions: {
        tax: parseFloat(payroll.taxDeduction),
        nationalInsurance: parseFloat(payroll.niDeduction),
        pension: parseFloat(payroll.pensionDeduction),
        studentLoan: parseFloat(payroll.otherDeductions),
        other: 0,
        total: totalDeductions
      },
      netPay: parseFloat(payroll.netPay),
      yearToDate,
      employer: this.EMPLOYER_INFO
    };
  }

  /**
   * Mark payslip as generated and save URL
   */
  async markPayslipGenerated(payrollRecordId: string, payslipUrl: string): Promise<void> {
    await db
      .update(payrollRecords)
      .set({
        payslipGenerated: true,
        payslipUrl,
        updatedAt: new Date()
      })
      .where(eq(payrollRecords.id, payrollRecordId));
  }
}

export const payslipService = new PayslipService();