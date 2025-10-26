import React from "react";

interface DonationCardProps {
  image: string;
  title: string;
  organization: string;
  collected: number;
  target: number;
  daysLeft: number;
}

export const DonationCard: React.FC<DonationCardProps> = ({
  image,
  title,
  organization,
  collected,
  target,
  daysLeft,
}) => {
  const progress = (collected / target) * 100;

  return (
    <div className="flex flex-col gap-7 shadow-[0px_10px_20px_rgba(179,116,55,0.10)] bg-[#FFFBF8] rounded-[15px] max-md:w-full">
      <img
        src={image}
        alt={title}
        className="w-[560px] h-[359px] rounded-[15px_15px_0_0] max-md:w-full max-md:h-auto object-cover"
      />
      <div className="pt-5 pb-10 px-5 max-sm:p-[15px]">
        <h3 className="text-[#2E2E2E] text-3xl font-semibold leading-9 w-[443px] mb-7 max-sm:text-2xl max-sm:w-full">
          {title}
        </h3>
        <div className="flex items-center gap-[3px] mb-7">
          <span className="text-black text-lg font-normal">{organization}</span>
          <i className="ti ti-check-circle text-[#86BE91] text-sm" />
        </div>
        <div className="mb-7 px-0 py-2.5">
          <div className="w-[510px] h-3.5 relative bg-[#FCEBDB] rounded-[20px] max-sm:w-full">
            <div
              className="h-3.5 absolute bg-[#F5C292] rounded-[20px] left-0 top-0"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="text-black">
          <div className="text-[22px] font-normal mb-2.5">Terkumpul</div>
          <div className="text-[22px] font-medium mb-2.5">
            Rp {collected.toLocaleString()} dari target Rp{" "}
            {target.toLocaleString()}
          </div>
          <div className="text-lg font-normal">{daysLeft} hari lagi</div>
        </div>
      </div>
    </div>
  );
};
