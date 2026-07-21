import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Banknote, FileText, LayoutDashboard, Loader2, Package, Package2, RefreshCw, Users, WifiOff } from "lucide-react";
import { api, LoginUser, purchaseSupabase, orderSupabase } from "@/api";
import { FreightPayment } from "@/types";
import { FreightForm } from "@/components/FreightForm";
import { FreightTable } from "@/components/FreightTable";
import { FullKittingHistory } from "@/components/FullKittingHistory";
import { OperationsDashboard } from "@/components/OperationsDashboard";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserAllowedTabs, hasAccess } from "@/config/navigation";
import { cn } from "@/lib/utils";

const UserManagementLazy = lazy(() =>
  import("@/components/UserManagement").then((module) => ({ default: module.UserManagement }))
);

const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
  if (typeof toast !== "undefined") {
    toast[type](message);
  } else {
    alert(message);
  }
};

const ACCOUNT_CHECKING_FIRMS = ["RKL", "PURAB", "PMMPL"] as const;

const normalizeFirm = (value: unknown): string => String(value || "").trim().toLowerCase();

const getAccountCheckingFirm = (value: unknown): string => {
  const normalized = normalizeFirm(value);
  const matchedFirm = ACCOUNT_CHECKING_FIRMS.find((firm) => {
    const firmKey = firm.toLowerCase();
    return normalized === firmKey || normalized === `${firmKey} order`;
  });
  return matchedFirm || "";
};

const calculateDelayWithHours = (planned?: string, actual?: string) => {
  if (!planned || !actual) return 0;
  const plannedDate = new Date(planned);
  const actualDate = new Date(actual);
  if (Number.isNaN(plannedDate.getTime()) || Number.isNaN(actualDate.getTime())) return 0;
  const diffHours = Math.ceil((actualDate.getTime() - plannedDate.getTime()) / 3600000);
  return diffHours > 0 ? Number((diffHours / 24).toFixed(2)) : 0;
};

interface FreightDashboardProps {
  user: LoginUser;
  onLogout: () => void;
}

export function FreightDashboard({ user, onLogout }: FreightDashboardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<FreightPayment | undefined>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [formStep, setFormStep] = useState<string>("posting");
  const [isSoftRefreshing, setIsSoftRefreshing] = useState(false);
  const [kittingRefreshTrigger, setKittingRefreshTrigger] = useState(0);

  const handleKittingRefreshDone = useCallback(() => {
    setIsSoftRefreshing(false);
  }, []);

  // Dark mode state — persisted in localStorage
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("dark_mode") === "true";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("dark_mode", String(darkMode));
  }, [darkMode]);

  const isAdmin = user.Role?.toLowerCase() === "admin";
  const userFirm = user["Firm Name"] || "";
  const allowedTabs = useMemo(() => getUserAllowedTabs(user), [user]);

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem("freight_active_tab");
    if (saved && allowedTabs.includes(saved)) return saved;
    const path = window.location.pathname.substring(1);
    if (allowedTabs.includes(path)) return path;
    return allowedTabs[0] || "dashboard";
  });

  const [subTab, setSubTab] = useState<"pending" | "history">("pending");

  useEffect(() => setSubTab("pending"), [activeTab]);

  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0]);
    }
  }, [activeTab, allowedTabs]);

  useEffect(() => {
    localStorage.setItem("freight_active_tab", activeTab);
    const currentPath = window.location.pathname.substring(1);
    if (currentPath !== activeTab) {
      window.history.pushState({}, "", `/${activeTab}`);
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.substring(1);
      if (allowedTabs.includes(path)) setActiveTab(path);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [allowedTabs]);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth < 1024) {
      setMobileSidebarOpen((prev: boolean) => !prev);
    } else {
      setSidebarCollapsed((prev: boolean) => !prev);
    }
  }, []);

  const queryClient = useQueryClient();

  const {
    data: checkKittingPayments = [],
    isLoading: isKittingLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["check-kitting-payments"],
    queryFn: api.getCheckKittingPayments,
    retry: 1,
  });

  const {
    data: postingPayments = [],
    isLoading: isPostingLoading,
  } = useQuery({
    queryKey: ["posting-payments"],
    queryFn: api.getPostingPayments,
    retry: 1,
  });

  const {
    data: makePaymentPayments = [],
    isLoading: isMakePaymentLoading,
  } = useQuery({
    queryKey: ["makepayment-payments"],
    queryFn: api.getMakePaymentPayments,
    retry: 1,
  });

  const {
    data: freightPaymentPayments = [],
    isLoading: isFreightPaymentLoading,
  } = useQuery({
    queryKey: ["freightpayment-payments"],
    queryFn: api.getFreightPaymentPayments,
    retry: 1,
  });

  const {
    data: fullkittingRaw = [],
  } = useQuery({
    queryKey: ["fullkitting-raw-list"],
    queryFn: async () => {
      const { data, error } = await purchaseSupabase
        .from("fullkittin")
        .select('"Lift No", "Bilty Number", "Transporter Bill Image", "Fullkitting Remarks"');
      if (error) throw error;
      return data || [];
    },
    retry: 1,
  });

  const {
    data: dispatchRaw = [],
  } = useQuery({
    queryKey: ["dispatch-raw-list"],
    queryFn: async () => {
      const { data, error } = await orderSupabase
        .from("DISPATCH")
        .select('"D-Sr Number", "Bilty No.", "Transporter Bill Image"');
      if (error) throw error;
      return data || [];
    },
    retry: 1,
  });

  const isLoading = isKittingLoading;

  const filteredKittingPayments = useMemo(() => {
    return isAdmin
      ? checkKittingPayments
      : checkKittingPayments.filter(
          (p) => normalizeFirm(getAccountCheckingFirm(p["Firm Name"]) || p["Firm Name"]) === normalizeFirm(getAccountCheckingFirm(userFirm) || userFirm)
        );
  }, [checkKittingPayments, isAdmin, userFirm]);

  useEffect(() => {
    if (error) {
      showToast("Failed to load data.", "error");
    }
  }, [error]);

  const allPayments = useMemo(() => {
    const merged: FreightPayment[] = [];

    filteredKittingPayments.forEach((kp) => {
      const uniqueNum = kp["Unique Number"];

      const postingMatch = uniqueNum ? postingPayments.find((pp) =>
        pp["Unique Number"]?.trim().toLowerCase() === uniqueNum.trim().toLowerCase()
      ) : undefined;

      const mpMatch = uniqueNum ? makePaymentPayments.find((mp) =>
        mp["Unique Number"]?.trim().toLowerCase() === uniqueNum.trim().toLowerCase()
      ) : undefined;

      const freightMatch = uniqueNum ? freightPaymentPayments.find((fp) =>
        fp["Unique Number"]?.trim().toLowerCase() === uniqueNum.trim().toLowerCase()
      ) : undefined;

      const recordId = freightMatch ? freightMatch.id : (mpMatch ? mpMatch.id : (postingMatch ? postingMatch.id : -kp.id));
      const latestStepMatch = freightMatch || mpMatch || postingMatch;

      let transporterBillImage = kp["Transporter Bill Image"];
      let remark3 = kp.Remark;

      if (!transporterBillImage || !remark3) {
        const liftId = kp["Lift ID"]?.trim().toLowerCase();
        const biltyNo = kp["Bilty Number"]?.trim().toLowerCase();

        // 1. Try Purchase FMS
        const matchedFk = fullkittingRaw.find((fk: any) => {
          const fkLift = fk["Lift No"]?.trim().toLowerCase();
          const fkBilty = fk["Bilty Number"]?.trim().toLowerCase();
          return (liftId && fkLift === liftId) || (biltyNo && fkBilty === biltyNo);
        });
        
        if (matchedFk) {
          if (!transporterBillImage && matchedFk["Transporter Bill Image"]) {
            transporterBillImage = matchedFk["Transporter Bill Image"];
          }
          if (!remark3 && matchedFk["Fullkitting Remarks"]) {
            remark3 = matchedFk["Fullkitting Remarks"];
          }
        }

        // 2. Try Order FMS (DISPATCH) if transporterBillImage still empty
        if (!transporterBillImage) {
          const matchedDispatch = dispatchRaw.find((d: any) => {
            const dSr = d["D-Sr Number"]?.toString().trim().toLowerCase();
            const dBilty = d["Bilty No."]?.toString().trim().toLowerCase();
            return (liftId && dSr === liftId) || (biltyNo && dBilty === biltyNo);
          });
          if (matchedDispatch && matchedDispatch["Transporter Bill Image"]) {
            transporterBillImage = matchedDispatch["Transporter Bill Image"];
          }
        }
      }

      const payment: FreightPayment = {
        id: recordId,
        "Payment Number": kp["Payment Number"] || `KIT-${kp.id}`,
        "Unique Number": kp["Unique Number"] || `KIT-${kp.id}`,
        "Lift ID": kp["Lift ID"],
        "Firm Name": kp["Firm Name"],
        "Fms Name": kp["Fms Name"] || "Account Checking",
        "Transporter Name": latestStepMatch
          ? (freightMatch?.["Transporter Name"] || postingMatch?.["Transporter Name"] || mpMatch?.["Transporter Name"] || kp["Transporter Name"])
          : kp["Transporter Name"],
        "Vehicle Number": kp["Vehicle Number"],
        From: kp.From || "—",
        To: kp.To || "—",
        "Material Load Details": latestStepMatch
          ? (freightMatch?.["Product"] || postingMatch?.["Product"] || mpMatch?.["Product"] || kp["Material Load Details"])
          : kp["Material Load Details"],
        "Bilty Number": kp["Bilty Number"],
        "Rate Type": kp["Rate Type"] || "External",
        Amount: kp.Amount !== undefined && kp.Amount !== null ? Number(kp.Amount) : 0,
        PostingAmount: postingMatch?.Amount !== undefined && postingMatch?.Amount !== null ? Number(postingMatch.Amount) : undefined,
        "Bilty Image": kp["Bilty Image"],
        Timestamp: kp.Timestamp,
        "Party Name": latestStepMatch
          ? (freightMatch?.["Party Name"] || postingMatch?.["Party Name"] || mpMatch?.["Party Name"] || kp["Party Name"])
          : kp["Party Name"],
        "Billing Qty": kp["Billing Qty"] !== undefined && kp["Billing Qty"] !== null ? Number(kp["Billing Qty"]) : undefined,
        "Bill Number": kp["Bill Number"],
        "Transporter Bill Image": transporterBillImage,

        Status3: "Completed",
        Actual3: kp.Actual3 || kp.Actual || kp.Timestamp,
        Delay3: kp.Delay3 ?? kp.Delay ?? 0,
        Planned3: kp.Planned3 || kp.Planned || kp.Timestamp,
        Remark3: remark3,

        Status_1: postingMatch ? (postingMatch.Status || "Pending") : "Pending",
        Planned: kp.Planned || kp.Timestamp,
        Actual: postingMatch ? (postingMatch.created_at || kp.Actual) : kp.Actual,
        Delay: postingMatch ? (postingMatch.Delay ?? 0) : (kp.Delay ?? 0),
        Remark_1: postingMatch ? postingMatch.Remark : "",
        "Audit Image": postingMatch ? postingMatch["Audit Image"] : "",

        Status2: mpMatch ? (mpMatch.Status || "Pending") : null,
        Planned2: kp.Planned2,
        Actual2: mpMatch ? (mpMatch.created_at || kp.Actual2) : kp.Actual2,
        Delay2: mpMatch ? (mpMatch.Delay ?? 0) : (kp.Delay2 ?? 0),
        Remark2: mpMatch ? mpMatch.Remark : "",

        Status: freightMatch ? (freightMatch.Status || "Pending") : "Pending",
        Actual4: freightMatch ? freightMatch.created_at : undefined,
        Delay4: freightMatch ? (freightMatch.Delay ?? 0) : 0,
        Remark: freightMatch ? freightMatch.Remark : "",
      };

      merged.push(payment);
    });

    return merged;
  }, [filteredKittingPayments, postingPayments, makePaymentPayments, freightPaymentPayments, fullkittingRaw, dispatchRaw]);

  const isDone = useCallback((s?: string | null) => {
    const n = String(s || "").trim().toLowerCase();
    return n === "done" || n === "completed";
  }, []);

  const payments = useMemo(() => {
    return allPayments.filter((payment) => {
      if (activeTab === "checkkitting") {
        if (String(payment["Transporter Name"] || "").trim().toLowerCase() === "for") {
          return false;
        }
        if (subTab === "history") return isDone(payment.Status3);
        return !isDone(payment.Status3);
      }
      if (activeTab === "posting") {
        if (subTab === "history") return isDone(payment.Status_1);
        const isKittingDone = isDone(payment.Status3);
        return isKittingDone && !isDone(payment.Status_1);
      }
      if (activeTab === "makepayment") {
        if (subTab === "history") return isDone(payment.Status2);
        const isPostingDone = isDone(payment.Status_1);
        const isMakePaymentDone = isDone(payment.Status2);
        return isPostingDone && !isMakePaymentDone;
      }
      if (activeTab === "freight") {
        if (subTab === "history") return isDone(payment.Status);
        const isMakePaymentDone = isDone(payment.Status2);
        return isMakePaymentDone && !isDone(payment.Status);
      }
      return true;
    });
  }, [allPayments, activeTab, subTab, isDone]);

  // Computed pending counts for sidebar badges
  const pendingPosting = allPayments.filter((p) => isDone(p.Status3) && !isDone(p.Status_1)).length;
  const pendingMakePayment = allPayments.filter((p) => isDone(p.Status_1) && !isDone(p.Status2)).length;
  const pendingFreight = allPayments.filter((p) => isDone(p.Status2) && !isDone(p.Status)).length;
  const delayedCount = allPayments.filter((p) => (p.Delay || 0) > 0 || (p.Delay2 || 0) > 0 || (p.Delay4 || 0) > 0).length;

  const pageTitle = useMemo(() => {
    switch (activeTab) {
      case "posting": return "Account Audit";
      case "makepayment": return "Posting";
      case "checkkitting": return "Account Checking";
      case "dashboard": return "Dashboard";
      case "users": return "User Management";
      default: return "Freight Payments";
    }
  }, [activeTab]);

  const pageDescription = useMemo(() => {
    const firmLabel = isAdmin ? "All firms" : userFirm;
    switch (activeTab) {
      case "posting": return `Review pending account audit entries • ${firmLabel}`;
      case "makepayment": return `Entries awaiting posting • ${firmLabel}`;
      case "checkkitting": return `Verify account checking status • ${firmLabel}`;
      case "dashboard": return `Overview of freight operations • ${firmLabel}`;
      case "users": return "Manage users, roles, and page access";
      default: return `${payments.length} active records • ${firmLabel}`;
    }
  }, [activeTab, isAdmin, userFirm, payments.length]);

  const handleEdit = useCallback((payment: FreightPayment, targetStep?: string) => {
    setEditingPayment(payment);
    if (targetStep) {
      setFormStep(targetStep);
    } else {
      setFormStep(
        activeTab === "makepayment" ? "payment" : activeTab === "checkkitting" ? "kitting" : "posting"
      );
    }
    setIsFormOpen(true);
  }, [activeTab]);

  const quickUpdateMutation = useMutation({
    mutationFn: async ({ data, step }: { data: (Partial<FreightPayment> & { id: number }) | (Partial<FreightPayment> & { id: number })[]; step: string }) => {
      const items = Array.isArray(data) ? data : [data];
      const results = [];
      for (const item of items) {
        let res;
        if (step === "posting") {
          const uniqueNumber = item["Unique Number"] ||
            allPayments.find((p) => p.id === item.id)?.["Unique Number"];
          const postingMatch = uniqueNumber ? postingPayments.find((pp) =>
            pp["Unique Number"]?.trim().toLowerCase() === uniqueNumber.trim().toLowerCase()
          ) : undefined;
          if (postingMatch?.id) {
            res = await api.updatePostingPayment(postingMatch.id, item);
          } else {
            const original = allPayments.find((p) => p.id === item.id);
            const merged = original ? { ...original, ...item } : item;
            res = await api.createPostingPayment(merged);
          }
        } else if (step === "makepayment") {
          const uniqueNumber = item["Unique Number"] ||
            allPayments.find((p) => p.id === item.id)?.["Unique Number"];
          const mpMatch = uniqueNumber ? makePaymentPayments.find((mp) =>
            mp["Unique Number"]?.trim().toLowerCase() === uniqueNumber.trim().toLowerCase()
          ) : undefined;
          if (mpMatch?.id) {
            res = await api.updateMakePaymentPayment(mpMatch.id, item);
          } else {
            const original = allPayments.find((p) => p.id === item.id);
            const merged = original ? { ...original, ...item } : item;
            res = await api.createMakePaymentPayment(merged);
          }
        } else if (step === "freight") {
          const uniqueNumber = item["Unique Number"] ||
            allPayments.find((p) => p.id === item.id)?.["Unique Number"];
          const freightMatch = uniqueNumber ? freightPaymentPayments.find((fp) =>
            fp["Unique Number"]?.trim().toLowerCase() === uniqueNumber.trim().toLowerCase()
          ) : undefined;
          if (freightMatch?.id) {
            res = await api.updateFreightPaymentRecord(freightMatch.id, item);
          } else {
            const original = allPayments.find((p) => p.id === item.id);
            const merged = original ? { ...original, ...item } : item;
            res = await api.createFreightPaymentPayment(merged);
          }
        } else {
          const uniqueNumber = item["Unique Number"] ||
            allPayments.find((p) => p.id === item.id)?.["Unique Number"];
          const kittingRecord = checkKittingPayments.find((kp) =>
            kp["Unique Number"] && uniqueNumber &&
            kp["Unique Number"].trim().toLowerCase() === uniqueNumber.trim().toLowerCase()
          );
          if (kittingRecord?.id) {
            const { id, created_at, ...updateData } = item as any;
            res = await api.processKittingPayment({ ...updateData, "Unique Number": kittingRecord["Unique Number"] });
          } else {
            res = item;
          }
        }
        results.push(res);
      }
      return Array.isArray(data) ? results : results[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-kitting-payments"] });
      queryClient.invalidateQueries({ queryKey: ["posting-payments"] });
      queryClient.invalidateQueries({ queryKey: ["makepayment-payments"] });
      queryClient.invalidateQueries({ queryKey: ["freightpayment-payments"] });
      showToast("Status updated successfully", "success");
    },
    onError: () => {
      showToast("Failed to update status", "error");
    },
  });

  const handleQuickUpdate = useCallback(
    (
      payment: FreightPayment | FreightPayment[],
      step: string,
      value: "yes" | "no",
      actualDate?: string,
      selectedStatus?: string,
      remark?: string,
      amount?: number | number[],
      auditImage?: string
    ) => {
      const today = actualDate || new Date().toISOString();
      const payments = Array.isArray(payment) ? payment : [payment];
      const amounts = Array.isArray(amount) ? amount : Array(payments.length).fill(amount);

      const updateDataArray = payments.map((p, idx) => {
        const updateData: Partial<FreightPayment> & { id: number } = { id: p.id! };
        const amt = amounts[idx];

        if (step === "checkkitting") {
          updateData.Status3 = selectedStatus || (value === "yes" ? "Done" : "Not Done");
          if (remark !== undefined) updateData.Remark3 = remark;
          if (value === "yes") {
            updateData.Actual3 = today;
            updateData.Actual = today;
            updateData.Status_1 = "Not Done";
            updateData.Status = "Not Done";
            updateData.Planned2 = today;
            updateData.Status2 = "Not Done";
          }
        } else if (step === "posting") {
          const finalStatus = selectedStatus || (value === "yes" ? "Done" : "Not Done");
          updateData.Status_1 = finalStatus;
          if (amt !== undefined) updateData.Amount = amt;
          if (remark !== undefined) updateData.Remark_1 = remark;
          if (auditImage !== undefined) updateData["Audit Image"] = auditImage;
          if (finalStatus === "Done") {
            updateData.Actual = today;
            updateData.Delay = calculateDelayWithHours(p.Planned, today);
          }
        } else if (step === "makepayment" || step === "payment") {
          updateData.Status2 = selectedStatus || (value === "yes" ? "Done" : "Not Done");
          if (remark !== undefined) updateData.Remark2 = remark;
          if (value === "yes") {
            updateData.Actual2 = today;
            updateData.Delay2 = calculateDelayWithHours(p.Planned2, today);
          }
        } else if (step === "freight") {
          updateData.Status = selectedStatus || (value === "yes" ? "Done" : "Not Done");
          if (remark !== undefined) updateData.Remark = remark;
          if (value === "yes") {
            updateData.Actual4 = today;
            updateData.Delay4 = calculateDelayWithHours(p.Actual4 || p.Actual2, today);
          }
        }
        return updateData;
      });

      quickUpdateMutation.mutate({
        data: Array.isArray(payment) ? updateDataArray : updateDataArray[0],
        step,
      });
    },
    [quickUpdateMutation, allPayments, postingPayments, makePaymentPayments, freightPaymentPayments, checkKittingPayments]
  );

  const handleNavigate = useCallback(
    (tab: string) => {
      if (hasAccess(user, tab)) {
        setActiveTab(tab);
        setMobileSidebarOpen(false);
      }
    },
    [user]
  );

  const handleLogoutWithConfirm = useCallback(() => {
    if (window.confirm("Are you sure you want to log out?")) {
      onLogout();
    }
  }, [onLogout]);

  if (isLoading && checkKittingPayments.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-[oklch(0.12_0.008_247)]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">Loading freight data…</p>
          </div>
          {/* Skeleton rows */}
          <div className="mt-2 w-64 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-8 rounded-lg" style={{ opacity: 1 - i * 0.2 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[oklch(0.12_0.008_247)] relative">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full z-30 transition-transform duration-300 ease-in-out",
          "lg:static lg:h-screen",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <AppSidebar
          collapsed={sidebarCollapsed}
          activeTab={activeTab}
          allowedTabs={allowedTabs}
          user={user}
          onNavigate={handleNavigate}
          onLogout={handleLogoutWithConfirm}
          totalCount={allPayments.length}
          pendingPosting={pendingPosting}
          pendingMakePayment={pendingMakePayment}
          pendingFreight={pendingFreight}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <AppHeader
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          pageTitle={pageTitle}
          pageDescription={pageDescription}
          isAdmin={isAdmin}
          userFirm={userFirm}
          user={user}
          onLogout={handleLogoutWithConfirm}
          delayedCount={delayedCount}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
        />

        <main className="flex-1 overflow-y-auto main-scroll pb-16 lg:pb-0">
          <div className="p-3 md:p-4 max-w-[1600px] mx-auto space-y-3 md:space-y-4 animate-fade-in">
            {activeTab === "dashboard" ? (
              <OperationsDashboard payments={allPayments} onNavigate={handleNavigate} onRefresh={() => refetch()} />
            ) : activeTab === "users" ? (
              <Suspense
                fallback={
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                  </div>
                }
              >
                <UserManagementLazy />
              </Suspense>
            ) : (
              <div className="bg-white dark:bg-[oklch(0.16_0.006_247)] border border-slate-200/80 dark:border-white/6 rounded-xl shadow-sm overflow-hidden">
                <Tabs value={subTab} onValueChange={(val) => setSubTab(val as any)} className="w-full">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/6 bg-white dark:bg-[oklch(0.16_0.006_247)] flex items-center justify-between flex-wrap gap-2">
                    <TabsList className="h-8 bg-slate-100/80 dark:bg-white/6 rounded-lg">
                      <TabsTrigger
                        value="pending"
                        className="rounded-md px-3.5 py-1 text-[11px] font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-brand-700 dark:data-[state=active]:text-brand-400 data-[state=active]:shadow-sm transition-all h-6"
                      >
                        Pending
                      </TabsTrigger>
                      <TabsTrigger
                        value="history"
                        className="rounded-md px-3.5 py-1 text-[11px] font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-brand-700 dark:data-[state=active]:text-brand-400 data-[state=active]:shadow-sm transition-all h-6"
                      >
                        History
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-[9.5px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider">
                        {error ? (
                          <>
                            <WifiOff className="w-3 h-3 text-rose-500" />
                            <span className="text-rose-500">Offline mode</span>
                          </>
                        ) : (
                          <>
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                            <span>Live sync</span>
                          </>
                        )}
                      </div>

                      {activeTab === "checkkitting" && (
                        <button
                          onClick={async () => {
                            if (!isSoftRefreshing) {
                              setIsSoftRefreshing(true);
                              setKittingRefreshTrigger((prev) => prev + 1);
                              try {
                                await refetch();
                              } catch (e) {
                                console.error(e);
                              } finally {
                                if (subTab === "history") {
                                  setIsSoftRefreshing(false);
                                }
                              }
                            }
                          }}
                          disabled={isSoftRefreshing}
                          className="flex items-center justify-center p-1 rounded-md text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95 transition-all disabled:opacity-50"
                          title="Soft Refresh"
                        >
                          <RefreshCw
                            className={cn(
                              "w-3.5 h-3.5",
                              isSoftRefreshing && "animate-spin text-brand-500"
                            )}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  <TabsContent value="pending" className="mt-0">
                    {activeTab === "checkkitting" ? (
                      <FullKittingHistory
                        refreshTrigger={kittingRefreshTrigger}
                        onRefreshDone={handleKittingRefreshDone}
                      />
                    ) : (
                      <FreightTable
                        payments={payments}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onQuickUpdate={handleQuickUpdate}
                        activeTab={activeTab}
                        subTab={subTab}
                      />
                    )}
                  </TabsContent>
                  <TabsContent value="history" className="mt-0">
                    <FreightTable
                      payments={payments}
                      isLoading={isLoading}
                      onEdit={handleEdit}
                      onQuickUpdate={handleQuickUpdate}
                      activeTab={activeTab}
                      subTab={subTab}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 mobile-nav-bg border-t border-slate-200 dark:border-white/6 safe-pb">
        <div className="flex items-stretch justify-around px-1 py-1">
          {allowedTabs.slice(0, 5).map((tab: string) => {
            const tabConfig: Record<string, { icon: React.ElementType; label: string }> = {
              dashboard: { icon: LayoutDashboard, label: "Home" },
              checkkitting: { icon: Package, label: "Check" },
              posting: { icon: FileText, label: "Audit" },
              makepayment: { icon: Banknote, label: "Post" },
              freight: { icon: Package2, label: "Freight" },
              users: { icon: Users, label: "Users" },
            };
            const config = tabConfig[tab] || { icon: LayoutDashboard, label: tab };
            const Icon = config.icon;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleNavigate(tab)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl flex-1 transition-all active:scale-90",
                  isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-400 dark:text-slate-600"
                )}
              >
                <div className={cn("p-1.5 rounded-xl transition-all", isActive ? "bg-brand-50 dark:bg-brand-900/30" : "")}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className={cn("text-[9px] font-bold leading-none", isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-400 dark:text-slate-600")}>
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <FreightForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        payment={editingPayment}
        defaultStep={formStep}
        userFirm={isAdmin ? undefined : userFirm}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["check-kitting-payments"] });
          queryClient.invalidateQueries({ queryKey: ["posting-payments"] });
          queryClient.invalidateQueries({ queryKey: ["makepayment-payments"] });
          queryClient.invalidateQueries({ queryKey: ["freightpayment-payments"] });
          setIsFormOpen(false);
        }}
      />
    </div>
  );
}
