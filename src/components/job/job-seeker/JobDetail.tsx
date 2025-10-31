interface JobDetailProps {
  title: string;
  company: string;
  logo: string;
  type: string;
  description: string;
}

export default function JobDetail({
  title,
  company,
  logo,
  type,
  description,
}: JobDetailProps) {
  return (
    <div className="flex flex-col border border-neutral-40 rounded-lg p-6 gap-6 flex-1 h-fit">
      <div className="flex flex-col gap-4 pb-6 border-b border-neutral-40">
        <div className="flex items-start gap-6">
          <img
            src={logo}
            alt={`${company} logo`}
            className="w-12 h-12 rounded border border-neutral-40 flex-shrink-0"
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
          </div>
          <button className="px-4 py-1 bg-secondary text-neutral-90 font-bold text-sm leading-6 rounded-lg shadow-sm hover:bg-secondary/90 transition-colors">
            Apply
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="text-neutral-90 text-sm leading-6 whitespace-pre-line">
          {description}
        </div>
      </div>
    </div>
  );
}
