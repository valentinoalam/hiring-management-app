import { MapPin, DollarSign } from "lucide-react";
import Image from "next/image";

interface JobCardProps {
  title: string;
  company: string;
  location: string;
  salary: string;
  logo: string;
  isActive?: boolean;
  onClick?: () => void;
}

export default function JobCard({
  title,
  company,
  location,
  salary,
  logo,
  isActive = false,
  onClick,
}: JobCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        flex flex-col rounded-lg p-3 gap-2 cursor-pointer transition-all
        ${
          isActive
            ? "border-2 border-primary-hover bg-primary-surface"
            : "border border-transparent bg-white hover:border-neutral-40"
        }
      `}
    >
      <div className="flex items-start gap-4">
        <Image width={48} height={48}
          src={logo}
          alt={`${company} logo`}
          className="w-12 h-12 rounded border border-neutral-40 shrink-0"
        />
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="text-neutral-90 font-bold text-base leading-7 truncate">
            {title}
          </h3>
          <p className="text-neutral-90 text-sm leading-6">{company}</p>
        </div>
      </div>

      <div className="border-t border-dashed border-neutral-40"></div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4 text-neutral-80 shrink-0" />
          <span className="text-neutral-80 text-xs leading-5">{location}</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-neutral-80 shrink-0" />
          <span className="text-neutral-80 text-xs leading-5">{salary}</span>
        </div>
      </div>
    </div>
  );
}
