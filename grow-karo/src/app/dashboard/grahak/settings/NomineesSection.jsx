import React, { use, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { userContext } from "@/context/UserContext";
import { confirmMessage, allRounderMessage } from "@/components/Message";
import { deleteNominee } from "../../../../../services/grahakService";
import dynamic from "next/dynamic";
import TabLoader from "@/loader/TabLoader";
// import AddNomineeForm from "../../../plan/components/AddNomineeForm";

const AddNomineeForm = dynamic(
  () => import("../../../plan/components/AddNomineeForm"),
  {
    loading: () => <TabLoader message="Loading Add Nominee Form..." />,
    ssr: false,
  },
);

function maskAadhaar(value = "") {
  const digits = String(value).replace(/\D/g, "");
  return digits.length === 12
    ? `XXXX XXXX ${digits.slice(-4)}`
    : "Not provided";
}

function formatPhone(value = "") {
  const digits = String(value).replace(/\D/g, "");
  return digits.length === 10
    ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
    : value;
}

export default function NomineesSection() {
  const { authUser, nominees, FetchNominees, isLoading } = use(userContext);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNominee, setEditingNominee] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    if (authUser?.id && !nominees) {
      FetchNominees();
    }
    console.log("nominees", nominees);
  }, [authUser?.id, FetchNominees, nominees]);

  const handleDelete = async (nominee) => {
    const confirmed = await confirmMessage(
      `Delete ${nominee.name} from your nominees?`,
      "Delete nominee",
      "Yes, delete",
    );
    if (!confirmed) return;

    setDeletingId(nominee.nomineeId);
    try {
      const response = await deleteNominee(authUser.id, nominee.nomineeId);
      if (response?.status === "success") {
        await FetchNominees();
      }
    } catch (error) {
      allRounderMessage({
        status: "error",
        message: "Could not delete nominee. Please try again.",
      });
    } finally {
      setDeletingId("");
    }
  };

  return (
    <section className="space-y-5" aria-labelledby="nominees-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-indigo-600" />
            <h3
              id="nominees-heading"
              className="text-lg font-semibold text-gray-800"
            >
              Your nominees
            </h3>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Manage the people who can be linked to your investments.
          </p>
        </div>
        {!showAddForm && !editingNominee && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus size={16} />
            Add nominee
          </button>
        )}
      </div>

      {(showAddForm || editingNominee) && (
        <AddNomineeForm
          nominee={editingNominee}
          onCancel={() => {
            setShowAddForm(false);
            setEditingNominee(null);
          }}
          onSaved={() => {
            setShowAddForm(false);
            setEditingNominee(null);
          }}
        />
      )}

      {nominees?.length === 0 ? (
        <div className="rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          No nominees found.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {nominees?.map((nominee) => (
            <article
              key={nominee.nomineeId}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate font-semibold text-gray-800">
                    {nominee.name}
                  </h4>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-indigo-600">
                    {nominee.relation}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {/*  <button
                    type="button"
                    onClick={() => setEditingNominee(nominee)}
                    aria-label={`Edit ${nominee.name}`}
                    title="Edit nominee"
                    className="rounded-md p-2 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <Pencil size={16} />
                  </button>
                   <button
                    type="button"
                    onClick={() => handleDelete(nominee)}
                    disabled={deletingId === nominee.nomineeId}
                    aria-label={`Delete ${nominee.name}`}
                    title="Delete nominee"
                    className="rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button> */}
                </div>
              </div>
              <dl className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex justify-between gap-3">
                  <dt>Phone</dt>
                  <dd className="font-medium text-gray-800">
                    {formatPhone(nominee.mobileNo)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Aadhaar</dt>
                  <dd className="font-medium text-gray-800">
                    {maskAadhaar(nominee.aadharNo)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
