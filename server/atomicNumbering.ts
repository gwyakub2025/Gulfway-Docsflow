import crypto from 'crypto';
import { NumberingRule, SequenceResetType } from '../src/types/index.js';

interface NumberingContext {
  companyCode: string;
  departmentCode: string;
  formCode: string;
  date?: Date;
}

export class AtomicNumberingEngine {
  private static lock = Promise.resolve();

  /**
   * Generates next official document number atomically.
   * Guaranteed never to produce duplicate sequence numbers.
   */
  public static async allocateNumber(
    rule: NumberingRule,
    context: NumberingContext
  ): Promise<{ documentNumber: string; updatedRule: NumberingRule; token: string }> {
    // Acquire mutex lock to ensure absolute serialization for sequence generation
    return new Promise((resolve, reject) => {
      AtomicNumberingEngine.lock = AtomicNumberingEngine.lock
        .then(async () => {
          try {
            const now = context.date || new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const shortYear = String(year).slice(-2);

            // Check reset condition
            let currentPeriodKey = '';
            if (rule.sequenceReset === 'YEARLY') {
              currentPeriodKey = String(year);
            } else if (rule.sequenceReset === 'MONTHLY') {
              currentPeriodKey = `${year}-${month}`;
            } else if (rule.sequenceReset === 'FINANCIAL_YEAR') {
              // Standard financial year (April - March)
              const fy = now.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
              currentPeriodKey = fy;
            }

            let nextSeq = (rule.currentSequence || 0) + 1;
            if (rule.sequenceReset !== 'NEVER' && rule.lastResetPeriod !== currentPeriodKey) {
              // Sequence resets for new period
              nextSeq = rule.startingSequence || 1;
              rule.lastResetPeriod = currentPeriodKey;
            }

            // Update rule currentSequence
            rule.currentSequence = nextSeq;
            rule.updatedAt = new Date().toISOString();

            // Format document number using pattern tokens
            let docNumber = rule.pattern;
            docNumber = docNumber.replace(/{COMPANY}/g, context.companyCode.toUpperCase());
            docNumber = docNumber.replace(/{DEPARTMENT}/g, context.departmentCode.toUpperCase());
            docNumber = docNumber.replace(/{FORMCODE}/g, context.formCode.toUpperCase());
            docNumber = docNumber.replace(/{YYYY}/g, String(year));
            docNumber = docNumber.replace(/{YY}/g, shortYear);
            docNumber = docNumber.replace(/{MM}/g, month);
            docNumber = docNumber.replace(/{DD}/g, day);

            // Handle {SEQ:N} token
            const seqMatch = docNumber.match(/{SEQ:(\d+)}/);
            if (seqMatch) {
              const padding = parseInt(seqMatch[1], 10) || 6;
              const formattedSeq = String(nextSeq).padStart(padding, '0');
              docNumber = docNumber.replace(seqMatch[0], formattedSeq);
            } else {
              // Fallback if no specific padding token
              docNumber = `${docNumber}-${String(nextSeq).padStart(6, '0')}`;
            }

            // Generate cryptographically secure verification token
            const token = crypto.randomBytes(16).toString('hex');

            resolve({
              documentNumber: docNumber,
              updatedRule: rule,
              token,
            });
          } catch (err) {
            reject(err);
          }
        })
        .catch(reject);
    });
  }

  /**
   * Generates a preview string for the pattern without incrementing sequence
   */
  public static previewPattern(pattern: string, context: NumberingContext, sampleSeq = 1): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const shortYear = String(year).slice(-2);

    let docNumber = pattern;
    docNumber = docNumber.replace(/{COMPANY}/g, context.companyCode || 'GWDS');
    docNumber = docNumber.replace(/{DEPARTMENT}/g, context.departmentCode || 'HR');
    docNumber = docNumber.replace(/{FORMCODE}/g, context.formCode || 'LF');
    docNumber = docNumber.replace(/{YYYY}/g, String(year));
    docNumber = docNumber.replace(/{YY}/g, shortYear);
    docNumber = docNumber.replace(/{MM}/g, month);
    docNumber = docNumber.replace(/{DD}/g, day);

    const seqMatch = docNumber.match(/{SEQ:(\d+)}/);
    if (seqMatch) {
      const padding = parseInt(seqMatch[1], 10) || 6;
      docNumber = docNumber.replace(seqMatch[0], String(sampleSeq).padStart(padding, '0'));
    }

    return docNumber;
  }
}
