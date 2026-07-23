import type { Database } from "@ojapaddi/db";
import { sales, saleItems } from "@ojapaddi/db/schema";
import { eq } from "drizzle-orm";

export interface MBARule {
  antecedent: string[];
  consequent: string[];
  antecedentNames: string[];
  consequentNames: string[];
  support: number;
  confidence: number;
  lift: number;
}

/**
 * Runs the Apriori algorithm on a list of transaction baskets.
 * Each basket is an array of unique product IDs.
 */
export function runApriori(
  transactions: string[][],
  productNameMap: Record<string, string>,
  minSupport: number,
  minConfidence: number
): MBARule[] {
  const totalTx = transactions.length;
  if (totalTx === 0) return [];

  const itemsetKey = (itemset: string[]) => [...itemset].sort().join(",");

  // 1. Find frequent itemsets of size 1
  const itemCounts: Record<string, number> = {};
  for (const tx of transactions) {
    const uniqueItems = new Set(tx);
    for (const item of uniqueItems) {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    }
  }

  const frequentItemsets: Record<string, number> = {};
  const supportMap: Record<string, number> = {};

  for (const [item, count] of Object.entries(itemCounts)) {
    const support = count / totalTx;
    if (support >= minSupport) {
      frequentItemsets[item] = support;
      supportMap[item] = support;
    }
  }

  // Support map retains support values of frequent itemsets of all sizes
  const allFrequent: Record<string, number> = { ...supportMap };
  let currentFrequent = Object.keys(frequentItemsets).map(item => [item]);
  let k = 2;

  while (currentFrequent.length > 0) {
    // Generate candidates of size k from frequent itemsets of size k-1
    const candidates: string[][] = [];
    for (let i = 0; i < currentFrequent.length; i++) {
      for (let j = i + 1; j < currentFrequent.length; j++) {
        const itemsetA = currentFrequent[i];
        const itemsetB = currentFrequent[j];
        if (!itemsetA || !itemsetB) continue;
        
        // Join condition: first k-2 elements must be identical
        let canJoin = true;
        for (let l = 0; l < k - 2; l++) {
          if (itemsetA[l] !== itemsetB[l]) {
            canJoin = false;
            break;
          }
        }
        if (canJoin) {
          const candidate = Array.from(new Set([...itemsetA, ...itemsetB])).sort();
          if (candidate.length === k) {
            candidates.push(candidate);
          }
        }
      }
    }

    // De-duplicate candidates
    const uniqueCandidates: string[][] = [];
    const seenCandidates = new Set<string>();
    for (const cand of candidates) {
      const key = itemsetKey(cand);
      if (!seenCandidates.has(key)) {
        seenCandidates.add(key);
        uniqueCandidates.push(cand);
      }
    }

    // Count support of candidates
    const candCounts: Record<string, number> = {};
    for (const tx of transactions) {
      const txSet = new Set(tx);
      for (const cand of uniqueCandidates) {
        let containsAll = true;
        for (const item of cand) {
          if (!txSet.has(item)) {
            containsAll = false;
            break;
          }
        }
        if (containsAll) {
          const key = itemsetKey(cand);
          candCounts[key] = (candCounts[key] || 0) + 1;
        }
      }
    }

    // Filter by minSupport
    const nextFrequent: string[][] = [];
    for (const cand of uniqueCandidates) {
      const key = itemsetKey(cand);
      const count = candCounts[key] || 0;
      const support = count / totalTx;
      if (support >= minSupport) {
        nextFrequent.push(cand);
        allFrequent[key] = support;
        supportMap[key] = support;
      }
    }

    currentFrequent = nextFrequent;
    k++;
  }

  // Helper to generate proper non-empty subsets
  function getSubsets(arr: string[]): string[][] {
    const results: string[][] = [[]];
    for (const value of arr) {
      const len = results.length;
      for (let i = 0; i < len; i++) {
        const current = results[i];
        if (current) {
          results.push([...current, value]);
        }
      }
    }
    return results.filter(s => s.length > 0 && s.length < arr.length);
  }

  // 2. Generate association rules from frequent itemsets of size >= 2
  const rules: MBARule[] = [];

  for (const [key, support] of Object.entries(allFrequent)) {
    const items = key.split(",");
    if (items.length < 2) continue;

    const subsets = getSubsets(items);
    for (const antecedent of subsets) {
      const consequent = items.filter(x => !antecedent.includes(x));
      
      const antKey = itemsetKey(antecedent);
      const consKey = itemsetKey(consequent);

      const antSupport = supportMap[antKey] || 0;
      const consSupport = supportMap[consKey] || 0;

      if (antSupport > 0) {
        const confidence = support / antSupport;
        if (confidence >= minConfidence) {
          const lift = consSupport > 0 ? confidence / consSupport : 0;
          
          rules.push({
            antecedent,
            consequent,
            antecedentNames: antecedent.map(id => productNameMap[id] || "Unknown Product"),
            consequentNames: consequent.map(id => productNameMap[id] || "Unknown Product"),
            support,
            confidence,
            lift,
          });
        }
      }
    }
  }

  // Sort by lift (descending), then confidence (descending)
  return rules.sort((a, b) => b.lift - a.lift || b.confidence - a.confidence);
}

/**
 * Main service call to compute MBA rules for a business.
 */
export async function getMBARules(
  db: Database,
  businessId: string,
  minSupport: number = 0.1,
  minConfidence: number = 0.5
): Promise<MBARule[]> {
  // Fetch all sale items linked to sales of this business
  const rows = await db
    .select({
      saleId: saleItems.saleId,
      productId: saleItems.productId,
      productName: saleItems.productName,
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(eq(sales.businessId, businessId));

  if (rows.length === 0) {
    return [];
  }

  // Group into transactions and build product ID -> product Name mapping
  const transactionMap: Record<string, Set<string>> = {};
  const productNameMap: Record<string, string> = {};

  for (const row of rows) {
    if (!row.saleId || !row.productId) continue;
    const saleId = row.saleId;
    if (!transactionMap[saleId]) {
      transactionMap[saleId] = new Set<string>();
    }
    const set = transactionMap[saleId];
    if (set) {
      set.add(row.productId);
    }
    productNameMap[row.productId] = row.productName;
  }

  const transactions = Object.values(transactionMap).map(set => Array.from(set));

  return runApriori(transactions, productNameMap, minSupport, minConfidence);
}
