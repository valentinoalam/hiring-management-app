import { Button } from "@/components/ui/button.js";
import { MapPin, Banknote } from "lucide-react";
import Image from "next/image.js";

interface JobDetailProps {
  title: string;
  company: string;
  logo: string;
  salary: string;
  location: string;
  type: string;
  description: string;
  onApply: () => void;
}

export default function JobDetail({
  title,
  company,
  logo,
  salary,
  location,
  type,
  description,
  onApply
}: JobDetailProps) {
  return (
    <div className="flex flex-col border border-neutral-40 rounded-lg p-6 gap-6 flex-1 h-fit">
      <div className="flex flex-col gap-4 pb-6 border-b border-neutral-40">
        <div className="flex items-start gap-6">
          <Image width={48} height={48}
            src={logo}
            alt={`${company} logo`}
            className="w-12 h-12 rounded border border-neutral-40 shrink-0"
          />
          <div className="flex flex-col gap-2 flex-1">
            <div className="inline-flex">
              <span className="px-2 py-0.5 bg-success text-white text-xs font-bold leading-5 rounded">
                {type}
              </span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-neutral-90 font-bold text-lg leading-7">
                {title}
              </h1>
              <p className="text-neutral-70 text-sm leading-6">{company}</p>
            </div>
            <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-neutral-80 shrink-0" />
            <span className="text-neutral-80 text-xs leading-5">{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Banknote className="w-4 h-4 text-neutral-80 shrink-0" />
            <span className="text-neutral-80 text-xs leading-5">{salary}</span>
          </div>
        </div>
          </div>
          <Button onClick={onApply} className="px-4 py-1 bg-secondary text-neutral-90 font-bold text-sm leading-6 rounded-lg shadow-sm hover:bg-secondary/90 transition-colors">
            Apply
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="text-neutral-90 text-sm leading-6 whitespace-pre-line">
          <p>{description}</p>
          {/* <p>This role involves developing cutting-edge software solutions and collaborating with cross-functional teams. We are looking for a candidate with strong problem-solving skills and a passion for technology.</p>
          <h3 className="mt-4 font-semibold text-lg">Requirements</h3>
          <ul>
              <li>5+ years of experience in relevant field.</li>
              <li>Proficiency in modern web frameworks (e.g., React, Next.js).</li>
              <li>Strong knowledge of database design and SQL.</li>
          </ul> */}
        </div>
      </div>
    </div>
  );
}