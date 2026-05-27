import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Banknote, FileText, LayoutDashboard, Loader2, Package, Package2, Users, WifiOff } from "lucide-react";
import { api, LoginUser } from "@/api";
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

  // isLoading now tracks the kitting query (primary data source)
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

  // All payments are derived purely from AccountChecking (source of truth) + AccountAudit + Posting + FreightPayment tables
  // The old freightpayemnt table has been deleted
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

      // ID priority: FreightPayment row > MakePayment row > Posting row > virtual negative
      const recordId = freightMatch ? freightMatch.id : (mpMatch ? mpMatch.id : (postingMatch ? postingMatch.id : -kp.id));
      const latestStepMatch = freightMatch || mpMatch || postingMatch;

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

        // Kitting step — always Completed since record exists in CheckKitting
        Status3: "Completed",
        Actual3: kp.Actual3 || kp.Actual || kp.Timestamp,
        Delay3: kp.Delay3 ?? kp.Delay ?? 0,
        Planned3: kp.Planned3 || kp.Planned || kp.Timestamp,
        Remark3: kp.Remark,

        // Posting step — from Posting table if matched, else Pending
        Status_1: postingMatch ? (postingMatch.Status || "Pending") : "Pending",
        Planned: kp.Planned || kp.Timestamp,
        Actual: postingMatch ? (postingMatch.created_at || kp.Actual) : kp.Actual,
        Delay: postingMatch ? (postingMatch.Delay ?? 0) : (kp.Delay ?? 0),
        Remark_1: postingMatch ? postingMatch.Remark : "",

        // Make Payment step — from MakePayment table if matched, else null (no record yet)
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
  }, [filteredKittingPayments, postingPayments, makePaymentPayments, freightPaymentPayments]);

  const payments = useMemo(() => {
    return allPayments.filter((payment) => {
      if (activeTab === "checkkitting") {
        if (subTab === "history") return payment.Status3 === "Done" || payment.Status3 === "Completed";
        return payment.Status3 !== "Done" && payment.Status3 !== "Completed";
      }
      if (activeTab === "posting") {
        if (subTab === "history") return payment.Status_1 === "Done" || payment.Status_1 === "Completed";
        const isKittingDone = payment.Status3 === "Done" || payment.Status3 === "Completed";
        return isKittingDone && payment.Status_1 !== "Done" && payment.Status_1 !== "Completed";
      }
      if (activeTab === "makepayment") {
        if (subTab === "history") return payment.Status2 === "Completed" || payment.Status2 === "Done";
        // Pending: posting done AND makepayment not yet done (Status2 null means no MakePayment row yet)
        const isPostingDone = payment.Status_1 === "Done" || payment.Status_1 === "Completed";
        const isMakePaymentDone = payment.Status2 === "Done" || payment.Status2 === "Completed";
        return isPostingDone && !isMakePaymentDone;
      }
      if (activeTab === "freight") {
        if (subTab === "history") return payment.Status === "Completed" || payment.Status === "Done";
        // Only show in Freight when MakePayment step is Done/Completed
        const isMakePaymentDone = payment.Status2 === "Done" || payment.Status2 === "Completed";
        return isMakePaymentDone && payment.Status !== "Completed" && payment.Status !== "Done";
      }
      return true;
    });
  }, [allPayments, activeTab, subTab]);

  const pageTitle = useMemo(() => {
    switch (activeTab) {
      case "posting":
        return "Account Audit";
      case "makepayment":
        return "Posting";
      case "checkkitting":
        return "Account Checking";
      case "dashboard":
        return "Dashboard";
      case "users":
        return "User Management";
      default:
        return "Freight Payments";
    }
  }, [activeTab]);

  const pageDescription = useMemo(() => {
    const firmLabel = isAdmin ? "All firms" : userFirm;
    switch (activeTab) {
      case "posting":
        return `Review pending account audit entries • ${firmLabel}`;
      case "makepayment":
        return `Entries awaiting posting • ${firmLabel}`;
      case "checkkitting":
        return `Verify account checking status • ${firmLabel}`;
      case "dashboard":
        return `Overview of freight operations • ${firmLabel}`;
      case "users":
        return "Manage users, roles, and page access";
      default:
        return `${payments.length} active records • ${firmLabel}`;
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
    mutationFn: ({ data, step }: { data: Partial<FreightPayment> & { id: number }; step: string }) => {
      // Posting-step updates go to the Posting table
      if (step === "posting") {
        const uniqueNumber = data["Unique Number"] ||
          allPayments.find((p) => p.id === data.id)?.["Unique Number"];
        const postingMatch = uniqueNumber ? postingPayments.find((pp) =>
          pp["Unique Number"]?.trim().toLowerCase() === uniqueNumber.trim().toLowerCase()
        ) : undefined;
        if (postingMatch?.id) {
          return api.updatePostingPayment(postingMatch.id, data);
        }
        const original = allPayments.find((p) => p.id === data.id);
        const merged = original ? { ...original, ...data } : data;
        return api.createPostingPayment(merged);
      }
      // MakePayment-step updates go to the MakePayment table
      if (step === "makepayment") {
        const uniqueNumber = data["Unique Number"] ||
          allPayments.find((p) => p.id === data.id)?.["Unique Number"];
        const mpMatch = uniqueNumber ? makePaymentPayments.find((mp) =>
          mp["Unique Number"]?.trim().toLowerCase() === uniqueNumber.trim().toLowerCase()
        ) : undefined;
        if (mpMatch?.id) {
          return api.updateMakePaymentPayment(mpMatch.id, data);
        }
        // No MakePayment row yet — create one
        const original = allPayments.find((p) => p.id === data.id);
        const merged = original ? { ...original, ...data } : data;
        return api.createMakePaymentPayment(merged);
      }
      // Freight-payment step updates go to the FreightPayment table
      if (step === "freight") {
        const uniqueNumber = data["Unique Number"] ||
          allPayments.find((p) => p.id === data.id)?.["Unique Number"];
        const freightMatch = uniqueNumber ? freightPaymentPayments.find((fp) =>
          fp["Unique Number"]?.trim().toLowerCase() === uniqueNumber.trim().toLowerCase()
        ) : undefined;
        if (freightMatch?.id) {
          return api.updateFreightPaymentRecord(freightMatch.id, data);
        }
        const original = allPayments.find((p) => p.id === data.id);
        const merged = original ? { ...original, ...data } : data;
        return api.createFreightPaymentPayment(merged);
      }
      // CheckKitting step updates go to the CheckKitting table
      const uniqueNumber = data["Unique Number"] ||
        allPayments.find((p) => p.id === data.id)?.["Unique Number"];
      const kittingRecord = checkKittingPayments.find((kp) =>
        kp["Unique Number"] && uniqueNumber &&
        kp["Unique Number"].trim().toLowerCase() === uniqueNumber.trim().toLowerCase()
      );
      if (kittingRecord?.id) {
        const { id, created_at, ...updateData } = data as any;
        return api.processKittingPayment({ ...updateData, "Unique Number": kittingRecord["Unique Number"] });
      }
      // Fallback: no-op promise so UI doesn't crash
      return Promise.resolve(data as any);
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
    (payment: FreightPayment, step: string, value: "yes" | "no", actualDate?: string, selectedStatus?: string, remark?: string, amount?: number) => {
      const today = actualDate || new Date().toISOString();
      const updateData: Partial<FreightPayment> & { id: number } = { id: payment.id! };

      if (step === "checkkitting") {
        updateData.Status3 = selectedStatus || (value === "yes" ? "Completed" : "Pending");
        if (remark !== undefined) updateData.Remark3 = remark;
        if (value === "yes") {
          updateData.Actual3 = today;
          updateData.Actual = today;
          updateData.Status_1 = "Completed";
          updateData.Status = "Completed";
          updateData.Planned2 = today;
          updateData.Status2 = "Pending";
        }
      } else if (step === "posting") {
        const finalStatus = selectedStatus || (value === "yes" ? "Done" : "Pending");
        updateData.Status_1 = finalStatus;
        if (amount !== undefined) updateData.Amount = amount;
        if (remark !== undefined) updateData.Remark_1 = remark;
        if (finalStatus === "Done") {
          updateData.Actual = today;
          updateData.Delay = calculateDelayWithHours(payment.Planned, today);
        }
      } else if (step === "makepayment" || step === "payment") {
        updateData.Status2 = selectedStatus || (value === "yes" ? "Completed" : "Pending");
        if (remark !== undefined) updateData.Remark2 = remark;
        if (value === "yes") {
          updateData.Actual2 = today;
          updateData.Delay2 = calculateDelayWithHours(payment.Planned2, today);
        }
      } else if (step === "freight") {
        updateData.Status = selectedStatus || (value === "yes" ? "Completed" : "Pending");
        if (remark !== undefined) updateData.Remark = remark;
        if (value === "yes") {
          updateData.Actual4 = today;
          updateData.Delay4 = calculateDelayWithHours(payment.Actual4 || payment.Actual2, today);
        }
      }

      quickUpdateMutation.mutate({ data: updateData, step });
    },
    [quickUpdateMutation]
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
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg ring-4 ring-brand-100 mb-2">
            <img src="/passary.jpeg" alt="PASMIN" className="w-full h-full object-cover" />
          </div>
          <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
          <p className="text-[12px] font-semibold text-slate-400 tracking-wide">Loading freight data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 relative">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

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
        />
      </div>

      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <AppHeader
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          pageTitle={pageTitle}
          pageDescription={pageDescription}
          isAdmin={isAdmin}
          userFirm={userFirm}
        />

        <main className="flex-1 overflow-y-auto main-scroll pb-16 lg:pb-0">
          <div className="p-3 md:p-5 xl:p-6 max-w-[1500px] mx-auto space-y-4 md:space-y-5 animate-fade-in">
            {activeTab === "dashboard" ? (
              <OperationsDashboard payments={payments} onNavigate={handleNavigate} onRefresh={() => refetch()} />
            ) : activeTab === "users" ? (
              <Suspense
                fallback={
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                  </div>
                }
              >
                <UserManagementLazy />
              </Suspense>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden">
                <Tabs value={subTab} onValueChange={(val) => setSubTab(val as any)} className="w-full">
                  <div className="px-4 md:px-6 py-4 border-b border-slate-100/80 bg-white/90 flex items-center justify-between flex-wrap gap-3">
                    <TabsList className="h-9 bg-slate-100/80">
                      <TabsTrigger
                        value="pending"
                        className="rounded-lg px-4 py-1.5 text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:text-brand-700 data-[state=active]:shadow-sm transition-all h-7"
                        style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
                      >
                        Pending
                      </TabsTrigger>
                      <TabsTrigger
                        value="history"
                        className="rounded-lg px-4 py-1.5 text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:text-brand-700 data-[state=active]:shadow-sm transition-all h-7"
                        style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
                      >
                        History
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {error ? (
                        <>
                          <WifiOff className="w-3 h-3 text-rose-500" />
                          <span className="text-rose-500">Offline mode</span>
                        </>
                      ) : (
                        <>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          <span>Live sync</span>
                        </>
                      )}
                    </div>
                  </div>

                  <TabsContent value="pending" className="mt-0">
                    {activeTab === "checkkitting" ? (
                      <FullKittingHistory />
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

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 mobile-nav-bg border-t border-slate-200 safe-pb">
        <div className="flex items-stretch justify-around px-1 py-1.5">
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
                  isActive ? "text-brand-600" : "text-slate-400"
                )}
              >
                <div className={cn("p-1.5 rounded-xl transition-all", isActive ? "bg-brand-50" : "")}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn("text-[10px] font-bold leading-none", isActive ? "text-brand-600" : "text-slate-400")}>
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
