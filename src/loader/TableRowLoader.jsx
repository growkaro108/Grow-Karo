import React from 'react'

export const TableRowLoader = ({ colSpan, loading }) => {
    return (
        <tr>
            <td colSpan={colSpan} className="p-12 text-center text-slate-500 font-medium">
                <div className="flex items-center justify-center gap-3">
                    <span className="w-5 h-5 border-b-2 border-cyan-500 animate-spin rounded-full"></span>
                    <span>Loading {loading}...</span>
                </div>
            </td>
        </tr>
    )
}
