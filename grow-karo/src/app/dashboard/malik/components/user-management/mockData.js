import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircleIcon,
  Share,
} from "lucide-react";

export const SCHEMES = [
  "Growth Bond Plan",
  "Fixed Income Series A",
  "Retirement Secure",
  "Senior Citizen Bond",
];

export const STATUS_META = {
  active: {
    label: "Active",
    icon: ShieldCheck,
    className: "text-emerald-400 bg-emerald-400/10 ring-emerald-400/30",
  },
  pending: {
    label: "Pending",
    icon: ShieldAlert,
    className: "text-amber-400 bg-amber-400/10 ring-amber-400/30",
  },
  rejected: {
    label: "rejected",
    icon: ShieldX,
    className: "text-rose-400 bg-rose-400/10 ring-rose-400/30",
  },
  withdrawn: {
    label: "withdrawn",
    icon: Share,
    className: "text-rose-400 bg-rose-400/10 ring-rose-400/30",
  },
  matured: {
    label: "matured",
    icon: CheckCircleIcon,
    className: "text-blue-500 bg-blue-500/10 ring-blue-500/30",
  },
  suspended: {
    label: "Suspended",
    icon: ShieldX,
    className: "text-rose-400 bg-rose-400/10 ring-rose-400/30",
  },
};

export const USERS = [
  {
    userSchemeId: "USR-1042",
    name: "Ananya Sharma",
    email: "ananya.sharma@mail.com",
    phone: "+91 98765 43210",
    status: "active",
    enrollmentDate: "2023-03-12",
    scheme: "Growth Bond Plan",
    bonds: [
      {
        userSchemeId: "BND-88213",
        paidAmount: 250000,
        profitPercentage: 7.25,
        maturityDate: "2028-03-12",
        status: "active",
        payoutCycle: "Monthly",
      },
      {
        userSchemeId: "BND-88214",
        paidAmount: 100000,
        profitPercentage: 7.1,
        maturityDate: "2027-09-01",
        status: "active",
        payoutCycle: "yearly",
      },
    ],
  },
  {
    userSchemeId: "USR-1043",
    name: "Rohan Mehta",
    email: "rohan.mehta@mail.com",
    phone: "+91 91234 56789",
    status: "pending",
    enrollmentDate: "2024-01-08",
    scheme: "Fixed Income Series A",
    bonds: [
      {
        userSchemeId: "BND-90031",
        paidAmount: 500000,
        profitPercentage: 6.9,
        maturityDate: "2029-01-08",
        status: "pending",
        payoutCycle: "Half-yearly",
      },
    ],
  },
  {
    userSchemeId: "USR-1044",
    name: "Priya Nair",
    email: "priya.nair@mail.com",
    phone: "+91 90000 11122",
    status: "active",
    enrollmentDate: "2022-11-27",
    scheme: "Retirement Secure",
    bonds: [
      {
        userSchemeId: "BND-71098",
        paidAmount: 300000,
        profitPercentage: 7.5,
        maturityDate: "2032-11-27",
        status: "active",
        payoutCycle: "Monthly",
      },
      {
        userSchemeId: "BND-71099",
        paidAmount: 150000,
        profitPercentage: 7.5,
        maturityDate: "2032-11-27",
        status: "active",
        payoutCycle: "yearly",
      },
      {
        userSchemeId: "BND-71100",
        paidAmount: 75000,
        profitPercentage: 7.4,
        maturityDate: "2030-04-15",
        status: "active",
        payoutCycle: "Quarterly",
      },
    ],
  },
  {
    userSchemeId: "USR-1045",
    name: "Vikram Singh",
    email: "vikram.singh@mail.com",
    phone: "+91 99887 76655",
    status: "matured",
    enrollmentDate: "2021-06-19",
    scheme: "Senior Citizen Bond",
    bonds: [
      {
        userSchemeId: "BND-55210",
        paidAmount: 400000,
        profitPercentage: 8.0,
        maturityDate: "2026-06-19",
        status: "matured",
        payoutCycle: "Monthly",
      },
    ],
  },
  {
    userSchemeId: "USR-1046",
    name: "Kavya Reddy",
    email: "kavya.reddy@mail.com",
    phone: "+91 93456 78901",
    status: "active",
    enrollmentDate: "2024-05-02",
    scheme: "Growth Bond Plan",
    bonds: [
      {
        userSchemeId: "BND-93312",
        paidAmount: 120000,
        profitPercentage: 7.15,
        maturityDate: "2029-05-02",
        status: "active",
        payoutCycle: "Monthly",
      },
    ],
  },
  {
    userSchemeId: "USR-1047",
    name: "Arjun Desai",
    email: "arjun.desai@mail.com",
    phone: "+91 97654 32109",
    status: "pending",
    enrollmentDate: "2024-07-21",
    scheme: "Fixed Income Series A",
    bonds: [],
  },
];
