export interface CdsRecommendation {
  id: string;
  testName: string;
  value: string;
  flag: 'H' | 'L' | 'N';
  severity: 'high' | 'medium' | 'info';
  title: string;
  recommendation: string;
  suggestedFollowUpTests: string[];
  suggestedPlanEntry: string;
}

export function evaluateCdsRules(labOrders: any[]): CdsRecommendation[] {
  const recommendations: CdsRecommendation[] = [];
  if (!labOrders || !Array.isArray(labOrders)) return recommendations;

  labOrders.forEach((order) => {
    if (!order.results || !Array.isArray(order.results)) return;

    order.results.forEach((res: any) => {
      const flag = res.flag;
      const testName = res.labTest?.name || order.notes || 'Lab Test';
      const numVal = parseFloat(res.value);

      if (flag === 'H' || (!isNaN(numVal) && numVal > 16.0 && testName.toLowerCase().includes('cbc'))) {
        recommendations.push({
          id: `cds-${res.id}-h`,
          testName,
          value: `${res.value} ${res.unit || ''}`.trim(),
          flag: 'H',
          severity: 'high',
          title: 'High Hemoglobin / Polycythemia Alert',
          recommendation: 'Evaluate patient hydration status, repeat CBC in 2-4 weeks, and consider iron panel & serum ferritin.',
          suggestedFollowUpTests: ['Iron Panel (Ferritin, TIBC)', 'Repeat CBC with Differential'],
          suggestedPlanEntry: `High ${testName} (${res.value} ${res.unit || ''} [H]) noted: Assess hydration status, order Iron Panel, and schedule follow-up CBC.`
        });
      } else if (flag === 'L' || (!isNaN(numVal) && numVal < 12.0 && testName.toLowerCase().includes('cbc'))) {
        recommendations.push({
          id: `cds-${res.id}-l`,
          testName,
          value: `${res.value} ${res.unit || ''}`.trim(),
          flag: 'L',
          severity: 'high',
          title: 'Anemia / Low Hemoglobin Alert',
          recommendation: 'Initiate anemia workup: Order serum ferritin, iron studies, and stool occult blood screening.',
          suggestedFollowUpTests: ['Serum Ferritin & Iron Studies', 'Stool Occult Blood Screen'],
          suggestedPlanEntry: `Low ${testName} (${res.value} ${res.unit || ''} [L]) noted: Initiate anemia workup (Serum Ferritin & Iron Studies).`
        });
      } else if (flag === 'H' || flag === 'L') {
        recommendations.push({
          id: `cds-${res.id}-gen`,
          testName,
          value: `${res.value} ${res.unit || ''}`.trim(),
          flag: flag as 'H' | 'L',
          severity: 'medium',
          title: `Abnormal Finding: ${testName} (${flag})`,
          recommendation: `Abnormal lab value (${res.value} ${res.unit || ''}) requires clinical correlation and follow-up monitoring.`,
          suggestedFollowUpTests: [`Follow-up ${testName} Re-check`],
          suggestedPlanEntry: `Abnormal ${testName} (${res.value} ${res.unit || ''} [${flag}]) noted: Monitor clinical symptoms and re-check at follow-up.`
        });
      }
    });
  });

  return recommendations;
}
