import dynamic from "next/dynamic";
import DailyDepositLedgerPanel from "./DailyDepositLedgerPanel";

const BondCard = dynamic(() => import("./BondCard"), {
  loading: () => (
    <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
      Loading...
    </div>
  ),
  ssr: false,
});

const SIPCard = dynamic(() => import("./SIPCard"), {
  loading: () => (
    <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
      Loading...
    </div>
  ),
  ssr: false,
});

export default function EnrolledSchemes({
  bonds,
  user,
  ledgerEdits,
  sipLedgerEdits = {},
  savingSipLedgerId,
  bondForms,
  nominees,
  onProfitFieldChange,
  onRedeemFieldChange,
  onAddProfitRow,
  onAddRedeemRow,
  onSaveLedgers,
  onStartEditingScheme,
  onBondFormChange,
  onSaveBond,
  onViewBond,
  savingBond,
  setSavingBond,
  viewUser,
  // SIP-specific
  onSipInstallmentChange,
  onAddSipInstallment,
  onSaveSipLedger,
  dailyDepositEdits = {},
  onDailyDepositChange,
  onAddDailyDeposit,
  onRemoveDailyDeposit,
  onSaveDailyDeposits,
  logoUrl,
  stampUrl,
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-[Space_Grotesk] text-sm font-semibold uppercase tracking-wide text-slate-500">
          Joined schemes
        </h3>
        {bonds.length > 0 && (
          <span className="text-xs text-slate-500">{bonds.length} total</span>
        )}
      </div>
      {bonds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
          No bonds issued yet.
        </div>
      ) : (
        <div className="space-y-4">
          {bonds.map((bond) => {
            const id = bond.userSchemeId;
            const isSip = bond.planType === "SIP" || bond.schemeType === "SIP";
            const isDailyDeposit = bond.planType === "DAILY_DEPOSIT";

            if (isSip) {
              return (
                <SIPCard
                  key={id}
                  bond={bond}
                  user={user}
                  viewUser={viewUser}
                  sipLedger={sipLedgerEdits[id] || bond.sipLedger || []}
                  onInstallmentChange={(index, field, value) =>
                    onSipInstallmentChange?.(id, index, field, value)
                  }
                  onAddInstallment={() => onAddSipInstallment?.(id)}
                  onSaveLedger={() => onSaveSipLedger?.(id)}
                  onViewBond={onViewBond}
                  savingLedger={savingSipLedgerId === id}
                  bondFormState={bondForms[id] ?? {}}
                  onBondFormChange={(field, value) =>
                    onBondFormChange(id, field, value)
                  }
                  onSaveBond={() => onSaveBond(bond)}
                  savingBond={savingBond}
                  onStartEditingScheme={() => onStartEditingScheme(bond)}
                  editingScheme={false}
                  schemeEditForm={{}}
                  onCancelEditingScheme={() => {}}
                  onSchemeEditFieldChange={() => {}}
                  onSaveSchemeDetails={() => {}}
                  savingSchemeDetails={false}
                  logoUrl={logoUrl}
                  stampUrl={stampUrl}
                />
              );
            }

            const regularBondCard = (
              <BondCard
                key={id}
                bond={bond}
                user={user}
                profitRows={ledgerEdits[id]?.profitLedger ?? []}
                reedemRows={ledgerEdits[id]?.reedemLedger ?? []}
                bondFormState={bondForms[id] ?? {}}
                onProfitFieldChange={(index, field, value) =>
                  onProfitFieldChange(id, index, field, value)
                }
                onReedemFieldChange={(index, field, value) =>
                  onRedeemFieldChange(id, index, field, value)
                }
                onAddProfitRow={() => onAddProfitRow(id)}
                onAddReedemRow={() => onAddRedeemRow(id)}
                onSaveLedgers={() => onSaveLedgers(id)}
                nominees={nominees}
                onStartEditingScheme={() => onStartEditingScheme(bond)}
                onBondFormChange={(field, value) =>
                  onBondFormChange(id, field, value)
                }
                onSaveBond={() => onSaveBond(bond)}
                onViewBond={onViewBond}
                savingBond={savingBond}
                setSavingBond={setSavingBond}
                viewUser={viewUser}
              />
            );

            if (isDailyDeposit) {
              return (
                <div key={id} className="space-y-2">
                  {regularBondCard}
                  <DailyDepositLedgerPanel
                    bond={bond}
                    user={user}
                    rows={dailyDepositEdits[id] ?? bond.dailyDepositLedger ?? []}
                    onChange={(index, field, value) =>
                      onDailyDepositChange?.(id, index, field, value)
                    }
                    onAdd={() => onAddDailyDeposit?.(id)}
                    onRemove={(index) => onRemoveDailyDeposit?.(id, index)}
                    onSave={() => onSaveDailyDeposits?.(id)}
                    saving={savingSipLedgerId === id}
                  />
                </div>
              );
            }

            return regularBondCard;
          })}
        </div>
      )}
    </section>
  );
}
