import React, { useEffect, useState, useCallback } from "react";
import { FreightPayment } from "../types";
import { api } from "../api";
import { useMutation } from "@tanstack/react-query";
import { StatusBadge } from "./StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseISO, differenceInDays } from "date-fns";
import {
  AlertCircle,
  Calendar,
  Layers,
  Package,
  FileText,
  Banknote,
  Upload,
  X,
  CheckCircle2,
  Truck,
  MapPin,
  Hash,
  Building2,
  Image,
  DollarSign,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Constants ─── */
const FIRM_OPTIONS = ["Pmmpl", "Rkl", "Purab", "Refrasynth", "Refratech"];
const RATE_TYPE_OPTIONS = ["Per Ton", "Fixed", "Per Km", "Negotiated"];

interface FreightFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: FreightPayment;
  onSuccess: () => void;
  defaultStep?: string;
  userFirm?: string; // If set, auto-assigns firm and locks the dropdown
}

const formatDateForInput = (dateTimeStr?: string) => {
  if (!dateTimeStr) return "";
  return dateTimeStr.split(" ")[0].split("T")[0];
};

const formatDateForDisplay = (dateStr?: string) => {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export function FreightForm({
  open,
  onOpenChange,
  payment,
  onSuccess,
  defaultStep,
  userFirm,
}: FreightFormProps) {
  const [formData, setFormData] = useState<Partial<FreightPayment>>({});
  const [activeTab, setActiveTab] = useState(defaultStep || "checkkitting");
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      setActiveTab(defaultStep || "checkkitting");
      setErrors({});
      setTouched({});
    }
  }, [open, defaultStep]);

  useEffect(() => {
    if (payment) {
      setFormData(payment);
    } else {
      setFormData({
        Status: "Pending",
        "Rate Type": "Per Ton",
        Delay: 0,
        Delay2: 0,
        Delay3: 0,
        "Firm Name": userFirm || "",
      });
    }
  }, [payment, open, userFirm]);

  const mutation = useMutation({
    mutationFn: (data: Partial<FreightPayment>) => {
      // If we are on the posting tab, route to Posting table
      if (activeTab === "posting" && payment?.id !== undefined) {
        if (payment.id > 0) {
          return api.updatePostingPayment(payment.id, data);
        }
        return api.createPostingPayment({ ...payment, ...data });
      }
      // If we are on the makepayment tab, route to MakePayment table
      if (activeTab === "makepayment" && payment?.id !== undefined) {
        if (payment.id > 0) {
          return api.updateMakePaymentPayment(payment.id, data);
        }
        return api.createMakePaymentPayment({ ...payment, ...data });
      }
      // All other tabs (checkkitting, etc.) route to CheckKitting table
      return api.processKittingPayment({ ...data });
    },
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: any) => {
      setErrors({ submit: err?.message || "Failed to save shipment" });
    },
  });

  const calculateDelay = useCallback((planned?: string, actual?: string) => {
    if (!planned || !actual) return 0;
    try {
      const p = parseISO(planned);
      const a = parseISO(actual);
      const diff = differenceInDays(a, p);
      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
  }, []);

  const updateField = useCallback(
    (field: keyof FreightPayment, value: any) => {
      const updated = { ...formData, [field]: value };

      // Auto-calculate delays when dates change
      if (field === "Planned" || field === "Actual") {
        updated.Delay = calculateDelay(updated.Planned, updated.Actual);
      }
      if (field === "Planned2" || field === "Actual2") {
        updated.Delay2 = calculateDelay(updated.Planned2, updated.Actual2);
      }
      if (field === "Planned3" || field === "Actual3") {
        updated.Delay3 = calculateDelay(updated.Planned3, updated.Actual3);
      }

      setFormData(updated);
      if (errors[field as string]) {
        setErrors((prev) => ({ ...prev, [field as string]: "" }));
      }
    },
    [formData, calculateDelay, errors]
  );

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData["Payment Number"]?.trim()) newErrors["Payment Number"] = "Payment number is required";
    if (!formData["Unique Number"]?.trim()) newErrors["Unique Number"] = "Unique number is required";
    if (!formData["Firm Name"]?.trim()) newErrors["Firm Name"] = "Firm name is required";
    if (!formData["Transporter Name"]?.trim()) newErrors["Transporter Name"] = "Transporter name is required";
    if (!formData["Vehicle Number"]?.trim()) newErrors["Vehicle Number"] = "Vehicle number is required";
    if (formData.Amount !== undefined && formData.Amount <= 0) newErrors.Amount = "Amount must be greater than 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate(formData);
  };

  const isPending = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-4xl w-[94vw] h-[85vh] bg-white border border-slate-200/60 shadow-2xl flex flex-col p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
                {payment ? "Edit Shipment" : "Create New Shipment"}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-400 font-medium mt-0.5">
                {payment
                  ? "Update logistics parameters and track step-by-step progress."
                  : "Add a new freight shipment to the system."}
              </DialogDescription>
            </div>
            {payment && (
              <div className="hidden sm:block text-right">
                <div className="text-[10px] text-slate-400">Shipment ID</div>
                <div className="text-xs font-mono font-bold text-slate-700">{payment.id}</div>
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-6">
            {/* Submit Error */}
            {errors.submit && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-rose-50 border border-rose-200/60 rounded-xl">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-xs font-semibold text-rose-600">{errors.submit}</span>
              </div>
            )}

            {/* Freight Master Data Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Freight Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/40 p-5 rounded-xl border border-slate-100">
                {/* Payment Number */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Payment Number <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    className={cn(
                      "h-9 bg-white border-slate-200 rounded-lg text-sm",
                      touched["Payment Number"] && errors["Payment Number"] && "border-rose-300 focus:ring-rose-500"
                    )}
                    value={formData["Payment Number"] || ""}
                    onChange={(e) => updateField("Payment Number", e.target.value)}
                    onBlur={() => handleBlur("Payment Number")}
                    placeholder="e.g., PAY-001"
                  />
                  {touched["Payment Number"] && errors["Payment Number"] && (
                    <p className="text-[9px] font-medium text-rose-500">{errors["Payment Number"]}</p>
                  )}
                </div>

                {/* Unique Number */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Unique Number <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    className={cn(
                      "h-9 bg-white border-slate-200 rounded-lg text-sm font-mono",
                      touched["Unique Number"] && errors["Unique Number"] && "border-rose-300"
                    )}
                    value={formData["Unique Number"] || ""}
                    onChange={(e) => updateField("Unique Number", e.target.value)}
                    onBlur={() => handleBlur("Unique Number")}
                    placeholder="e.g., UNQ-1001"
                  />
                  {touched["Unique Number"] && errors["Unique Number"] && (
                    <p className="text-[9px] font-medium text-rose-500">{errors["Unique Number"]}</p>
                  )}
                </div>

                {/* Firm Name */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Firm <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={formData["Firm Name"] || ""}
                    onValueChange={(v) => updateField("Firm Name", v)}
                    disabled={!!userFirm}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-9 bg-white border-slate-200 rounded-lg text-sm",
                        userFirm && "opacity-70 cursor-not-allowed",
                        touched["Firm Name"] && errors["Firm Name"] && "border-rose-300"
                      )}
                    >
                      <SelectValue placeholder="Select firm" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIRM_OPTIONS.map((firm) => (
                        <SelectItem key={firm} value={firm}>
                          {firm}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {touched["Firm Name"] && errors["Firm Name"] && (
                    <p className="text-[9px] font-medium text-rose-500">{errors["Firm Name"]}</p>
                  )}
                </div>

                {/* FMS Name */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">FMS Name</Label>
                  <Input
                    className="h-9 bg-white border-slate-200 rounded-lg text-sm"
                    value={formData["Fms Name"] || ""}
                    onChange={(e) => updateField("Fms Name", e.target.value)}
                    placeholder="e.g., FMS-A"
                  />
                </div>

                {/* Transporter Name */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Transporter <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    className={cn(
                      "h-9 bg-white border-slate-200 rounded-lg text-sm",
                      touched["Transporter Name"] && errors["Transporter Name"] && "border-rose-300"
                    )}
                    value={formData["Transporter Name"] || ""}
                    onChange={(e) => updateField("Transporter Name", e.target.value)}
                    onBlur={() => handleBlur("Transporter Name")}
                    placeholder="e.g., Fast Freight"
                  />
                  {touched["Transporter Name"] && errors["Transporter Name"] && (
                    <p className="text-[9px] font-medium text-rose-500">{errors["Transporter Name"]}</p>
                  )}
                </div>

                {/* Vehicle Number */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Vehicle No. <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    className={cn(
                      "h-9 bg-white border-slate-200 rounded-lg text-sm font-mono",
                      touched["Vehicle Number"] && errors["Vehicle Number"] && "border-rose-300"
                    )}
                    value={formData["Vehicle Number"] || ""}
                    onChange={(e) => updateField("Vehicle Number", e.target.value)}
                    onBlur={() => handleBlur("Vehicle Number")}
                    placeholder="e.g., MH-12-AB-1234"
                  />
                  {touched["Vehicle Number"] && errors["Vehicle Number"] && (
                    <p className="text-[9px] font-medium text-rose-500">{errors["Vehicle Number"]}</p>
                  )}
                </div>

                {/* From Location */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> From
                  </Label>
                  <Input
                    className="h-9 bg-white border-slate-200 rounded-lg text-sm"
                    value={formData.From || ""}
                    onChange={(e) => updateField("From", e.target.value)}
                    placeholder="Origin city"
                  />
                </div>

                {/* To Location */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> To
                  </Label>
                  <Input
                    className="h-9 bg-white border-slate-200 rounded-lg text-sm"
                    value={formData.To || ""}
                    onChange={(e) => updateField("To", e.target.value)}
                    placeholder="Destination city"
                  />
                </div>

                {/* Material Details */}
                <div className="space-y-1 lg:col-span-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Material Details</Label>
                  <Input
                    className="h-9 bg-white border-slate-200 rounded-lg text-sm"
                    value={formData["Material Load Details"] || ""}
                    onChange={(e) => updateField("Material Load Details", e.target.value)}
                    placeholder="e.g., Steel Coils, Electronics, Textiles..."
                  />
                </div>

                {/* Bilty Number */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bilty Number</Label>
                  <Input
                    className="h-9 bg-white border-slate-200 rounded-lg text-sm font-mono"
                    value={formData["Bilty Number"] || ""}
                    onChange={(e) => updateField("Bilty Number", e.target.value)}
                    placeholder="e.g., BLT-8921"
                  />
                </div>

                {/* Party Name */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Party Name</Label>
                  <Input
                    className="h-9 bg-white border-slate-200 rounded-lg text-sm"
                    value={formData["Party Name"] || ""}
                    onChange={(e) => updateField("Party Name", e.target.value)}
                    placeholder="e.g., Party Name"
                  />
                </div>

                {/* Billing Qty */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Billing Qty</Label>
                  <Input
                    type="number"
                    className="h-9 bg-white border-slate-200 rounded-lg text-sm"
                    value={formData["Billing Qty"] ?? ""}
                    onChange={(e) => updateField("Billing Qty", e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="e.g., 25"
                  />
                </div>

                {/* Bill Number */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bill Number</Label>
                  <Input
                    className="h-9 bg-white border-slate-200 rounded-lg text-sm font-mono"
                    value={formData["Bill Number"] || ""}
                    onChange={(e) => updateField("Bill Number", e.target.value)}
                    placeholder="e.g., BILL-1234"
                  />
                </div>

                {/* Rate Type */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rate Type</Label>
                  <Select
                    value={formData["Rate Type"] || "Per Ton"}
                    onValueChange={(v) => updateField("Rate Type", v)}
                  >
                    <SelectTrigger className="h-9 bg-white border-slate-200 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RATE_TYPE_OPTIONS.map((rt) => (
                        <SelectItem key={rt} value={rt}>
                          {rt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Amount (₹)
                  </Label>
                  <Input
                    type="number"
                    className={cn(
                      "h-9 bg-white border-slate-200 rounded-lg text-sm font-semibold",
                      touched.Amount && errors.Amount && "border-rose-300"
                    )}
                    value={formData.Amount || 0}
                    onChange={(e) => updateField("Amount", parseFloat(e.target.value) || 0)}
                    onBlur={() => handleBlur("Amount")}
                    min={0}
                    step={100}
                  />
                  {touched.Amount && errors.Amount && (
                    <p className="text-[9px] font-medium text-rose-500">{errors.Amount}</p>
                  )}
                </div>

                {/* Bilty Image */}
                <div className="space-y-1 lg:col-span-3">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Image className="w-3 h-3" /> Bilty Image
                  </Label>
                  {formData["Bilty Image"] ? (
                    <div className="flex items-center gap-3 h-9 bg-white border border-slate-200 rounded-lg px-3">
                      <a
                        href={formData["Bilty Image"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 font-semibold hover:underline truncate flex-1"
                      >
                        View uploaded image
                      </a>
                      <button
                        type="button"
                        onClick={() => updateField("Bilty Image", "")}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <label
                        className={cn(
                          "flex items-center justify-center gap-2 h-9 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-500 cursor-pointer hover:bg-slate-50 transition-colors",
                          isUploading && "opacity-50 pointer-events-none"
                        )}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {isUploading ? "Uploading..." : "Click to upload"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsUploading(true);
                              try {
                                const url = await api.uploadBiltyImage(file);
                                updateField("Bilty Image", url);
                              } catch {
                                setErrors((prev) => ({
                                  ...prev,
                                  biltyImage: "Upload failed. Check bucket permissions.",
                                }));
                              } finally {
                                setIsUploading(false);
                              }
                            }
                          }}
                        />
                      </label>
                      {errors.biltyImage && (
                        <p className="text-[9px] font-medium text-rose-500 mt-1">{errors.biltyImage}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Process Steps Section (only for edit) */}
            {payment && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Workflow Steps</h3>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl mb-5">
                    <TabsTrigger
                      value="checkkitting"
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] font-bold py-2"
                    >
                      <Package className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                      Kitting
                    </TabsTrigger>
                    <TabsTrigger
                      value="posting"
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] font-bold py-2"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                      Posting
                    </TabsTrigger>
                    <TabsTrigger
                      value="makepayment"
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] font-bold py-2"
                    >
                      <Banknote className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                      Payment
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="checkkitting" className="mt-0">
                    <StepCard
                      title="Check Kitting"
                      status={formData.Status3}
                      onStatusChange={(v) => updateField("Status3", v)}
                      statusOptions={["Pending", "Verified", "Done"]}
                      color="emerald"
                    />
                  </TabsContent>

                  <TabsContent value="posting" className="mt-0">
                    <StepCard
                      title="Posting"
                      status={formData.Status_1}
                      onStatusChange={(v) => updateField("Status_1", v)}
                      statusOptions={["Pending", "InProgress", "Done"]}
                      color="blue"
                    />
                  </TabsContent>

                  <TabsContent value="makepayment" className="mt-0">
                    <StepCard
                      title="Make Payment"
                      status={formData.Status2}
                      onStatusChange={(v) => updateField("Status2", v)}
                      statusOptions={["Pending", "Requested", "Completed"]}
                      color="amber"
                    />
                  </TabsContent>
                </Tabs>

                {/* Overall Status */}
                <div className="bg-slate-50/60 rounded-xl border border-slate-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Layers className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-800">Overall Status</p>
                      <p className="text-[9px] text-slate-400">Final state of the transaction</p>
                    </div>
                  </div>
                  <div className="w-full sm:w-56">
                    <Select value={formData.Status} onValueChange={(v) => updateField("Status", v)}>
                      <SelectTrigger className="h-9 bg-white border-slate-200 rounded-lg text-sm font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending Review</SelectItem>
                        <SelectItem value="Processing">Financial Processing</SelectItem>
                        <SelectItem value="Completed">Transaction Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="mx-0 mb-0 px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex flex-col-reverse sm:flex-row gap-2 sm:items-center sm:justify-between shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-lg w-full sm:w-auto px-5 h-10 border-slate-200 bg-white text-slate-600 font-semibold text-xs hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-lg w-full sm:w-auto px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : payment ? (
                "Save Changes"
              ) : (
                "Create Shipment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Step Card Component ─── */
interface StepCardProps {
  title: string;
  status?: string;
  onStatusChange: (v: string) => void;
  statusOptions: string[];
  color: "emerald" | "blue" | "amber";
}

function StepCard({
  title,
  status,
  onStatusChange,
  statusOptions,
  color,
}: StepCardProps) {
  const colorStyles = {
    emerald: {
      border: "border-emerald-100",
      bg: "bg-emerald-50/40",
      label: "text-emerald-700",
    },
    blue: {
      border: "border-blue-100",
      bg: "bg-blue-50/40",
      label: "text-blue-700",
    },
    amber: {
      border: "border-amber-100",
      bg: "bg-amber-50/40",
      label: "text-amber-700",
    },
  };
  const cs = colorStyles[color];

  return (
    <div className={cn("border rounded-xl p-5 space-y-4", cs.border, cs.bg)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      </div>

      <div className="flex items-center justify-end">
        <div className="flex items-center justify-center bg-white rounded-lg border border-slate-100 px-3 py-2">
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-9 bg-white border-slate-200 rounded-lg text-sm font-medium">
            <SelectValue placeholder="Update status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
