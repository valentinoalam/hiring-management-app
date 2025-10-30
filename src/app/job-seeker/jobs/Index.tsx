import { useState } from "react";
import { ArrowLeft, Upload, Calendar, ChevronDown } from "lucide-react";
import { JobOpeningModal } from "@/components/JobOpeningModal";
import { Button } from "@/components/ui/button";

export default function Index() {
  const [showJobOpeningModal, setShowJobOpeningModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    pronoun: "",
    domicile: "",
    phoneNumber: "",
    email: "",
    linkedinUrl: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleJobOpeningSubmit = (data: any) => {
    console.log("Job Opening Form Submitted:", data);
    setShowJobOpeningModal(false);
  };

  return (
    <div className="min-h-screen bg-neutral-10 flex items-center justify-center p-4 sm:p-6 md:p-10">
      <JobOpeningModal
        open={showJobOpeningModal}
        onOpenChange={setShowJobOpeningModal}
        onSubmit={handleJobOpeningSubmit}
      />

      <div className="w-full max-w-[700px] border border-neutral-40 bg-neutral-10 rounded-none shadow-sm">
        <div className="p-6 sm:p-8 md:p-10 flex flex-col gap-6">
          <header className="flex items-start gap-4">
            <button
              className="flex items-center justify-center p-1 border border-neutral-40 bg-neutral-10 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-100" strokeWidth={2} />
            </button>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <h1 className="text-lg font-bold leading-7 text-neutral-100 font-sans">
                Apply Front End at Rakamin
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-start gap-2 text-sm leading-6 text-neutral-90 font-sans">
                  <span className="text-blue-500">ℹ️</span>
                  <span className="whitespace-nowrap">This field required to fill</span>
                </div>
                <Button
                  onClick={() => setShowJobOpeningModal(true)}
                  className="bg-primary text-neutral-10 hover:bg-primary/90 px-4 py-2 h-10 rounded-lg text-sm font-bold"
                >
                  Post Job
                </Button>
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold leading-5 text-danger-main font-sans">
              * Required
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold leading-5 text-neutral-90 font-sans">
                Photo Profile
              </label>
              <div
                className="w-32 h-32 rounded-2xl bg-gradient-to-br from-cyan-200 to-teal-500 flex items-center justify-center"
                style={{
                  backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 128 128%22%3E%3Ccircle cx=%2264%22 cy=%2264%22 r=%2264%22 fill=%22%23B8E6E6%22/%3E%3Cpath d=%22M64 70c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z%22 fill=%22%23666%22/%3E%3Cpath d=%22M30 110c0-20 15-35 34-35s34 15 34 35%22 fill=%22%23047C7C%22/%3E%3C/svg%3E')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <button className="inline-flex items-center justify-center gap-1 px-4 py-1 border border-neutral-40 bg-neutral-10 rounded-lg shadow-sm hover:bg-gray-50 transition-colors w-fit">
                <Upload className="w-4 h-4 text-neutral-100" strokeWidth={2} />
                <span className="text-sm font-bold leading-6 text-neutral-100 font-sans">
                  Take a Pitcure
                </span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs leading-5 text-neutral-90 font-sans">
                Full name<span className="text-danger-main">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className="h-10 px-4 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs leading-5 text-neutral-90 font-sans">
                Date of birth<span className="text-danger-main">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Calendar className="w-4 h-4 text-neutral-100" />
                </div>
                <input
                  type="text"
                  placeholder="Select date of birth"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  className="w-full h-10 pl-12 pr-12 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-neutral-100" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs leading-5 text-neutral-90 font-sans">
                Pronoun (gender)<span className="text-danger-main">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pronoun"
                    value="female"
                    checked={formData.pronoun === "female"}
                    onChange={(e) => handleInputChange("pronoun", e.target.value)}
                    className="w-6 h-6 border-2 border-neutral-90 rounded-full appearance-none checked:border-8 checked:border-neutral-90 cursor-pointer"
                  />
                  <span className="text-sm leading-6 text-neutral-90 font-sans">
                    She/her (Female)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pronoun"
                    value="male"
                    checked={formData.pronoun === "male"}
                    onChange={(e) => handleInputChange("pronoun", e.target.value)}
                    className="w-6 h-6 border-2 border-neutral-90 rounded-full appearance-none checked:border-8 checked:border-neutral-90 cursor-pointer"
                  />
                  <span className="text-sm leading-6 text-neutral-90 font-sans">
                    He/him (Male)
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs leading-5 text-neutral-90 font-sans">
                Domicile<span className="text-danger-main">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.domicile}
                  onChange={(e) => handleInputChange("domicile", e.target.value)}
                  className="w-full h-10 px-4 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-60 font-sans appearance-none focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent cursor-pointer"
                >
                  <option value="">Choose your domicile</option>
                  <option value="jakarta">Jakarta</option>
                  <option value="bandung">Bandung</option>
                  <option value="surabaya">Surabaya</option>
                  <option value="yogyakarta">Yogyakarta</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-neutral-100" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs leading-5 text-neutral-90 font-sans">
                Phone number<span className="text-danger-main">*</span>
              </label>
              <div className="flex h-10 border-2 border-neutral-40 bg-neutral-10 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-neutral-100 focus-within:border-transparent">
                <div className="flex items-center gap-1 px-4 border-r border-neutral-40">
                  <div className="w-4 h-4 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    <svg viewBox="0 0 16 16" className="w-full h-full">
                      <rect width="16" height="5.33" fill="#CE1126" />
                      <rect y="10.67" width="16" height="5.33" fill="#CE1126" />
                      <rect y="5.33" width="16" height="5.33" fill="#FFF" />
                    </svg>
                  </div>
                  <ChevronDown className="w-4 h-4 text-neutral-100" strokeWidth={1.5} />
                </div>
                <span className="flex items-center px-3 text-sm leading-6 text-neutral-90 font-sans border-r border-neutral-40">
                  +62
                </span>
                <input
                  type="tel"
                  placeholder="81XXXXXXXXX"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  className="flex-1 px-4 text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs leading-5 text-neutral-90 font-sans">
                Email<span className="text-danger-main">*</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="h-10 px-4 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs leading-5 text-neutral-90 font-sans">
                Link Linkedin<span className="text-danger-main">*</span>
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={formData.linkedinUrl}
                onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                className="h-10 px-4 py-2 border-2 border-neutral-40 bg-neutral-10 rounded-lg text-sm leading-6 text-neutral-100 placeholder:text-neutral-60 font-sans focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
