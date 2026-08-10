import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircleIcon,
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
    id: "USR-1042",
    name: "Ananya Sharma",
    email: "ananya.sharma@mail.com",
    phone: "+91 98765 43210",
    status: "active",
    joined: "2023-03-12",
    scheme: "Growth Bond Plan",
    bonds: [
      {
        id: "BND-88213",
        principal: 250000,
        rate: 7.25,
        maturity: "2028-03-12",
        status: "active",
        payoutCycle: "Monthly",
      },
      {
        id: "BND-88214",
        principal: 100000,
        rate: 7.1,
        maturity: "2027-09-01",
        status: "active",
        payoutCycle: "yearly",
      },
    ],
  },
  {
    id: "USR-1043",
    name: "Rohan Mehta",
    email: "rohan.mehta@mail.com",
    phone: "+91 91234 56789",
    status: "pending",
    joined: "2024-01-08",
    scheme: "Fixed Income Series A",
    bonds: [
      {
        id: "BND-90031",
        principal: 500000,
        rate: 6.9,
        maturity: "2029-01-08",
        status: "pending",
        payoutCycle: "Half-yearly",
      },
    ],
  },
  {
    id: "USR-1044",
    name: "Priya Nair",
    email: "priya.nair@mail.com",
    phone: "+91 90000 11122",
    status: "active",
    joined: "2022-11-27",
    scheme: "Retirement Secure",
    bonds: [
      {
        id: "BND-71098",
        principal: 300000,
        rate: 7.5,
        maturity: "2032-11-27",
        status: "active",
        payoutCycle: "Monthly",
      },
      {
        id: "BND-71099",
        principal: 150000,
        rate: 7.5,
        maturity: "2032-11-27",
        status: "active",
        payoutCycle: "yearly",
      },
      {
        id: "BND-71100",
        principal: 75000,
        rate: 7.4,
        maturity: "2030-04-15",
        status: "active",
        payoutCycle: "Quarterly",
      },
    ],
  },
  {
    id: "USR-1045",
    name: "Vikram Singh",
    email: "vikram.singh@mail.com",
    phone: "+91 99887 76655",
    status: "matured",
    joined: "2021-06-19",
    scheme: "Senior Citizen Bond",
    bonds: [
      {
        id: "BND-55210",
        principal: 400000,
        rate: 8.0,
        maturity: "2026-06-19",
        status: "matured",
        payoutCycle: "Monthly",
      },
    ],
  },
  {
    id: "USR-1046",
    name: "Kavya Reddy",
    email: "kavya.reddy@mail.com",
    phone: "+91 93456 78901",
    status: "active",
    joined: "2024-05-02",
    scheme: "Growth Bond Plan",
    bonds: [
      {
        id: "BND-93312",
        principal: 120000,
        rate: 7.15,
        maturity: "2029-05-02",
        status: "active",
        payoutCycle: "Monthly",
      },
    ],
  },
  {
    id: "USR-1047",
    name: "Arjun Desai",
    email: "arjun.desai@mail.com",
    phone: "+91 97654 32109",
    status: "pending",
    joined: "2024-07-21",
    scheme: "Fixed Income Series A",
    bonds: [],
  },
];
