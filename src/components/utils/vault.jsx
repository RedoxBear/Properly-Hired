import { AutofillVault } from "@/entities/AutofillVault";

export async function getVault() {
  try {
    const list = await AutofillVault.list("-updated_date", 1);
    return list?.[0] || null;
  } catch {
    return null;
  }
}