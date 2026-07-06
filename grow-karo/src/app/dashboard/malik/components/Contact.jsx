import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  Send, 
  X, 
  CheckCircle2, 
  Loader2, 
  Users 
} from 'lucide-react';

const initialContacts = [
  { id: 1, name: 'Prince Sharma', role: 'Finance', email: 'finance.lead@growkaro.com', phone: '+91 98765 43211', avatar: 'AS' },
  { id: 2, name: 'Anand Raj', role: 'Developer', email: 'growkaroanand@gmail.com', phone: '+91 7254831884', avatar: 'RV' },
  { id: 3, name: 'Sumit Kumar', role: 'Manager', email: 'manager@growkaro.com', phone: '+91 98765 43213', avatar: 'SM' },
  { id: 4, name: 'Suraj Sharma', role: 'Remitter', email: 'remit.lead@growkaro.com', phone: '+91 98765 43214', avatar: 'FS' },
  { id: 5, name: 'Abhishek Anand', role: 'Receptionist', email: 'reception@growkaro.com', phone: '+91 98765 43215', avatar: 'PH' },
];

export default function ContactsComponent() {
  const [contacts] = useState(initialContacts);
  const [selectedRole, setSelectedRole] = useState('All');
  
  // Modal & Async Status States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'success'
  const [modalData, setModalData] = useState({ toName: '', toEmail: '', subject: '', body: '', isBroadcast: false });

  const roles = ['All', 'Finance', 'Developer', 'Manager', 'Remitter', 'Receptionist'];

  const filteredContacts = selectedRole === 'All' 
    ? contacts 
    : contacts.filter(c => c.role === selectedRole);

  // Open single recipient modal
  const handleOpenEmailModal = (contact) => {
    setStatus('idle');
    setModalData({
      toName: contact.name,
      toEmail: contact.email,
      subject: `[Vantage Admin] Internal Operational Notice`,
      body: `Hi ${contact.name},\n\n`,
      isBroadcast: false
    });
    setIsModalOpen(true);
  };

  // Open bulk team broadcast modal
  const handleOpenBroadcastModal = () => {
    setStatus('idle');
    const allEmails = contacts.map(c => c.email).join(', ');
    setModalData({
      toName: 'All Team Leaders',
      toEmail: allEmails,
      subject: '[Vantage Broadcast] Urgent Core Team Update',
      body: 'Hello Team,\n\nPlease review the following priority updates:\n\n',
      isBroadcast: true
    });
    setIsModalOpen(true);
  };

  // Simulated Asynchronous Dispatch Action
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setStatus('sending');

    // Simulate Network Request Delay
    await new Promise((resolve) => setTimeout(resolve, 1800));
    
    setStatus('success');

    // Automatically trigger native email fallback protocol & close modal after success view
    setTimeout(() => {
      const mailtoUrl = `mailto:${modalData.toEmail}?subject=${encodeURIComponent(modalData.subject)}&body=${encodeURIComponent(modalData.body)}`;
      window.location.href = mailtoUrl;
      setIsModalOpen(false);
      setStatus('idle');
    }, 1200);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-[#0a0f1d] rounded-xl shadow-xl border border-slate-800 text-slate-100 relative animate-[fadeIn_0.3s_ease-out]">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}} />

      {/* Header Panel */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Team Contacts</h2>
          <p className="text-sm text-slate-400">Manage and quickly connect with your key operational leaders.</p>
        </div>
        
        {/* Bulk Broadcast Trigger */}
        <button 
          type="button"
          onClick={handleOpenBroadcastModal}
          className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm self-start md:self-auto gap-2 group"
        >
          <Users className="w-4 h-4 group-hover:scale-105 transition-transform" />
          Broadcast to All Leads
        </button>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex border-b border-slate-800 mb-6 overflow-x-auto space-x-2 scrollbar-none">
        {roles.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setSelectedRole(role)}
            className={`py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all duration-200 ${
              selectedRole === role
                ? 'border-emerald-500 text-emerald-400 font-semibold bg-emerald-950/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map((contact) => (
          <div 
            key={contact.id} 
            className="p-5 bg-slate-900/60 bg-linear-to-b from-slate-800/40 to-slate-900/80 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-md font-bold text-emerald-400">
                  {contact.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">{contact.name}</h3>
                  <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-medium rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {contact.role}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 mb-6">
                <p className="truncate">
                  <span className="font-medium text-slate-500 mr-2">Email:</span> {contact.email}
                </p>
                <p>
                  <span className="font-medium text-slate-500 mr-2">Phone:</span> {contact.phone}
                </p>
              </div>
            </div>

            {/* Action Matrix */}
            <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-4">
              <a 
                href={`tel:${contact.phone}`}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#0e1726] hover:bg-emerald-950/30 text-slate-300 hover:text-emerald-400 border border-slate-800 transition-all group gap-1"
              >
                <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium tracking-wide">Call</span>
              </a>

              <button 
                type="button"
                onClick={() => handleOpenEmailModal(contact)}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#0e1726] hover:bg-amber-950/30 text-slate-300 hover:text-amber-400 border border-slate-800 transition-all group gap-1"
              >
                <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium tracking-wide">Email</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* COMPOSER MODAL WITH REQUEST STATES */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-xl bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl text-slate-100 overflow-hidden relative min-h-75 flex flex-col justify-between">
            
            {/* 1. IDLE STATE: Form Content */}
            {status === 'idle' && (
              <>
                <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${modalData.isBroadcast ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <h3 className="text-sm font-semibold text-white">
                      {modalData.isBroadcast ? 'New Core Team Broadcast' : `Direct Message to ${modalData.toName}`}
                    </h3>
                  </div>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSendEmail} className="p-4 space-y-4 flex-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Recipients</label>
                    <input type="text" value={modalData.toEmail} disabled className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-xs text-slate-500 cursor-not-allowed truncate" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Subject Heading</label>
                    <input 
                      type="text" 
                      value={modalData.subject} 
                      onChange={(e) => setModalData({ ...modalData, subject: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Message Body</label>
                    <textarea 
                      rows={5}
                      value={modalData.body}
                      onChange={(e) => setModalData({ ...modalData, body: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none font-sans"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-850">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-800 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-900 transition-all">
                      Discard
                    </button>
                    <button
                      type="submit"
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-lg shadow transition-all ${
                        modalData.isBroadcast ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      {modalData.isBroadcast ? 'Launch Broadcast' : 'Send Memo'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* 2. SENDING REQUEST STATE */}
            {status === 'sending' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 my-auto animate-[fadeIn_0.2s_ease-out]">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                <div>
                  <h4 className="text-base font-semibold text-white">Sending Request...</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">Establishing gateway connection to securely dispatch your team notice.</p>
                </div>
              </div>
            )}

            {/* 3. SENT REQUEST SUCCESS STATE */}
            {status === 'success' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 my-auto animate-[fadeIn_0.2s_ease-out]">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-[scaleIn_0.3s_ease-out]" />
                <div>
                  <h4 className="text-base font-semibold text-emerald-400">Sent Successfully!</h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs">
                    The requested {modalData.isBroadcast ? 'broadcast roster' : 'operational memo'} has been generated and dispatched.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}