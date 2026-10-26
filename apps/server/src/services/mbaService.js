import { sales, saleItems } from "@ojapaddi/db/schema";
import { eq } from "drizzle-orm";
/**
 * Runs the Apriori algorithm on a list of transaction baskets.
 * Each basket is an array of unique product IDs.
 */
export function runApriori(transactions, productNameMap, minSupport, minConfidence) {
    const totalTx = transactions.length;
    if (totalTx === 0)
        return [];
    const itemsetKey = (itemset) => [...itemset].sort().join(",");
    // 1. Find frequent itemsets of size 1
    const itemCounts = {};
    for (const tx of transactions) {
        const uniqueItems = new Set(tx);
        for (const item of uniqueItems) {
            itemCounts[item] = (itemCounts[item] || 0) + 1;
        }
    }
    const frequentItemsets = {};
    const supportMap = {};
    for (const [item, count] of Object.entries(itemCounts)) {
        const support = count / totalTx;
        if (support >= minSupport) {
            frequentItemsets[item] = support;
            supportMap[item] = support;
        }
    }
    // Support map retains support values of frequent itemsets of all sizes
    const allFrequent = { ...supportMap };
    let currentFrequent = Object.keys(frequentItemsets).map(item => [item]);
    let k = 2;
    while (currentFrequent.length > 0) {
        // Generate candidates of size k from frequent itemsets of size k-1
        const candidates = [];
        for (let i = 0; i < currentFrequent.length; i++) {
            for (let j = i + 1; j < currentFrequent.length; j++) {
                const itemsetA = currentFrequent[i];
                const itemsetB = currentFrequent[j];
                if (!itemsetA || !itemsetB)
                    continue;
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
        const uniqueCandidates = [];
        const seenCandidates = new Set();
        for (const cand of candidates) {
            const key = itemsetKey(cand);
            if (!seenCandidates.has(key)) {
                seenCandidates.add(key);
                uniqueCandidates.push(cand);
            }
        }
        // Count support of candidates
        const candCounts = {};
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
        const nextFrequent = [];
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
    function getSubsets(arr) {
        const results = [[]];
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
    const rules = [];
    for (const [key, support] of Object.entries(allFrequent)) {
        const items = key.split(",");
        if (items.length < 2)
            continue;
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
export async function getMBARules(db, businessId, minSupport = 0.1, minConfidence = 0.5) {
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
    const transactionMap = {};
    const productNameMap = {};
    for (const row of rows) {
        if (!row.saleId || !row.productId)
            continue;
        const saleId = row.saleId;
        if (!transactionMap[saleId]) {
            transactionMap[saleId] = new Set();
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
