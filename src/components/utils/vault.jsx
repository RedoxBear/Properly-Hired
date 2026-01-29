import { AutofillVault } from "@/api/entities";

export async function getVault() {
  try {
    const list = await AutofillVault.list("-updated_date", 1);
    return list?.[0] || null;
  } catch {
    return null;
  }
}