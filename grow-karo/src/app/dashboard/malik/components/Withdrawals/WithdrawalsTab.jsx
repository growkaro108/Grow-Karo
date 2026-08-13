import { useWithdrawals } from "./useWithdrawals";
import WithdrawalFilters from "./WithdrawalFilters";
import WithdrawalTable from "./WithdrawalTable";
import WithdrawalConfirmModal from "./WithdrawalConfirmModal";

export default function WithdrawalsTab({ onDecision }) {
  const {
    filter,
    setFilter,
    confirm,
    setConfirm,
    rows,
    loading,
    error,
    actionLoadingId,
    showFilters,
    setShowFilters,
    searchInput,
    setSearchInput,
    method,
    setMethod,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalElements,
    totalPages,
    reason,
    setReason,
    selectedRemitter,
    setSelectedRemitter,
    remitters,
    activeFilterCount,
    clearAllFilters,
    safePage,
    rangeStart,
    rangeEnd,
    pageButtons,
    handleConfirm,
    loadWithdrawals,
  } = useWithdrawals(onDecision);

  return (
    <div className="space-y-4">
      <WithdrawalFilters
        filter={filter}
        setFilter={setFilter}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        activeFilterCount={activeFilterCount}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        minAmount={minAmount}
        setMinAmount={setMinAmount}
        maxAmount={maxAmount}
        setMaxAmount={setMaxAmount}
        clearAllFilters={clearAllFilters}
      />

      <WithdrawalTable
        loading={loading}
        rows={rows}
        filter={filter}
        actionLoadingId={actionLoadingId}
        setConfirm={setConfirm}
        totalElements={totalElements}
        pageSize={pageSize}
        setPageSize={setPageSize}
        safePage={safePage}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        totalPages={totalPages}
        pageButtons={pageButtons}
        setCurrentPage={setCurrentPage}
        loadWithdrawals={loadWithdrawals}
        error={error}
      />

      <WithdrawalConfirmModal
        confirm={confirm}
        setConfirm={setConfirm}
        actionLoadingId={actionLoadingId}
        reason={reason}
        setReason={setReason}
        selectedRemitter={selectedRemitter}
        setSelectedRemitter={setSelectedRemitter}
        remitters={remitters}
        handleConfirm={handleConfirm}
      />
    </div>
  );
}
